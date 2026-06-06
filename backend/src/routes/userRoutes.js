const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only for most operations)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User object
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user. Admins can update any user. Others can only update themselves (name/email only).
 *     tags: [Users]
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
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [user, admin], description: "Admin only" }
 *     responses:
 *       200:
 *         description: Updated user
 *       403:
 *         description: Forbidden
 */
router.patch('/:id', authenticate, userController.updateUser);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, authorize('admin'), userController.setUserStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Permanently delete a user (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
