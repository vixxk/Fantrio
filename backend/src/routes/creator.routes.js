const express = require('express');
const creatorController = require('../controllers/creator.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/discover', creatorController.discoverCreators);
router.get('/trending', creatorController.getTrending);
router.get('/profile/:username', creatorController.getPublicProfile);

// Protected routes
router.use(protect);
router.put('/profile', restrictTo('creator'), creatorController.updateProfile);
router.post('/follow/:creatorId', creatorController.followCreator);
router.get('/following', creatorController.getFavourites);
router.get('/subscribed', creatorController.getSubscribed);
router.get('/dashboard', restrictTo('creator'), creatorController.getCreatorDashboard);

module.exports = router;
