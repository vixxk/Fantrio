const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/add-mock-coins', walletController.addMockCoins);
router.post('/recharge', walletController.rechargeWallet);

module.exports = router;
