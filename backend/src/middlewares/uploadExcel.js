const multer = require('multer');
const { AppError } = require('./errorHandler');

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase();
    const okExt = ext.endsWith('.xlsx') || ext.endsWith('.xls');
    if (ALLOWED_TYPES.includes(file.mimetype) || okExt) cb(null, true);
    else cb(new AppError('Please upload an Excel file (.xlsx).', 400));
  },
});

const uploadExcel = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large. Maximum size is 5MB.', 400));
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    if (!req.file) return next(new AppError('No Excel file uploaded.', 400));
    next();
  });
};

module.exports = { uploadExcel };
