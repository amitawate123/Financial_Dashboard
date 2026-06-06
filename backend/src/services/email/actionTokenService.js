const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AuthActionToken = require('../../models/AuthActionToken');
const { AppError } = require('../../middlewares/errorHandler');
const { hashToken } = require('../../utils/tokenUtils');

const PURPOSE_CONFIG = {
  email_verify: {
    secretEnv: 'JWT_EMAIL_VERIFY_SECRET',
    fallbackSecretEnv: 'JWT_SECRET',
    expiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRES_IN || '24h',
  },
  password_reset: {
    secretEnv: 'JWT_PASSWORD_RESET_SECRET',
    fallbackSecretEnv: 'JWT_SECRET',
    expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h',
  },
};

const getSecret = (purpose) => {
  const cfg = PURPOSE_CONFIG[purpose];
  return process.env[cfg.secretEnv] || process.env[cfg.fallbackSecretEnv];
};

const revokeActiveTokens = async (userId, purpose) => {
  await AuthActionToken.updateMany(
    { user: userId, purpose, usedAt: null },
    { usedAt: new Date() }
  );
};

const createActionToken = async (userId, purpose) => {
  const cfg = PURPOSE_CONFIG[purpose];
  const secret = getSecret(purpose);
  if (!secret) throw new AppError('Server email token configuration is missing.', 500);

  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign({ sub: userId.toString(), purpose, jti }, secret, {
    expiresIn: cfg.expiresIn,
  });

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await revokeActiveTokens(userId, purpose);
  await AuthActionToken.create({
    user: userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
};

const verifyActionToken = async (rawToken, expectedPurpose) => {
  const cfg = PURPOSE_CONFIG[expectedPurpose];
  const secret = getSecret(expectedPurpose);
  if (!secret) throw new AppError('Server email token configuration is missing.', 500);

  let decoded;
  try {
    decoded = jwt.verify(rawToken, secret);
  } catch {
    throw new AppError('Invalid or expired link. Please request a new one.', 400);
  }

  if (decoded.purpose !== expectedPurpose) {
    throw new AppError('Invalid or expired link. Please request a new one.', 400);
  }

  const stored = await AuthActionToken.findOne({
    tokenHash: hashToken(rawToken),
    purpose: expectedPurpose,
    usedAt: null,
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired link. Please request a new one.', 400);
  }

  if (stored.user.toString() !== decoded.sub) {
    throw new AppError('Invalid or expired link. Please request a new one.', 400);
  }

  return { userId: decoded.sub, stored };
};

const consumeActionToken = async (stored) => {
  stored.usedAt = new Date();
  await stored.save();
};

module.exports = {
  createActionToken,
  verifyActionToken,
  consumeActionToken,
};
