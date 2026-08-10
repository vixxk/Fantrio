const express = require('express');
const moreController = require('../controllers/more.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes here require authentication
router.use(protect);

// Support routes
router.post('/tickets', moreController.createTicket);
router.get('/tickets', moreController.getMyTickets);

// Reports routes
router.post('/reports', moreController.createReport);
router.get('/creators', moreController.getReportCreators);

// Rewards routes
router.get('/rewards', moreController.getRewards);

// Feature Request routes
router.post('/features', moreController.createFeatureRequest);
router.get('/features', moreController.getFeatureRequests);
router.post('/features/:id/vote', moreController.voteFeatureRequest);

// Announcement routes
router.get('/announcements', moreController.getAnnouncements);

// Referral routes
router.get('/referrals/stats', moreController.getReferralStats);
router.post('/referrals/claim', moreController.claimReferral);

module.exports = router;
