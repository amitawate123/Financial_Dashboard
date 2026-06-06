const transactionService = require('../services/transactionService');
const fileService = require('../services/fileService');
const exportService = require('../services/exportService');
const importService = require('../services/importService');
const { emitTransactionChange } = require('../config/socket');

const emitChange = async (action, transaction) => {
  if (!transaction?.populate) {
    emitTransactionChange(action, transaction);
    return;
  }
  const populated = await transaction.populate('createdBy', 'name email');
  emitTransactionChange(action, populated);
};

const getAllTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getAllTransactions(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user);
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body, req.user._id);
    await emitChange('created', transaction);
    res.status(201).json({ success: true, message: 'Transaction created.', data: transaction });
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body, req.user);
    await emitChange('updated', transaction);
    res.json({ success: true, message: 'Transaction updated.', data: transaction });
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user);
    await transactionService.deleteTransaction(req.params.id, req.user);
    emitTransactionChange('deleted', transaction);
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    const { attachment, transaction } = await fileService.uploadTransactionFile(
      req.params.id,
      req.file,
      req.user
    );
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: attachment,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { stream, attachment } = await fileService.downloadTransactionFile(
      req.params.id,
      req.params.fileId,
      req.user
    );
    res.set('Content-Type', attachment.mimeType);
    res.set('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    stream.pipe(res);
    stream.on('error', next);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteTransactionFile(req.params.id, req.params.fileId, req.user);
    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    next(err);
  }
};

const downloadImportTemplate = async (req, res, next) => {
  try {
    const { buffer, filename, contentType } = await importService.buildTemplate();
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const importExcel = async (req, res, next) => {
  try {
    const result = await importService.importFromExcel(req.file.buffer, req.user._id);

    for (const tx of result.transactions) {
      emitTransactionChange('created', tx);
    }

    const message =
      result.failed === 0
        ? `${result.imported} transaction(s) imported successfully.`
        : `Imported ${result.imported} row(s). ${result.failed} row(s) failed.`;

    res.status(result.imported > 0 ? 201 : 400).json({
      success: result.imported > 0,
      message,
      data: {
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (err) {
    next(err);
  }
};

const sendExport = (format) => async (req, res, next) => {
  try {
    const transactions = await transactionService.getTransactionsForExport(req.query, req.user);
    const { buffer, filename, contentType } = await exportService.generateExport(
      transactions,
      format,
      req.query
    );
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadFile,
  downloadFile,
  deleteFile,
  exportCsv: sendExport('csv'),
  exportExcel: sendExport('excel'),
  exportPdf: sendExport('pdf'),
  downloadImportTemplate,
  importExcel,
};
