const router = require('express').Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  createTransactionValidation,
  updateTransactionValidation,
  listTransactionValidation,
  exportTransactionValidation,
} = require('../validations/transactionValidation');
const { validate } = require('../middlewares/errorHandler');
const { uploadSingle } = require('../middlewares/upload');
const { uploadExcel } = require('../middlewares/uploadExcel');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial record management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List all transactions with filtering, search, and pagination (Viewer, Analyst, Admin)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: minAmount
 *         schema: { type: number }
 *       - in: query
 *         name: maxAmount
 *         schema: { type: number }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in notes or category
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 */
router.get(
  '/',
  authenticate,
  authorize('user', 'admin'),
  listTransactionValidation,
  validate,
  transactionController.getAllTransactions
);

/**
 * @swagger
 * /transactions/export/csv:
 *   get:
 *     summary: Export filtered transactions as CSV
 *     tags: [Transactions]
 */
router.get(
  '/export/csv',
  authenticate,
  authorize('user', 'admin'),
  exportTransactionValidation,
  validate,
  transactionController.exportCsv
);

/**
 * @swagger
 * /transactions/export/excel:
 *   get:
 *     summary: Export filtered transactions as Excel
 *     tags: [Transactions]
 */
router.get(
  '/export/excel',
  authenticate,
  authorize('user', 'admin'),
  exportTransactionValidation,
  validate,
  transactionController.exportExcel
);

/**
 * @swagger
 * /transactions/export/pdf:
 *   get:
 *     summary: Export filtered transactions as PDF
 *     tags: [Transactions]
 */
router.get(
  '/export/pdf',
  authenticate,
  authorize('user', 'admin'),
  exportTransactionValidation,
  validate,
  transactionController.exportPdf
);

router.get(
  '/import/template',
  authenticate,
  authorize('user', 'admin'),
  transactionController.downloadImportTemplate
);

router.post(
  '/import/excel',
  authenticate,
  authorize('user', 'admin'),
  uploadExcel,
  transactionController.importExcel
);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID (Viewer, Analyst, Admin)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction object
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('user', 'admin'),
  transactionController.getTransactionById
);

/**
 * @swagger
 * /transactions/{id}/files:
 *   post:
 *     summary: Upload a file attachment (User on own transactions, Admin on any)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 */
router.post(
  '/:id/files',
  authenticate,
  authorize('user', 'admin'),
  uploadSingle,
  transactionController.uploadFile
);

/**
 * @swagger
 * /transactions/{id}/files/{fileId}:
 *   get:
 *     summary: Download a file attachment
 *     tags: [Transactions]
 */
router.get(
  '/:id/files/:fileId',
  authenticate,
  authorize('user', 'admin'),
  transactionController.downloadFile
);

/**
 * @swagger
 * /transactions/{id}/files/{fileId}:
 *   delete:
 *     summary: Delete a file attachment (Admin only)
 *     tags: [Transactions]
 */
router.delete(
  '/:id/files/:fileId',
  authenticate,
  authorize('admin'),
  transactionController.deleteFile
);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction (Analyst, Admin)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount: { type: number, example: 1500.00 }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string, example: salary }
 *               date: { type: string, format: date, example: "2024-01-15" }
 *               notes: { type: string, example: "Monthly salary" }
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (insufficient role)
 */
router.post(
  '/',
  authenticate,
  authorize('user', 'admin'),
  createTransactionValidation,
  validate,
  transactionController.createTransaction
);

/**
 * @swagger
 * /transactions/{id}:
 *   patch:
 *     summary: Update a transaction (User on own, Admin on any)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Transaction updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id',
  authenticate,
  authorize('user', 'admin'),
  updateTransactionValidation,
  validate,
  transactionController.updateTransaction
);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Soft-delete a transaction (User on own, Admin on any)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('user', 'admin'),
  transactionController.deleteTransaction
);

module.exports = router;
