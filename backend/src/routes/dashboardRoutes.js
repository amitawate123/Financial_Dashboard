const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated analytics and summary APIs (Analyst and Admin)
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Total income, total expenses, net balance, and transaction count
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Summary object
 */
router.get('/summary', authenticate, authorize('user', 'admin'), dashboardController.getSummary);

/**
 * @swagger
 * /dashboard/insights:
 *   get:
 *     summary: Smart dashboard insights (balance, monthly stats, savings rate, top category)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Insights object
 */
router.get('/insights', authenticate, authorize('user', 'admin'), dashboardController.getInsights);

/**
 * @swagger
 * /dashboard/categories:
 *   get:
 *     summary: Totals and counts grouped by category and type
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Category breakdown array
 */
router.get('/categories', authenticate, authorize('user', 'admin'), dashboardController.getCategoryBreakdown);

/**
 * @swagger
 * /dashboard/trends/monthly:
 *   get:
 *     summary: Monthly income vs expense trends for a given year
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *     responses:
 *       200:
 *         description: Monthly trends for all 12 months
 */
router.get('/trends/monthly', authenticate, authorize('user', 'admin'), dashboardController.getMonthlyTrends);

/**
 * @swagger
 * /dashboard/trends/weekly:
 *   get:
 *     summary: Weekly income vs expense trends for the last 6 weeks
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Weekly trends array
 */
router.get('/trends/weekly', authenticate, authorize('user', 'admin'), dashboardController.getWeeklyTrends);

/**
 * @swagger
 * /dashboard/trends/category-stack:
 *   get:
 *     summary: Monthly stacked category totals for bar charts
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: top
 *         schema: { type: integer, default: 6 }
 *     responses:
 *       200:
 *         description: Categories and monthly rows for stacked charts
 */
router.get(
  '/trends/category-stack',
  authenticate,
  authorize('user', 'admin'),
  dashboardController.getCategoryStackTrends
);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Most recent transactions (activity feed)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: Recent activity list
 */
router.get('/recent', authenticate, authorize('user', 'admin'), dashboardController.getRecentActivity);

module.exports = router;
