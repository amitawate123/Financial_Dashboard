const Transaction = require('../models/Transaction');
const { AppError } = require('../middlewares/errorHandler');
const gridfs = require('../utils/gridfs');
const { ownerFilter } = require('../utils/userScope');

const findTransaction = async (id, user) => {
  const transaction = await Transaction.findOne({ _id: id, ...ownerFilter(user) });
  if (!transaction) throw new AppError('Transaction not found.', 404);
  return transaction;
};

const uploadTransactionFile = async (transactionId, file, user) => {
  const transaction = await findTransaction(transactionId, user);

  const fileId = await gridfs.uploadFile(file.buffer, file.originalname, {
    transactionId: transaction._id.toString(),
    uploadedBy: user._id.toString(),
    mimeType: file.mimetype,
  });

  const attachment = {
    fileId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };

  transaction.attachments.push(attachment);
  await transaction.save();

  return { attachment, transaction };
};

const downloadTransactionFile = async (transactionId, fileId, user) => {
  const transaction = await findTransaction(transactionId, user);
  const attachment = transaction.attachments.find((a) => a.fileId.toString() === fileId);
  if (!attachment) throw new AppError('File not found.', 404);

  const stream = gridfs.openDownloadStream(fileId);
  return { stream, attachment };
};

const deleteTransactionFile = async (transactionId, fileId, user) => {
  const transaction = await findTransaction(transactionId, user);
  const index = transaction.attachments.findIndex((a) => a.fileId.toString() === fileId);
  if (index === -1) throw new AppError('File not found.', 404);

  await gridfs.deleteFile(fileId);
  transaction.attachments.splice(index, 1);
  await transaction.save();
};

const deleteAllTransactionFiles = async (transaction) => {
  await Promise.all(
    transaction.attachments.map((a) => gridfs.deleteFile(a.fileId.toString()).catch(() => {}))
  );
};

module.exports = {
  uploadTransactionFile,
  downloadTransactionFile,
  deleteTransactionFile,
  deleteAllTransactionFiles,
};
