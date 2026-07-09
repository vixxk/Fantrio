const express = require('express');
const monetizationController = require('../controllers/monetization.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/subscriptions', monetizationController.getMySubscriptions);
router.post('/subscribe/:creatorId', monetizationController.subscribeToCreator);
router.post('/unsubscribe/:creatorId', monetizationController.unsubscribeFromCreator);
router.post('/tip/:creatorId', monetizationController.tipCreator);
router.post('/withdraw', restrictTo('creator'), monetizationController.requestWithdrawal);
router.get('/withdrawals', restrictTo('creator'), monetizationController.getWithdrawalHistory);

module.exports = router;
