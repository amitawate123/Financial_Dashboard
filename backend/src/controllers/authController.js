const authService = require('../services/authService');
const avatarService = require('../services/avatarService');

const tokenPayload = ({ user, token, refreshToken }) => ({
  success: true,
  token,
  refreshToken,
  data: user,
});

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    if (result.requiresVerification) {
      return res.status(201).json({
        success: true,
        requiresVerification: true,
        message: result.message,
        data: { email: result.user.email, name: result.user.name },
      });
    }

    res.status(201).json({
      ...tokenPayload(result),
      message: 'Account created successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ ...tokenPayload(result), message: 'Login successful.' });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ ...tokenPayload(result), message: 'Token refreshed successfully.' });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

const getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};

const uploadAvatar = async (req, res, next) => {
  try {
    const user = await avatarService.uploadUserAvatar(req.user._id, req.file);
    res.json({ success: true, message: 'Profile photo updated.', data: user });
  } catch (err) {
    next(err);
  }
};

const getAvatar = async (req, res, next) => {
  try {
    const { stream, contentType } = await avatarService.streamUserAvatar(req.user._id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getMe, uploadAvatar, getAvatar };
