const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Enforce admin-only access
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsersList);
router.post('/users/:userId/toggle-suspension', adminController.toggleUserSuspension);
router.get('/reports', adminController.getReportedPosts);
router.post('/reports/:postId/moderate', adminController.moderatePost);
router.get('/calls', adminController.getActiveCalls);
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

module.exports = router;
