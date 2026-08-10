const express = require('express');
const rateLimit = require('express-rate-limit');
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Promo codes are guessable strings (e.g. WELCOME20), so brute-forcing the
// redeem endpoint is a real attack vector — throttle attempts per IP.
const promoRedeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 redeem attempts per IP per window
  message: {
    status: 'fail',
    message: 'Too many promo code attempts from this IP, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(protect);

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.get('/packages', walletController.getCoinPackages);
router.post('/purchase', walletController.purchaseCoins);
router.post('/redeem-promo', promoRedeemLimiter, walletController.redeemPromo);
router.post('/spend', walletController.spendCoins);
router.post('/recharge', walletController.rechargeWallet);

module.exports = router;
