const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { uploadFile, openDownloadStream, deleteFile, getFileInfo } = require('../utils/gridfs');

const AVATAR_BUCKET = 'user_avatars';

const uploadUserAvatar = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  if (user.avatarFileId) {
    try {
      await deleteFile(user.avatarFileId, AVATAR_BUCKET);
    } catch {
      // ignore stale file reference
    }
  }

  const fileId = await uploadFile(
    file.buffer,
    file.originalname,
    { userId: userId.toString(), mimeType: file.mimetype },
    AVATAR_BUCKET
  );

  user.avatarFileId = fileId;
  await user.save();
  return user;
};

const streamUserAvatar = async (userId) => {
  const user = await User.findById(userId);
  if (!user?.avatarFileId) throw new AppError('No profile photo.', 404);

  const info = await getFileInfo(user.avatarFileId, AVATAR_BUCKET);
  if (!info) throw new AppError('Profile photo not found.', 404);

  const stream = openDownloadStream(user.avatarFileId, AVATAR_BUCKET);
  const contentType = info.metadata?.mimeType || info.contentType || 'image/jpeg';
  return { stream, contentType };
};

module.exports = { uploadUserAvatar, streamUserAvatar };
