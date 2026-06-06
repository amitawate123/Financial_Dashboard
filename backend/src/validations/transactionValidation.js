const { body, query } = require('express-validator');

const CATEGORIES = [
  'salary', 'freelance', 'investment', 'business',
  'food', 'transport', 'housing', 'utilities',
  'healthcare', 'entertainment', 'education', 'shopping', 'other',
];

const createTransactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const validateCategories = (value) => {
  if (!value) return true;
  const list = String(value).split(',').map((c) => c.trim()).filter(Boolean);
  return list.length > 0 && list.every((c) => CATEGORIES.includes(c));
};

const updateTransactionValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const listTransactionValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category filter'),
  query('categories').optional().custom(validateCategories).withMessage('Invalid categories filter'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be non-negative'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be non-negative'),
  query('search').optional().isString().withMessage('search must be a string'),
];

const exportTransactionValidation = [
  query('exportScope').optional().isIn(['all', 'page']).withMessage('exportScope must be all or page'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category filter'),
  query('categories').optional().custom(validateCategories).withMessage('Invalid categories filter'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be non-negative'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be non-negative'),
  query('search').optional().isString().withMessage('search must be a string'),
  query('sortBy').optional().isIn(['date', 'amount', 'category', 'type']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sortOrder'),
];

module.exports = {
  createTransactionValidation,
  updateTransactionValidation,
  listTransactionValidation,
  exportTransactionValidation,
};
