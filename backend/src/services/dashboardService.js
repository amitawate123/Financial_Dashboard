const Transaction = require('../models/Transaction');
const { ownerFilter } = require('../utils/userScope');

const getSummary = async ({ startDate, endDate } = {}, user) => {
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  const matchStage = {
    isDeleted: { $ne: true },
    ...ownerFilter(user),
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const [summary] = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $addFields: { netBalance: { $subtract: ['$totalIncome', '$totalExpenses'] } },
    },
  ]);

  return summary || { totalIncome: 0, totalExpenses: 0, netBalance: 0, transactionCount: 0 };
};

const getCategoryBreakdown = async ({ startDate, endDate, type } = {}, user) => {
  const match = { isDeleted: { $ne: true }, ...ownerFilter(user) };
  if (type) match.type = type;
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  return Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
  ]);
};

const getMonthlyTrends = async ({ year } = {}, user) => {
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const startOfYear = new Date(`${targetYear}-01-01`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  const results = await Transaction.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        ...ownerFilter(user),
        date: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // Shape into 12 months structure
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(targetYear, i, 1).toLocaleString('en', { month: 'long' }),
    income: 0,
    expenses: 0,
    net: 0,
  }));

  results.forEach(({ _id, total }) => {
    const m = months[_id.month - 1];
    if (_id.type === 'income') m.income = total;
    else m.expenses = total;
    m.net = m.income - m.expenses;
  });

  return { year: targetYear, months };
};

const getRecentActivity = async (limit = 10, user) => {
  return Transaction.find(ownerFilter(user))
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(Number(limit));
};

const getWeeklyTrends = async (user) => {
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const results = await Transaction.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        ...ownerFilter(user),
        date: { $gte: sixWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          week: { $isoWeek: '$date' },
          year: { $isoWeekYear: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  // Group by week
  const weekMap = {};
  results.forEach(({ _id, total }) => {
    const key = `${_id.year}-W${String(_id.week).padStart(2, '0')}`;
    if (!weekMap[key]) weekMap[key] = { week: key, income: 0, expenses: 0, net: 0 };
    if (_id.type === 'income') weekMap[key].income = total;
    else weekMap[key].expenses = total;
    weekMap[key].net = weekMap[key].income - weekMap[key].expenses;
  });

  return Object.values(weekMap);
};

const getCategoryStackTrends = async ({ year, type = 'expense', top = 6 } = {}, user) => {
  const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const startOfYear = new Date(`${targetYear}-01-01`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  const raw = await Transaction.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        ...ownerFilter(user),
        type,
        date: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, category: '$category' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const categoryTotals = {};
  raw.forEach(({ _id, total }) => {
    categoryTotals[_id.category] = (categoryTotals[_id.category] || 0) + total;
  });

  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name]) => name);

  const months = Array.from({ length: 12 }, (_, i) => {
    const row = {
      month: i + 1,
      monthName: new Date(targetYear, i, 1).toLocaleString('en', { month: 'short' }),
    };
    categories.forEach((category) => {
      row[category] = 0;
    });
    return row;
  });

  raw.forEach(({ _id, total }) => {
    if (!categories.includes(_id.category)) return;
    months[_id.month - 1][_id.category] = total;
  });

  return { year: targetYear, type, categories, months };
};

const getInsights = async (user) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [allTime, thisMonth] = await Promise.all([
    getSummary({}, user),
    getSummary({ startDate: startOfMonth, endDate: endOfMonth }, user),
  ]);

  const monthIncome = thisMonth.totalIncome || 0;
  const monthExpense = thisMonth.totalExpenses || 0;
  const savingsRate =
    monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 1000) / 10 : 0;

  const topExpense = await Transaction.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        type: 'expense',
        ...ownerFilter(user),
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  const dayOfMonth = now.getDate();
  const averageDailySpend =
    dayOfMonth > 0 ? Math.round((monthExpense / dayOfMonth) * 100) / 100 : 0;

  return {
    currentBalance: allTime.netBalance || 0,
    thisMonthIncome: monthIncome,
    thisMonthExpense: monthExpense,
    savingsRate,
    topSpendingCategory: topExpense[0]?._id || null,
    topSpendingCategoryAmount: topExpense[0]?.total || 0,
    averageDailySpend,
    monthLabel: now.toLocaleString('en', { month: 'long', year: 'numeric' }),
  };
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyTrends,
  getCategoryStackTrends,
  getInsights,
};
