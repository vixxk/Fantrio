const Referral = require('../../models/Referral');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all referral records with referrer + referred user details
exports.getReferrals = catchAsync(async (req, res, next) => {
  const referrals = await Referral.find()
    .populate('referrerId', 'username displayName email referralCode')
    .populate('referredId', 'username displayName email referralCode')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    referrals,
    total: referrals.length
  });
});
