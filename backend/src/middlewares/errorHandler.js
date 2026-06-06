const { validationResult } = require('express-validator');

// Catch express-validator errors on a route
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Global error handler (must be registered last in Express)
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(err.code ? { code: err.code } : {}),
  });
};

// Create an AppError with a status code
class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = options.code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { validate, errorHandler, AppError };
