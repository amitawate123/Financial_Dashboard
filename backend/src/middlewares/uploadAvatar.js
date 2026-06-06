const multer = require('multer');
const { AppError } = require('./errorHandler');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Avatar must be JPEG, PNG, or WebP.', 400));
  },
});

const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Avatar too large. Maximum size is 2MB.', 400));
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    if (!req.file) return next(new AppError('No image uploaded.', 400));
    next();
  });
};

module.exports = { uploadAvatar };
