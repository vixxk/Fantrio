const express = require('express');
const creatorController = require('../controllers/creator.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/discover', creatorController.discoverCreators);
router.get('/trending', creatorController.getTrending);
router.get('/stories', creatorController.getStories);
router.get('/live', creatorController.getLiveStreams);
router.get('/profile/:username', creatorController.getPublicProfile);

// Protected routes
router.use(protect);
router.get('/suggested', creatorController.getSuggested);
router.put('/profile', restrictTo('creator'), creatorController.updateProfile);
router.post('/follow/:creatorId', creatorController.followCreator);
router.get('/following', creatorController.getFavourites);
router.get('/subscribed', creatorController.getSubscribed);
router.get('/dashboard', restrictTo('creator'), creatorController.getCreatorDashboard);

// Creator-specific new endpoints
router.post('/stories', restrictTo('creator'), creatorController.createStory);
router.delete('/stories/:storyId', restrictTo('creator'), creatorController.deleteStory);
router.post('/live/start', restrictTo('creator'), creatorController.startLiveStream);
router.post('/live/end', restrictTo('creator'), creatorController.endLiveStream);
router.post('/profile/toggle-calls', restrictTo('creator'), creatorController.toggleCallAvailability);
router.get('/subscribers', restrictTo('creator'), creatorController.getCreatorSubscribers);

module.exports = router;
