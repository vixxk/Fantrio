const cron = require('node-cron');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const CreatorProfile = require('../models/CreatorProfile');

// Run every minute to publish scheduled posts
const initPostScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const pendingPosts = await Post.find({
        isPublished: false,
        scheduledFor: { $ne: null, $lte: now }
      });

      if (pendingPosts.length > 0) {
        console.log(`[Scheduler] Found ${pendingPosts.length} posts to publish.`);
        for (const post of pendingPosts) {
          post.isPublished = true;
          await post.save({ validateBeforeSave: false });
          console.log(`[Scheduler] Published post ID: ${post._id} by Creator: ${post.creatorId}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error running scheduled post activation:', err);
    }
  });
  console.log('[Scheduler] Post scheduling cron task initialized ⏰');
};

// Run daily at midnight to expire subscriptions
const initSubscriptionExpirationScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const expiredSubs = await Subscription.find({
        status: 'active',
        expiryDate: { $lte: now }
      });

      if (expiredSubs.length > 0) {
        console.log(`[Subscription Expiry] Found ${expiredSubs.length} subscriptions to expire.`);
        for (const sub of expiredSubs) {
          sub.status = 'expired';
          await sub.save();

          // Decrement subscriberCount on creator profile
          await CreatorProfile.updateOne(
            { userId: sub.creatorId },
            { $inc: { subscriberCount: -1 } }
          );
          
          // Enforce min 0 subscriberCount
          await CreatorProfile.updateOne(
            { userId: sub.creatorId, subscriberCount: { $lt: 0 } },
            { $set: { subscriberCount: 0 } }
          );

          console.log(`[Subscription Expiry] Expired sub ID ${sub._id}: User ${sub.userId} to Creator ${sub.creatorId}`);
        }
      }
    } catch (err) {
      console.error('[Subscription Expiry] Error running sub expiration:', err);
    }
  });
  console.log('[Scheduler] Subscription expiration cron task initialized ⏰');
};

module.exports = {
  initPostScheduler,
  initSubscriptionExpirationScheduler
};
