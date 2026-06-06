const emailAuth = require('../services/auth/emailAuthService');
const authService = require('../services/authService');

const verifyEmail = async (req, res, next) => {
  try {
    const user = await emailAuth.verifyEmail(req.body.token);
    const tokens = await authService.issueTokens(user);
    res.json({
      success: true,
      message: 'Email verified successfully. You are now signed in.',
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      data: tokens.user,
    });
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { message } = await emailAuth.resendVerification(req.body.email);
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { message } = await emailAuth.forgotPassword(req.body.email);
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await emailAuth.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Password updated. You can sign in with your new password.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyEmail, resendVerification, forgotPassword, resetPassword };
