const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { AppError } = require('../middlewares/errorHandler');
const { hashToken, parseExpiryMs } = require('../utils/tokenUtils');
const emailAuth = require('./auth/emailAuthService');

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
  });

const createRefreshToken = async (userId) => {
  const raw = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(
    Date.now() + parseExpiryMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
  );
  await RefreshToken.create({ user: userId, tokenHash: hashToken(raw), expiresAt });
  return raw;
};

const issueTokens = async (user) => {
  const token = signAccessToken(user._id);
  const refreshToken = await createRefreshToken(user._id);
  return { user, token, refreshToken };
};

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already in use.', 409);

  const isVerified = emailAuth.skipEmailVerify();
  const user = await User.create({
    name,
    email,
    password,
    role,
    isEmailVerified: isVerified,
    ...(isVerified ? { emailVerifiedAt: new Date() } : {}),
  });

  if (isVerified) {
    return { ...await issueTokens(user), requiresVerification: false };
  }

  await emailAuth.sendRegistrationVerification(user);
  return {
    user,
    requiresVerification: true,
    message: 'Account created. Please check your email to verify your account.',
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact an admin.', 403);
  }

  // Only block when explicitly unverified (legacy users may have undefined → treated as verified)
  if (user.isEmailVerified === false && !emailAuth.skipEmailVerify()) {
    throw new AppError(
      'Please verify your email before signing in. Check your inbox or request a new link.',
      403,
      { code: 'EMAIL_NOT_VERIFIED' }
    );
  }

  await RefreshToken.deleteMany({ user: user._id });
  user.password = undefined;
  return issueTokens(user);
};

const refresh = async (rawRefreshToken) => {
  if (!rawRefreshToken) throw new AppError('Refresh token is required.', 401);

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawRefreshToken) }).populate('user');
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = stored.user;
  if (!user) throw new AppError('Invalid or expired refresh token.', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403);
  if (user.isEmailVerified === false && !emailAuth.skipEmailVerify()) {
    throw new AppError('Please verify your email before continuing.', 403);
  }

  await RefreshToken.deleteOne({ _id: stored._id });
  return issueTokens(user);
};

const logout = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(rawRefreshToken) });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  issueTokens,
};
