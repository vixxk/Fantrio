const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.patch('/update-me', protect, authController.updateMe);
router.patch('/update-password', protect, authController.updatePassword);
router.delete('/delete-me', protect, authController.deleteMe);

module.exports = router;
