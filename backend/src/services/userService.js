const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

const getAllUsers = async ({ page = 1, limit = 10, search, role, isActive }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const updateUser = async (id, updates, requestingUser) => {
  // Non-admins can only update themselves and cannot change roles
  if (requestingUser.role !== 'admin') {
    if (requestingUser._id.toString() !== id) {
      throw new AppError('You can only update your own profile.', 403);
    }
    delete updates.role;
    delete updates.isActive;
  }

  const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const setUserStatus = async (id, isActive, requestingUser) => {
  if (requestingUser._id.toString() === id) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const deleteUser = async (id, requestingUser) => {
  if (requestingUser._id.toString() === id) {
    throw new AppError('You cannot delete your own account.', 400);
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError('User not found.', 404);
};

module.exports = { getAllUsers, getUserById, updateUser, setUserStatus, deleteUser };
