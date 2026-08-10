const User = require('../models/User');

/**
 * Build a list of user IDs that should be hidden from `userId`'s feeds/content.
 * Includes both directions:
 *  - users that `userId` has blocked
 *  - users that have blocked `userId` (reciprocal hiding)
 *
 * @param {string|mongoose.Types.ObjectId} userId - the current user
 * @returns {Promise<string[]>} array of user id strings to exclude
 */
const getHiddenUserIds = async (userId) => {
  const [me, blockers] = await Promise.all([
    User.findById(userId, 'blockedUsers'),
    User.find({ blockedUsers: userId }, '_id')
  ]);

  const hidden = new Set((me && me.blockedUsers) ? me.blockedUsers.map((id) => id.toString()) : []);
  (blockers || []).forEach((b) => hidden.add(b._id.toString()));
  return [...hidden];
};

module.exports = { getHiddenUserIds };
