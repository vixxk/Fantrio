const express = require('express');
const monetizationController = require('../controllers/monetization.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/subscriptions', monetizationController.getMySubscriptions);
router.get('/subscriptions/spending', monetizationController.getSpendingHistory);
router.post('/subscribe/:creatorId', monetizationController.subscribeToCreator);
router.post('/renew/:creatorId', monetizationController.renewSubscription);
router.post('/unsubscribe/:creatorId', monetizationController.unsubscribeFromCreator);
router.post('/tip/:creatorId', monetizationController.tipCreator);
router.get('/gifts', monetizationController.getGiftCatalog);
router.post('/gift/:receiverId', monetizationController.sendGift);
router.post('/withdraw', restrictTo('creator'), monetizationController.requestWithdrawal);
router.get('/withdrawals', restrictTo('creator'), monetizationController.getWithdrawalHistory);

module.exports = router;
