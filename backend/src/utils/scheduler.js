const cron = require('node-cron');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const CreatorProfile = require('../models/CreatorProfile');
const Story = require('../models/Story');
const awsService = require('../services/aws.service');

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

// Run daily to purge expired stories. Media uploaded to cloud storage must be deleted
// along with the database record so expired stories don't leak storage.
const initStoryExpirationScheduler = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      const expiredStories = await Story.find({ expiresAt: { $lte: new Date() } }).select('mediaUrl');
      if (expiredStories.length === 0) return;

      // Best-effort removal from cloud storage (external/seeded URLs are skipped safely).
      await awsService.deleteS3Media(expiredStories.map((s) => s.mediaUrl));

      const result = await Story.deleteMany({ _id: { $in: expiredStories.map((s) => s._id) } });
      if (result.deletedCount > 0) {
        console.log(`[Story Expiry] Purged ${result.deletedCount} expired stories (media cleaned).`);
      }
    } catch (err) {
      console.error('[Story Expiry] Error purging expired stories:', err);
    }
  });
  console.log('[Scheduler] Story expiration cron task initialized ⏰');
};

// Keep live streams healthy:
//  - cancel scheduled streams that never went live (overdue > 6h)
//  - auto-end streams that have been running for more than 12h (safety net)
const initLiveStreamScheduler = () => {
  const LiveStream = require('../models/LiveStream');
  const CreatorProfile = require('../models/CreatorProfile');

  // Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const overdue = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Cancel scheduled streams that never went live
      const stale = await LiveStream.find({
        isLive: false,
        scheduledAt: { $ne: null, $lte: overdue },
        cancelledAt: null
      });
      if (stale.length > 0) {
        for (const stream of stale) {
          stream.cancelledAt = now;
          await stream.save({ validateBeforeSave: false });
        }
        console.log(`[Live Stream] Cancelled ${stale.length} overdue scheduled stream(s).`);
      }

      // Auto-end streams running longer than 12h
      const staleLiveCutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const staleLive = await LiveStream.find({
        isLive: true,
        startedAt: { $ne: null, $lte: staleLiveCutoff }
      });
      for (const stream of staleLive) {
        stream.isLive = false;
        stream.endedAt = now;
        stream.viewers = [];
        stream.viewerCount = 0;
        await stream.save({ validateBeforeSave: false });
        await CreatorProfile.updateOne(
          { userId: stream.creatorId },
          { $set: { isLive: false } }
        );
        console.log(`[Live Stream] Auto-ended stale stream ${stream._id} (running > 12h).`);
      }
    } catch (err) {
      console.error('[Live Stream] Error running live stream scheduler:', err);
    }
  });
  console.log('[Scheduler] Live stream cleanup cron task initialized ⏰');
};

module.exports = {
  initPostScheduler,
  initSubscriptionExpirationScheduler,
  initStoryExpirationScheduler,
  initLiveStreamScheduler
};
