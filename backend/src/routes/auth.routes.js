const express = require('express');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
