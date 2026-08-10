const express = require('express');
const creatorController = require('../controllers/creator.controller');
const creatorPanelController = require('../controllers/creatorPanel.controller');
const { protect, protectOptional, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (optional auth personalises results when a token is present)
router.get('/discover', protectOptional, creatorController.discoverCreators);
router.get('/trending', protectOptional, creatorController.getTrending);
router.get('/stories', protectOptional, creatorController.getStories);
router.get('/live', protectOptional, creatorController.getLiveStreams);
router.get('/profile/:username', protectOptional, creatorController.getPublicProfile);
router.get('/by-user/:userId', protectOptional, creatorController.getProfileByUserId);

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
router.post('/stories/:storyId/view', creatorController.markStoryViewed);
router.post('/live/start', restrictTo('creator'), creatorController.startLiveStream);
router.post('/live/end', restrictTo('creator'), creatorController.endLiveStream);
router.post('/live/schedule', restrictTo('creator'), creatorController.scheduleLiveStream);
router.get('/live/my', restrictTo('creator'), creatorController.getMyLiveStreams);
router.put('/live/:streamId', restrictTo('creator'), creatorController.updateLiveStream);
router.delete('/live/:streamId', restrictTo('creator'), creatorController.deleteLiveStream);
router.post('/live/:streamId/join', creatorController.joinLiveStream);
router.post('/live/:streamId/leave', creatorController.leaveLiveStream);
router.get('/live/:streamId/chat', creatorController.getStreamChat);
router.post('/live/:streamId/chat', creatorController.sendStreamChat);
router.get('/live/:streamId/leaderboard', creatorController.getStreamLeaderboard);
router.post('/profile/toggle-calls', restrictTo('creator'), creatorController.toggleCallAvailability);
router.get('/subscribers', restrictTo('creator'), creatorController.getCreatorSubscribers);

// Creator panel (analytics hub, earnings, content, PPV, call stats, my profile)
router.get('/panel/analytics', restrictTo('creator'), creatorPanelController.getAnalytics);
router.get('/panel/earnings', restrictTo('creator'), creatorPanelController.getEarnings);
router.get('/panel/content', restrictTo('creator'), creatorPanelController.getMyContent);
router.get('/panel/ppv', restrictTo('creator'), creatorPanelController.getMyPPV);
router.get('/panel/calls/:type', restrictTo('creator'), creatorPanelController.getCallStats);
router.get('/panel/profile', restrictTo('creator'), creatorPanelController.getMyProfile);
router.get('/panel/settings', restrictTo('creator'), creatorPanelController.getMySettings);
router.put('/panel/settings', restrictTo('creator'), creatorPanelController.updateMySettings);

module.exports = router;
