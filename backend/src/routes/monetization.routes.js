const express = require('express');
const monetizationController = require('../controllers/monetization.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/subscribe/:creatorId', monetizationController.subscribeToCreator);
router.post('/tip/:creatorId', monetizationController.tipCreator);
router.post('/withdraw', restrictTo('creator'), monetizationController.requestWithdrawal);

module.exports = router;
