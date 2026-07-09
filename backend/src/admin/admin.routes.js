const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Sub-controller Imports
const systemAdmin = require('./controllers/systemAdmin.controller');
const userAdmin = require('./controllers/userAdmin.controller');
const creatorAdmin = require('./controllers/creatorAdmin.controller');
const postAdmin = require('./controllers/postAdmin.controller');
const financialAdmin = require('./controllers/financialAdmin.controller');
const announcementAdmin = require('./controllers/announcementAdmin.controller');
const ticketAdmin = require('./controllers/ticketAdmin.controller');
const featureAdmin = require('./controllers/featureAdmin.controller');
const chatAdmin = require('./controllers/chatAdmin.controller');
const callAdmin = require('./controllers/callAdmin.controller');

const router = express.Router();

// Enforce admin-only access for all sub-routes
router.use(protect);
router.use(restrictTo('admin'));

// System metrics and configurations
router.get('/stats', systemAdmin.getDashboardStats);
router.get('/settings', systemAdmin.getSystemSettings);
router.put('/settings', systemAdmin.updateSystemSettings);

// User administration
router.get('/users', userAdmin.getUsersList);
router.put('/users/:userId', userAdmin.updateUser);
router.delete('/users/:userId', userAdmin.deleteUser);
router.post('/users/:userId/toggle-suspension', userAdmin.toggleUserSuspension);
router.post('/users/:userId/adjust-balance', userAdmin.adjustUserBalance);

// Creator profiles & verification cycles
router.get('/creators', creatorAdmin.getCreatorsList);
router.put('/creators/:creatorId', creatorAdmin.updateCreatorProfile);
router.post('/creators/:creatorId/approve', creatorAdmin.approveCreator);
router.post('/creators/:creatorId/reject', creatorAdmin.rejectCreator);
router.post('/creators/:creatorId/verify', creatorAdmin.toggleCreatorVerification);

// Content curation & moderation
router.get('/posts', postAdmin.getAllPosts);
router.delete('/posts/:postId', postAdmin.deletePost);
router.get('/reports', postAdmin.getReportedPosts);
router.post('/reports/:postId/moderate', postAdmin.moderatePost);

// Wallet ledger auditing & clearances
router.get('/transactions', financialAdmin.getAllTransactions);
router.post('/refund/:transactionId', financialAdmin.refundTransaction);
router.get('/withdrawals', financialAdmin.getWithdrawals);
router.post('/withdrawals/:id/approve', financialAdmin.approveWithdrawal);
router.post('/withdrawals/:id/reject', financialAdmin.rejectWithdrawal);

// Announcements board CRUD
router.get('/announcements', announcementAdmin.getAnnouncements);
router.post('/announcements', announcementAdmin.createAnnouncement);
router.put('/announcements/:id', announcementAdmin.updateAnnouncement);
router.delete('/announcements/:id', announcementAdmin.deleteAnnouncement);

// Support tickets resolution board
router.get('/tickets', ticketAdmin.getTickets);
router.put('/tickets/:id', ticketAdmin.updateTicket);
router.delete('/tickets/:id', ticketAdmin.deleteTicket);

// Feature requests roadmap
router.get('/features', featureAdmin.getFeatures);
router.put('/features/:id', featureAdmin.updateFeature);
router.delete('/features/:id', featureAdmin.deleteFeature);

// Chat logs moderation
router.get('/chats', chatAdmin.getMessages);
router.delete('/chats/:id', chatAdmin.deleteMessage);

// Calls & Live Streams monitoring
router.get('/calls', callAdmin.getCalls);
router.get('/streams', callAdmin.getLiveStreams);
router.post('/streams/:id/terminate', callAdmin.terminateStream);

module.exports = router;
