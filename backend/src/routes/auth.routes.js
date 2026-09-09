const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.post('/logout', authController.logout);

// OAuth Endpoints (Google & X)
router.post('/oauth/google', authController.oauthGoogle);
router.get('/oauth/google', authController.initGoogleOAuth);
router.get('/oauth/google/callback', authController.googleOAuthCallback);

router.post('/oauth/x', authController.oauthX);
router.get('/oauth/x', authController.initXOAuth);
router.get('/oauth/x/callback', authController.xOAuthCallback);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/complete-onboarding', protect, authController.completeOnboarding);
router.get('/me', protect, authController.getMe);
router.patch('/update-me', protect, authController.updateMe);
router.patch('/update-password', protect, authController.updatePassword);
router.delete('/delete-me', protect, authController.deleteMe);

module.exports = router;
