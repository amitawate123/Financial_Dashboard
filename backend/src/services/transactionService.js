const Transaction = require('../models/Transaction');
const { AppError } = require('../middlewares/errorHandler');
const { ownerFilter, stripOwnershipFields } = require('../utils/userScope');
const { deleteAllTransactionFiles } = require('./fileService');

const buildFilter = ({ type, category, categories, startDate, endDate, minAmount, maxAmount, search }, scope = {}) => {
  const filter = { ...scope };
  if (type) filter.type = type;

  const categoryList = categories
    ? String(categories).split(',').map((c) => c.trim()).filter(Boolean)
    : category
      ? [category]
      : [];
  if (categoryList.length === 1) filter.category = categoryList[0];
  else if (categoryList.length > 1) filter.category = { $in: categoryList };
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  if (search) {
    filter.$or = [
      { notes: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }
  return filter;
};

const getAllTransactions = async (queryParams, user) => {
  const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', ...filterParams } = queryParams;
  const filter = buildFilter(filterParams, ownerFilter(user));
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).populate('createdBy', 'name email').sort(sort).skip(skip).limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  };
};

const getTransactionById = async (id, user) => {
  const transaction = await Transaction.findOne({ _id: id, ...ownerFilter(user) })
    .populate('createdBy', 'name email');
  if (!transaction) throw new AppError('Transaction not found.', 404);
  return transaction;
};

const createTransaction = async (data, userId) => {
  return Transaction.create({ ...stripOwnershipFields(data), createdBy: userId });
};

const updateTransaction = async (id, updates, user) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, ...ownerFilter(user) },
    stripOwnershipFields(updates),
    { new: true, runValidators: true }
  );
  if (!transaction) throw new AppError('Transaction not found.', 404);
  return transaction;
};

const deleteTransaction = async (id, user) => {
  const transaction = await Transaction.findOne({ _id: id, ...ownerFilter(user) });
  if (!transaction) throw new AppError('Transaction not found.', 404);

  await deleteAllTransactionFiles(transaction);

  transaction.isDeleted = true;
  await transaction.save();
};
const getTransactionsForExport = async (queryParams, user) => {
  const {
    sortBy = 'date',
    sortOrder = 'desc',
    exportScope = 'all',
    page,
    limit,
    ...filterParams
  } = queryParams;
  const filter = { isDeleted: { $ne: true }, ...buildFilter(filterParams, ownerFilter(user)) };
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  let query = Transaction.find(filter).populate('createdBy', 'name email').sort(sort);

  if (exportScope === 'page') {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    query = query.skip((p - 1) * l).limit(l);
  } else {
    query = query.limit(5000);
  }

  return query.lean();
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  getTransactionsForExport,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
