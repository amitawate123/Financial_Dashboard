const userService = require('../services/userService');

const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (err) {
    next(err);
  }
};

const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await userService.setUserStatus(req.params.id, isActive, req.user);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}.`, data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, setUserStatus, deleteUser };
