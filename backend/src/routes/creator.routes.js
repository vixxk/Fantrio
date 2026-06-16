const express = require('express');
const creatorController = require('../controllers/creator.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/discover', creatorController.discoverCreators);
router.get('/trending', creatorController.getTrending);
router.get('/profile/:username', creatorController.getPublicProfile);

// Protected routes
router.put('/profile', protect, restrictTo('creator'), creatorController.updateProfile);
router.post('/follow/:creatorId', protect, creatorController.followCreator);

module.exports = router;
