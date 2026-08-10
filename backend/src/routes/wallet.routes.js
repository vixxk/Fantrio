const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.get('/packages', walletController.getCoinPackages);
router.post('/purchase', walletController.purchaseCoins);
router.post('/redeem-promo', walletController.redeemPromo);
router.post('/spend', walletController.spendCoins);
router.post('/recharge', walletController.rechargeWallet);

module.exports = router;
