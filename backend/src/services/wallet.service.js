const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const ApiError = require('../utils/apiError');

/**
 * Perform an atomic coin transfer between two wallets inside a MongoDB transaction
 * @param {string|null} senderId - ID of user sending coins (null for deposits)
 * @param {string|null} receiverId - ID of user receiving coins (null for withdrawals/platform)
 * @param {number} amount - Number of coins to transfer
 * @param {string} type - Transaction type ('deposit', 'withdrawal', 'subscription', 'tip', 'ppv_unlock', 'call_billing')
 * @param {string|null} referenceId - Optional related document ID (Post, Message, CallLog)
 * @param {number} commissionRate - Commission rate (defaults to 0.20, i.e., 20%)
 * @returns {Promise<Object>} - Created transaction log
 */
const transferCoins = async (senderId, receiverId, amount, type, referenceId = null, commissionRate = 0.20, metadata = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch dynamic system settings if available
    let activeCommissionRate = commissionRate;
    const systemSetting = await SystemSetting.findOne().session(session);
    if (systemSetting && systemSetting.commissionRate !== undefined) {
      activeCommissionRate = systemSetting.commissionRate;
    }

    // 1. Sender balance check and deduction
    if (senderId) {
      let senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
      if (!senderWallet) {
        const [newWallet] = await Wallet.create([{ userId: senderId, balanceCoins: 0 }], { session });
        senderWallet = newWallet;
      }

      if (senderWallet.balanceCoins < amount) {
        throw new ApiError(400, 'Insufficient coin balance');
      }

      senderWallet.balanceCoins = Number((senderWallet.balanceCoins - amount).toFixed(2));
      await senderWallet.save({ session, validateBeforeSave: false });
    }

    // 2. Receiver balance calculation and crediting
    let netAmount = amount;
    if (receiverId) {
      let receiverWallet = await Wallet.findOne({ userId: receiverId }).session(session);
      if (!receiverWallet) {
        const [newWallet] = await Wallet.create([{ userId: receiverId, balanceCoins: 0 }], { session });
        receiverWallet = newWallet;
      }

      // Apply commission on direct peer transactions
      if (['subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry'].includes(type)) {
        const commission = amount * activeCommissionRate;
        netAmount = amount - commission;
      }

      receiverWallet.balanceCoins = Number((receiverWallet.balanceCoins + netAmount).toFixed(2));
      await receiverWallet.save({ session, validateBeforeSave: false });
    }

    // 3. Create ledger log
    const [transaction] = await Transaction.create(
      [
        {
          senderId,
          receiverId,
          type,
          status: 'completed',
          amountCoins: amount,
          referenceId,
          gateway: 'internal',
          metadata
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return transaction;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  transferCoins
};
