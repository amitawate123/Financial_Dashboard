const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authEmailController = require('../controllers/authEmailController');
const { authenticate } = require('../middlewares/auth');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  tokenBodyValidation,
  emailOnlyValidation,
  resetPasswordValidation,
} = require('../validations/authValidation');
const { validate } = require('../middlewares/errorHandler');
const { uploadAvatar } = require('../middlewares/uploadAvatar');

const isProd = process.env.NODE_ENV === 'production';
const emailSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: secret123 }
 *               role: { type: string, enum: [user, admin], example: user }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post('/register', registerValidation, validate, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive access and refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful, returns access token and refresh token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, validate, authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for new access and refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New tokens issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refreshValidation, validate, authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke a refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', logoutValidation, validate, authController.logout);

router.post('/verify-email', tokenBodyValidation, validate, authEmailController.verifyEmail);
router.post('/resend-verification', emailSensitiveLimiter, emailOnlyValidation, validate, authEmailController.resendVerification);
router.post('/forgot-password', emailSensitiveLimiter, emailOnlyValidation, validate, authEmailController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, authEmailController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getMe);

router.post('/me/avatar', authenticate, uploadAvatar, authController.uploadAvatar);
router.get('/me/avatar', authenticate, authController.getAvatar);

module.exports = router;
