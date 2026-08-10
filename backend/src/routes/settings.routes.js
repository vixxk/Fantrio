const express = require('express');
const settingsController = require('../controllers/settings.controller');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All settings routes require authentication
router.use(protect);

// Profile
router.get('/profile', settingsController.getProfile);
router.patch('/profile', authController.updateMe);

// Security
router.get('/security', settingsController.getSecurity);
router.post('/security/2fa/enable', settingsController.enable2FA);
router.post('/security/2fa/verify', settingsController.verifyEnable2FA);
router.post('/security/2fa/disable', settingsController.disable2FA);

// Notification preferences
router.get('/notifications', settingsController.getNotificationPreferences);
router.patch('/notifications', settingsController.updateNotificationPreferences);

// Payment methods
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', settingsController.addPaymentMethod);
router.patch('/payment-methods/:id', settingsController.updatePaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);

// Help Centre
router.get('/faqs', settingsController.getFaqs);

module.exports = router;
