const multer = require('multer');
const { AppError } = require('./errorHandler');

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('File type not allowed. Use images, PDF, or spreadsheet files.', 400));
  },
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large. Maximum size is 5MB.', 400));
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    if (!req.file) return next(new AppError('No file uploaded.', 400));
    next();
  });
};

module.exports = { uploadSingle };
