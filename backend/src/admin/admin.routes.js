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
const storyAdmin = require('./controllers/storyAdmin.controller');
const subscriptionAdmin = require('./controllers/subscriptionAdmin.controller');
const settingsAdmin = require('./controllers/settingsAdmin.controller');
const reportAdmin = require('./controllers/reportAdmin.controller');
const referralAdmin = require('./controllers/referralAdmin.controller');
const storeAdmin = require('../controllers/store.controller');

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
router.get('/users/:userId/activity', userAdmin.getUserActivity);
router.get('/users/:userId/blocked', userAdmin.getUserBlockedList);
router.delete('/users/:userId/blocked/:blockedId', userAdmin.adminUnblockUser);

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

// Stories moderation
router.get('/stories', storyAdmin.getStories);
router.delete('/stories/:storyId', storyAdmin.deleteStory);

// Wallet ledger auditing & clearances
router.get('/transactions', financialAdmin.getAllTransactions);
router.post('/refund/:transactionId', financialAdmin.refundTransaction);
router.get('/withdrawals', financialAdmin.getWithdrawals);
router.post('/withdrawals/:id/approve', financialAdmin.approveWithdrawal);
router.post('/withdrawals/:id/reject', financialAdmin.rejectWithdrawal);

// Promo codes
router.get('/promo-codes', financialAdmin.getPromoCodes);
router.post('/promo-codes', financialAdmin.createPromoCode);
router.put('/promo-codes/:id', financialAdmin.updatePromoCode);
router.delete('/promo-codes/:id', financialAdmin.deletePromoCode);

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

// User-submitted reports moderation
router.get('/user-reports', reportAdmin.getReports);
router.put('/user-reports/:id', reportAdmin.updateReportStatus);
router.delete('/user-reports/:id', reportAdmin.deleteReport);

// Referrals overview
router.get('/referrals', referralAdmin.getReferrals);

// Store moderation (products & orders)
router.get('/store/products', storeAdmin.adminGetProducts);
router.get('/store/orders', storeAdmin.adminGetOrders);
router.delete('/store/products/:productId', storeAdmin.adminDeleteProduct);

// Chat logs moderation
router.get('/chats', chatAdmin.getMessages);
router.delete('/chats/:id', chatAdmin.deleteMessage);

// Calls & Live Streams monitoring
router.get('/calls', callAdmin.getCalls);
router.get('/streams', callAdmin.getLiveStreams);
router.get('/streams/stats', callAdmin.getLiveStreamStats);
router.post('/streams/:id/terminate', callAdmin.terminateStream);
router.delete('/streams/:id', callAdmin.deleteStream);

// Subscriptions administration
router.get('/subscriptions', subscriptionAdmin.getSubscriptions);
router.get('/subscriptions/stats', subscriptionAdmin.getSubscriptionStats);
router.post('/subscriptions/:id/cancel', subscriptionAdmin.cancelSubscription);
router.post('/subscriptions/:id/refund', subscriptionAdmin.refundSubscription);

// User settings / security audit
router.get('/users/:userId/security', settingsAdmin.getUserSecurity);
router.post('/users/:userId/disable-2fa', settingsAdmin.forceDisable2FA);
router.get('/users/:userId/payment-methods', settingsAdmin.getUserPaymentMethods);
router.delete('/users/:userId/payment-methods/:methodId', settingsAdmin.deleteUserPaymentMethod);

// Platform login activity
router.get('/login-activity', settingsAdmin.getLoginActivity);

// FAQ management
router.get('/faqs', settingsAdmin.getFaqs);
router.post('/faqs', settingsAdmin.createFaq);
router.put('/faqs/:id', settingsAdmin.updateFaq);
router.delete('/faqs/:id', settingsAdmin.deleteFaq);

module.exports = router;
