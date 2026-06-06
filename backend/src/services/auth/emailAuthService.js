const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const { AppError } = require('../../middlewares/errorHandler');
const { createActionToken, verifyActionToken, consumeActionToken } = require('../email/actionTokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../email/emailService');

const skipEmailVerify = () =>
  process.env.SKIP_EMAIL_VERIFY === 'true' || process.env.NODE_ENV === 'test';

const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

const GENERIC_RESEND_MESSAGE =
  'If an account exists and is not verified, a verification email has been sent.';

const verifyEmail = async (token) => {
  const { userId, stored } = await verifyActionToken(token, 'email_verify');
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  await user.save();
  await consumeActionToken(stored);

  return user;
};

const resendVerification = async (email) => {
  const user = await User.findOne({ email });
  if (!user || user.isEmailVerified) {
    return { message: GENERIC_RESEND_MESSAGE };
  }

  const { token } = await createActionToken(user._id, 'email_verify');
  await sendVerificationEmail(user, token);

  return { message: GENERIC_RESEND_MESSAGE };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  const { token } = await createActionToken(user._id, 'password_reset');
  await sendPasswordResetEmail(user, token);

  return { message: GENERIC_RESET_MESSAGE };
};

const resetPassword = async (token, password) => {
  const { userId, stored } = await verifyActionToken(token, 'password_reset');
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  user.password = password;
  await user.save();
  await consumeActionToken(stored);
  await RefreshToken.deleteMany({ user: user._id });

  return user;
};

const sendRegistrationVerification = async (user) => {
  const { token } = await createActionToken(user._id, 'email_verify');
  await sendVerificationEmail(user, token);
};

module.exports = {
  skipEmailVerify,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendRegistrationVerification,
  GENERIC_RESET_MESSAGE,
  GENERIC_RESEND_MESSAGE,
};
