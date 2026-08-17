const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const Post = require('../models/Post');
const Story = require('../models/Story');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const CallLog = require('../models/CallLog');
const LiveStream = require('../models/LiveStream');
const Message = require('../models/Message');
const Wallet = require('../models/Wallet');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantrio';

const EMAIL = 'creator@gmail.com';
const PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
const daysAgo = (n, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 7) % 60, 0, 0);
  return d;
};

const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

const monthAgo = (months, dayOffset = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(Math.max(1, Math.min(28, d.getDate() - dayOffset)));
  d.setHours(10 + (dayOffset % 8), (dayOffset * 7) % 60, 0, 0);
  return d;
};

let roomCounter = 0;
const uniqueRoom = (prefix) => `seed_${prefix}_${Date.now()}_${(roomCounter += 1)}_${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
const seedCreatorData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Connected!');

    // 1. Creator user + profile + wallet
    let creator = await User.findOne({ email: EMAIL }).select('+password');
    if (!creator) {
      creator = await User.create({
        email: EMAIL,
        password: PASSWORD,
        role: 'creator',
        isVerified: true,
        username: 'creator',
        displayName: 'Creator',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        notificationPreferences: {
          newMessages: true,
          newSubscribers: true,
          tipsAndPayments: true,
          liveStreamReminders: true,
          productPurchases: true,
          announcements: true
        }
      });
      console.log('Creator user created.');
    }

    let profile = await CreatorProfile.findOne({ userId: creator._id });
    if (!profile) {
      profile = await CreatorProfile.create({
        userId: creator._id,
        username: 'creator',
        displayName: 'Creator',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        coverBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        bio: 'Digital creator on Fantrio. Exclusive content and great conversations!',
        categories: ['Lifestyle', 'Entertainment'],
        verificationStatus: 'approved',
        rates: { subscriptionMonthly: 18, audioCallPerMin: 5, videoCallPerMin: 10 },
        subscriptionPlans: [
          { name: 'Basic', priceCoins: 10, isActive: true, features: ['Exclusive posts', 'Community chat'] },
          { name: 'Premium', priceCoins: 18, isActive: true, features: ['Exclusive posts & videos', 'Priority messages', '1:1 chat'] },
          { name: 'VIP', priceCoins: 30, isActive: true, features: ['Everything in Premium', 'Monthly video call', 'Priority support'] }
        ]
      });
      console.log('CreatorProfile created.');
    }

    // Ensure the documented password works (rehash if needed)
    if (!(await creator.comparePassword(PASSWORD, creator.password))) {
      creator.password = PASSWORD;
      await creator.save({ validateBeforeSave: false });
      console.log('Creator password reset to password123.');
    }

    // Update profile scalars that make the panel look alive
    profile.displayName = profile.displayName || 'Creator';
    profile.isVerifiedBadge = true;
    profile.verificationStatus = 'approved';
    profile.audioAvailable = true;
    profile.videoAvailable = true;
    profile.isOnline = true;
    profile.followerCount = 24500;
    profile.profileViews = 128400;
    profile.rating = 4.9;
    profile.ratingCount = 3200;
    profile.contentType = ['Photos', 'Videos'];
    await profile.save({ validateBeforeSave: false });

    let wallet = await Wallet.findOne({ userId: creator._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: creator._id, balanceCoins: 2500 });
    } else {
      wallet.balanceCoins = 2500;
      wallet.payoutMethod = {
        accountHolder: profile.displayName,
        bankName: 'Bank Transfer',
        routingNumber: '021000021',
        accountNumber: '4928123019',
        verified: true
      };
      await wallet.save({ validateBeforeSave: false });
    }

    // 2. Fan users (find or create so re-runs are safe)
    const fanData = [
      { email: 'sarah@example.com', username: 'sarahj', displayName: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
      { email: 'mike@example.com', username: 'miket', displayName: 'Michael Thompson', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
      { email: 'emma@example.com', username: 'emmad', displayName: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
      { email: 'david@example.com', username: 'davew', displayName: 'David Wilson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
      { email: 'olivia@example.com', username: 'oliviam', displayName: 'Olivia Martinez', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' },
      { email: 'james@example.com', username: 'jamesa', displayName: 'James Anderson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
      { email: 'sophiab@example.com', username: 'sophiab', displayName: 'Sophia Brown', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { email: 'dannyg@example.com', username: 'dannyg', displayName: 'Daniel Garcia', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
      { email: 'emilyc@example.com', username: 'emilyc', displayName: 'Emily Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
      { email: 'ryant@example.com', username: 'ryant', displayName: 'Ryan Taylor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
      { email: 'avam@example.com', username: 'ava_m', displayName: 'Ava Martinez', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80' },
      { email: 'liamw@example.com', username: 'liam_w', displayName: 'Liam Wright', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' }
    ];

    const fans = [];
    for (const f of fanData) {
      let fan = await User.findOne({ $or: [{ email: f.email }, { username: f.username }] });
      if (!fan) {
        fan = await User.create({
          email: f.email,
          password: PASSWORD,
          role: 'user',
          isVerified: true,
          username: f.username,
          displayName: f.displayName,
          avatarUrl: f.avatar
        });
      }
      let fanWallet = await Wallet.findOne({ userId: fan._id });
      if (!fanWallet) await Wallet.create({ userId: fan._id, balanceCoins: 800 });
      fans.push(fan);
    }
    console.log(`Ensured ${fans.length} fans.`);

    // 3. Clear this creator's existing seeded data (idempotent re-run)
    await Post.deleteMany({ creatorId: creator._id });
    await Story.deleteMany({ creatorId: creator._id });
    await Subscription.deleteMany({ creatorId: creator._id });
    await Transaction.deleteMany({
      $or: [
        { receiverId: creator._id },
        { senderId: creator._id, type: 'withdrawal' }
      ]
    });
    await CallLog.deleteMany({ receiverId: creator._id });
    await LiveStream.deleteMany({ creatorId: creator._id });
    await Message.deleteMany({
      $or: [{ senderId: creator._id }, { receiverId: creator._id }]
    });
    console.log('Cleared previous creator data.');

    const likeTargets = fans.map((f) => f._id);
    const commentTexts = [
      'Love this! 😍',
      'Absolutely stunning 🔥',
      'Can\'t wait for more!',
      'This made my day 💖',
      'Great content as always!',
      'You look amazing!',
      'Keep it coming!',
      'My favorite creator ❤️'
    ];

    // 4. Posts (free, subscription, PPV) with likes/comments
    const postMedia = (url, type, thumb) => [{ url, type, thumbnailUrl: thumb || url, isLocked: type !== 'audio' && false }];
    const postData = [
      { content: 'Good morning everyone! Sending positive vibes for a productive week ☀️ #morningvibes', postType: 'free', coinPrice: 0, media: postMedia('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 'image'), likes: 312, comments: 45, shares: 89 },
      { content: 'Behind the scenes from my latest shoot 📸 #bts #lifestyle', postType: 'free', coinPrice: 0, media: postMedia('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 'image'), likes: 480, comments: 62, shares: 130 },
      { content: 'My favorite workout playlist — perfect for your morning run 🎧', postType: 'subscription', coinPrice: 0, media: postMedia('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80', 'audio'), likes: 90, comments: 14, shares: 5 },
      { content: 'Voice note check-in for my subscribers 🎙️ #subscribersonly', postType: 'subscription', coinPrice: 0, media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'), likes: 112, comments: 18, shares: 7 },
      { content: 'Unlock my exclusive behind-the-scenes video from the last photo shoot 📸 #exclusive #bts', postType: 'ppv', coinPrice: 50, media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-dancing-34360-large.mp4', 'video', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'), likes: 754, comments: 89, shares: 120 },
      { content: 'Sunset rooftop shoot was magical 🌅 #model #behindthescenes', postType: 'ppv', coinPrice: 40, media: postMedia('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80', 'image'), likes: 198, comments: 14, shares: 15 },
      { content: 'Exclusive Q&A — you asked, I answered 🎥 #exclusive', postType: 'ppv', coinPrice: 35, media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happily-in-summer-39864-large.mp4', 'video', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'), likes: 423, comments: 51, shares: 66 },
      { content: 'Coffee break between sets ☕✨ #lifestyle #vibes', postType: 'free', coinPrice: 0, media: postMedia('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', 'image'), likes: 244, comments: 31, shares: 30 },
      { content: 'Weekly vlog is up — this one is extra special 💫 #vlog', postType: 'ppv', coinPrice: 60, media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-dancing-34360-large.mp4', 'video', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'), likes: 610, comments: 78, shares: 95 },
      { content: 'Quick home workout routine you can do anywhere 🔥 #fitness #workout', postType: 'ppv', coinPrice: 20, media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-in-sportswear-doing-exercises-at-home-40893-large.mp4', 'video', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'), likes: 190, comments: 32, shares: 61 },
      { content: 'New drop coming this weekend — stay tuned 👀 #sneakpeek', postType: 'free', coinPrice: 0, media: postMedia('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80', 'image'), likes: 270, comments: 40, shares: 55 }
    ];

    const seededPosts = [];
    for (let i = 0; i < postData.length; i++) {
      const p = postData[i];
      const likesArr = [];
      for (let k = 0; k < p.likes; k++) {
        likesArr.push(k < likeTargets.length ? likeTargets[k] : new mongoose.Types.ObjectId());
      }
      const commentsArr = [];
      for (let k = 0; k < p.comments; k++) {
        commentsArr.push({ userId: likeTargets[k % likeTargets.length], text: commentTexts[k % commentTexts.length] });
      }
      const post = await Post.create({
        creatorId: creator._id,
        content: p.content,
        postType: p.postType,
        coinPrice: p.coinPrice,
        media: p.media.map((m) => ({ ...m, isLocked: p.postType === 'ppv' ? true : false })),
        likes: likesArr,
        comments: commentsArr,
        sharesCount: p.shares,
        isPublished: true,
        createdAt: daysAgo(i * 3 + 1, 10 + i),
        updatedAt: daysAgo(i * 3 + 1, 10 + i)
      });
      // Seed a few realistic post reports (embedded array) so the admin
      // Posts & Moderation -> Reports Log has post-only data to review.
      const reportPlans = {
        4: [
          { fanIdx: 2, reason: 'Misleading content', description: 'The preview does not match the actual video.' },
          { fanIdx: 5, reason: 'Copyright Infringement' }
        ],
        7: [{ fanIdx: 1, reason: 'Inappropriate Content', description: 'Contains material that should be age-gated.' }],
        9: [{ fanIdx: 3, reason: 'Spam', description: 'Repeated promotional content.' }]
      };
      const plans = reportPlans[i];
      if (plans) {
        post.reports = plans.map((r, ri) => ({
          userId: fans[r.fanIdx % fans.length]._id,
          reason: r.reason,
          description: r.description || '',
          date: new Date(daysAgo(i * 3 + 1 + ri, 14 + ri))
        }));
        await post.save({ validateBeforeSave: false });
      }
      seededPosts.push(post);
    }
    console.log(`Seeded ${seededPosts.length} posts.`);

    // 5. Stories
    const storyMedia = [
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', type: 'image' }
    ];
    for (let i = 0; i < storyMedia.length; i++) {
      const media = storyMedia[i];
      await Story.create({
        creatorId: creator._id,
        mediaUrl: media.url,
        mediaType: media.type,
        expiresAt: new Date(Date.now() + (i % 2 === 0 ? 24 : 12) * 60 * 60 * 1000),
        views: fans.slice(0, 3 + i).map((f) => f._id),
        createdAt: hoursAgo((i + 1) * 3),
        updatedAt: hoursAgo((i + 1) * 3)
      });
    }
    console.log('Seeded stories.');

    // 6. Subscriptions + linked transactions
    const createSubscription = async ({ fan, plan, status, startDaysAgo, expiryOffsetDays, createdDaysAgo }) => {
      const prices = { Basic: 10, Premium: 18, VIP: 30 };
      const createdDate = daysAgo(createdDaysAgo);
      const sub = await Subscription.create({
        userId: fan._id,
        creatorId: creator._id,
        status,
        plan,
        startDate: daysAgo(startDaysAgo),
        expiryDate: new Date(Date.now() + expiryOffsetDays * 24 * 60 * 60 * 1000),
        priceCoins: prices[plan],
        createdAt: createdDate,
        updatedAt: createdDate
      });
      await Transaction.create({
        senderId: fan._id,
        receiverId: creator._id,
        type: 'subscription',
        status: 'completed',
        amountCoins: prices[plan],
        referenceId: sub._id,
        gateway: 'internal',
        createdAt: createdDate,
        updatedAt: createdDate
      });
    };

    const subRows = [
      { fanIdx: 0, plan: 'Premium', status: 'active', start: -10, expiry: 20, created: -10 },
      { fanIdx: 1, plan: 'VIP', status: 'active', start: -20, expiry: 10, created: -20 },
      { fanIdx: 2, plan: 'Premium', status: 'active', start: -2, expiry: 28, created: -2 },
      { fanIdx: 3, plan: 'Premium', status: 'active', start: -26, expiry: 3, created: -26 },   // expiring soon
      { fanIdx: 4, plan: 'Basic', status: 'active', start: -12, expiry: 18, created: -12 },
      { fanIdx: 5, plan: 'VIP', status: 'active', start: -8, expiry: 22, created: -8 },
      { fanIdx: 6, plan: 'Premium', status: 'cancelled', start: -60, expiry: -30, created: -60 },
      { fanIdx: 7, plan: 'Basic', status: 'cancelled', start: -70, expiry: -40, created: -70 },
      { fanIdx: 8, plan: 'VIP', status: 'active', start: -27, expiry: 2, created: -27 },     // expiring soon
      { fanIdx: 9, plan: 'Premium', status: 'active', start: -5, expiry: 25, created: -5 },
      { fanIdx: 10, plan: 'Premium', status: 'expired', start: -45, expiry: -15, created: -45 },
      { fanIdx: 11, plan: 'Basic', status: 'expired', start: -55, expiry: -25, created: -55 }
    ];
    for (const row of subRows) {
      await createSubscription({
        fan: fans[row.fanIdx],
        plan: row.plan,
        status: row.status,
        startDaysAgo: Math.abs(row.start),
        expiryOffsetDays: row.expiry,
        createdDaysAgo: Math.abs(row.created)
      });
    }

    // Historical monthly subscription renewals (5 months)
    const subPlans = ['Basic', 'Premium', 'VIP'];
    const subPrices = { Basic: 10, Premium: 18, VIP: 30 };
    for (let m = 1; m <= 5; m++) {
      const count = 4 + (m % 3);
      for (let i = 0; i < count; i++) {
        const fan = fans[(m * 3 + i) % fans.length];
        const plan = subPlans[(m + i) % 3];
        const createdAt = monthAgo(m, i * 2);
        await Transaction.create({
          senderId: fan._id,
          receiverId: creator._id,
          type: 'subscription',
          status: 'completed',
          amountCoins: subPrices[plan],
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }
    console.log('Seeded subscriptions.');

    // 7. Live streams: live now + ended + scheduled
    const roomId = () => `live_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    // Currently live
    await LiveStream.create({
      creatorId: creator._id,
      streamTitle: 'Friday Night Vibes — Q&A 🔴',
      category: 'Just Chatting',
      language: 'English',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
      isLive: true,
      entryPriceCoins: 5,
      freeForSubscribers: true,
      viewers: fans.slice(0, 9).map((f) => f._id),
      viewerCount: 9,
      peakViewers: 14,
      totalViews: 42,
      roomId: roomId(),
      startedAt: hoursAgo(2)
    });
    profile.isLive = true;
    await profile.save({ validateBeforeSave: false });

    // Ended streams with paid entries
    const endedStreamData = [
      { title: 'Workout Time 💪', category: 'Fitness', coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', daysAgo: 3, minutes: 62, views: 2400, price: 5 },
      { title: 'Chill & Chat ✨', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80', daysAgo: 5, minutes: 50, views: 1800, price: 5 },
      { title: 'Music Vibes 🎵', category: 'Music', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', daysAgo: 8, minutes: 75, views: 2100, price: 10 },
      { title: 'Behind the Scenes', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', daysAgo: 11, minutes: 40, views: 1500, price: 0 }
    ];
    const seededStreams = [];
    for (const s of endedStreamData) {
      const ended = daysAgo(s.daysAgo, 20);
      const started = new Date(ended.getTime() - s.minutes * 60 * 1000);
      const stream = await LiveStream.create({
        creatorId: creator._id,
        streamTitle: s.title,
        category: s.category,
        language: 'English',
        coverUrl: s.coverUrl,
        isLive: false,
        entryPriceCoins: s.price,
        freeForSubscribers: true,
        viewers: [],
        viewerCount: 0,
        peakViewers: Math.round(s.views * 0.4),
        totalViews: s.views,
        roomId: roomId(),
        startedAt: started,
        endedAt: ended,
        createdAt: started,
        updatedAt: ended
      });
      seededStreams.push(stream);
      // Paid entries for streams with a price
      if (s.price > 0) {
        for (let i = 0; i < 6; i++) {
          await Transaction.create({
            senderId: fans[i % fans.length]._id,
            receiverId: creator._id,
            type: 'live_entry',
            status: 'completed',
            amountCoins: s.price,
            referenceId: stream._id,
            gateway: 'internal',
            createdAt: started,
            updatedAt: started
          });
        }
      }
    }

    // Scheduled (upcoming) streams
    const scheduledStreamData = [
      { title: 'Sunday Vibes', category: 'Music', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', daysAhead: 1, entryPriceCoins: 3, free: true },
      { title: 'Morning Routine', category: 'Lifestyle', coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', daysAhead: 3, entryPriceCoins: 0, free: false },
      { title: 'Exclusive Q&A Night', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80', daysAhead: 5, entryPriceCoins: 10, free: false }
    ];
    for (const s of scheduledStreamData) {
      await LiveStream.create({
        creatorId: creator._id,
        streamTitle: s.title,
        category: s.category,
        language: 'English',
        coverUrl: s.coverUrl,
        isLive: false,
        scheduledAt: new Date(Date.now() + s.daysAhead * 24 * 60 * 60 * 1000),
        entryPriceCoins: s.entryPriceCoins,
        freeForSubscribers: s.free,
        viewers: [],
        viewerCount: 0,
        roomId: roomId(),
        startedAt: new Date(),
        createdAt: new Date()
      });
    }
    console.log('Seeded live streams.');

    // 8. Call logs (audio + video) + call_billing transactions
    const callSeedData = [
      { callerIdx: 0, type: 'audio', status: 'completed', mins: 12, daysAgo: 1 },
      { callerIdx: 1, type: 'audio', status: 'completed', mins: 8, daysAgo: 2 },
      { callerIdx: 2, type: 'audio', status: 'completed', mins: 15, daysAgo: 3 },
      { callerIdx: 3, type: 'audio', status: 'missed', mins: 0, daysAgo: 3 },
      { callerIdx: 4, type: 'audio', status: 'completed', mins: 5, daysAgo: 5 },
      { callerIdx: 5, type: 'audio', status: 'completed', mins: 20, daysAgo: 7 },
      { callerIdx: 6, type: 'audio', status: 'rejected', mins: 0, daysAgo: 8 },
      { callerIdx: 7, type: 'audio', status: 'completed', mins: 10, daysAgo: 10 },
      { callerIdx: 0, type: 'video', status: 'completed', mins: 25, daysAgo: 2 },
      { callerIdx: 1, type: 'video', status: 'completed', mins: 18, daysAgo: 4 },
      { callerIdx: 2, type: 'video', status: 'completed', mins: 30, daysAgo: 6 },
      { callerIdx: 3, type: 'video', status: 'missed', mins: 0, daysAgo: 9 },
      { callerIdx: 4, type: 'video', status: 'completed', mins: 12, daysAgo: 11 },
      { callerIdx: 5, type: 'video', status: 'completed', mins: 22, daysAgo: 13 },
      { callerIdx: 8, type: 'audio', status: 'initiated', mins: 0, daysAgo: 0 },
      { callerIdx: 9, type: 'video', status: 'initiated', mins: 0, daysAgo: 0 }
    ];
    // Gifts sent during specific calls (matched by callerIdx below).
    const callGiftSeed = {
      0: { coins: 30, extra: 2 },
      1: { coins: 10, extra: 0 },
      2: { coins: 60, extra: 1 },
      8: { coins: 100, extra: 0 },
      9: { coins: 200, extra: 1 },
      10: { coins: 10, extra: 0 }
    };
    for (let ci = 0; ci < callSeedData.length; ci++) {
      const c = callSeedData[ci];
      const rate = c.type === 'audio' ? 5 : 10;
      const billed = c.mins * rate;
      const createdAt = c.daysAgo === 0 ? hoursAgo(1) : daysAgo(c.daysAgo, 12 + c.callerIdx);
      const log = await CallLog.create({
        callerId: fans[c.callerIdx % fans.length]._id,
        receiverId: creator._id,
        roomId: uniqueRoom(c.type),
        type: c.type,
        status: c.status,
        coinRatePerMinute: rate,
        totalMinutesBilling: c.mins,
        totalCoinsBilled: c.status === 'completed' ? billed : 0,
        endedAt: c.status === 'completed' ? new Date(createdAt.getTime() + c.mins * 60 * 1000) : null,
        createdAt,
        updatedAt: createdAt
      });
      if (c.status === 'completed') {
        await Transaction.create({
          senderId: fans[c.callerIdx % fans.length]._id,
          receiverId: creator._id,
          type: 'call_billing',
          status: 'completed',
          amountCoins: billed,
          referenceId: log._id,
          metadata: { callType: c.type },
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
      // Gifts sent during this call, linked via metadata.callRoomId so the
      // admin Calls page can show a Gifts column per call.
      const giftPlan = callGiftSeed[ci];
      if (giftPlan && c.status === 'completed') {
        for (let i = 0; i < 1 + giftPlan.extra; i++) {
          await Transaction.create({
            senderId: fans[c.callerIdx % fans.length]._id,
            receiverId: creator._id,
            type: 'gift',
            status: 'completed',
            amountCoins: giftPlan.coins,
            gateway: 'internal',
            metadata: { callRoomId: log.roomId },
            createdAt,
            updatedAt: createdAt
          });
        }
      }
    }
    console.log('Seeded call logs.');

    // 9. Tips + PPV unlocks across months
    const tipValues = [5, 10, 15, 20, 25, 50];
    for (let m = 1; m <= 5; m++) {
      const count = 3 + (m % 2);
      for (let i = 0; i < count; i++) {
        const fan = fans[(m + i) % fans.length];
        const amount = tipValues[(m + i) % tipValues.length];
        const createdAt = monthAgo(m, i);
        await Transaction.create({
          senderId: fan._id,
          receiverId: creator._id,
          type: 'tip',
          status: 'completed',
          amountCoins: amount,
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }
    // Recent tips today
    for (let i = 0; i < 4; i++) {
      await Transaction.create({
        senderId: fans[i]._id,
        receiverId: creator._id,
        type: 'tip',
        status: 'completed',
        amountCoins: [10, 20, 50, 15][i],
        gateway: 'internal',
        createdAt: hoursAgo(i * 2 + 1),
        updatedAt: hoursAgo(i * 2 + 1)
      });
    }

    const ppvPosts = seededPosts.filter((p) => p.postType === 'ppv');
    for (let m = 1; m <= 5; m++) {
      const count = 3 + (m % 2);
      for (let i = 0; i < count; i++) {
        const post = ppvPosts[i % Math.max(1, ppvPosts.length)];
        const fan = fans[(m + i + 2) % fans.length];
        const createdAt = monthAgo(m, i + 1);
        await Transaction.create({
          senderId: fan._id,
          receiverId: creator._id,
          type: 'ppv_unlock',
          status: 'completed',
          amountCoins: post.coinPrice || 20,
          referenceId: post._id,
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }
    // Recent PPV unlocks
    for (let i = 0; i < ppvPosts.length; i++) {
      await Transaction.create({
        senderId: fans[(i + 3) % fans.length]._id,
        receiverId: creator._id,
        type: 'ppv_unlock',
        status: 'completed',
        amountCoins: ppvPosts[i].coinPrice,
        referenceId: ppvPosts[i]._id,
        gateway: 'internal',
        createdAt: hoursAgo(i * 5 + 2),
        updatedAt: hoursAgo(i * 5 + 2)
      });
    }
    console.log('Seeded tips + PPV transactions.');


    // 11. Withdrawals (payout history + pending)
    const withdrawals = [
      { amount: 1200, daysAgo: 25, status: 'completed' },
      { amount: 850, daysAgo: 50, status: 'completed' },
      { amount: 300, daysAgo: 75, status: 'completed' },
      { amount: 640, daysAgo: 2, status: 'pending' }
    ];
    for (const w of withdrawals) {
      const createdAt = daysAgo(w.daysAgo, 9);
      await Transaction.create({
        senderId: creator._id,
        receiverId: null,
        type: 'withdrawal',
        status: w.status,
        amountCoins: w.amount,
        metadata: { method: 'Bank Transfer' },
        gateway: 'internal',
        createdAt,
        updatedAt: createdAt
      });
    }
    console.log('Seeded withdrawals.');

    // 12. Messages / conversations with fans
    const chatThreads = [
      { fanIdx: 0, msgs: [
        { side: 'fan', text: 'Hey! Your last stream was incredible 🔥', hoursAgo: 50 },
        { side: 'creator', text: 'Thank you so much Sarah! Means a lot 🥰', hoursAgo: 49 },
        { side: 'fan', text: 'When is the next one? I have to be there!', hoursAgo: 3 },
        { side: 'creator', text: 'This weekend! Stay tuned 😉', hoursAgo: 2 }
      ] },
      { fanIdx: 1, msgs: [
        { side: 'fan', text: 'Loved the workout video today 💪', hoursAgo: 30 },
        { side: 'creator', text: 'You\'re too kind Michael! 💕', hoursAgo: 29 },
        { side: 'fan', text: 'Just unlocked the BTS video — so good!', hoursAgo: 6 }
      ] },
      { fanIdx: 2, msgs: [
        { side: 'fan', text: 'Just subscribed to your VIP plan! 🎉', hoursAgo: 100 },
        { side: 'creator', text: 'Welcome to the family Emma! 🩷', hoursAgo: 99 },
        { side: 'fan', text: 'Here\'s a special thank you for your support 😘', hoursAgo: 20, paywall: true, coinPrice: 40 },
        { side: 'fan', text: 'Ooh, unlocking right now!', hoursAgo: 19 }
      ] },
      { fanIdx: 3, msgs: [
        { side: 'fan', text: 'Any spoilers on the next topic?', hoursAgo: 6 },
        { side: 'creator', text: 'Maybe... you\'ll have to come find out 👀', hoursAgo: 5, paywall: true, coinPrice: 15 }
      ] },
      { fanIdx: 4, msgs: [
        { side: 'fan', text: 'Your content is everything 🛍️', hoursAgo: 24 }
      ] },
      { fanIdx: 5, msgs: [
        { side: 'fan', text: 'That Q&A session was so fun to watch!', hoursAgo: 12 },
        { side: 'creator', text: 'Glad you enjoyed it James! 🎬', hoursAgo: 11 }
      ] },
      { fanIdx: 6, msgs: [
        { side: 'fan', text: 'Do you take song requests?', hoursAgo: 70 },
        { side: 'creator', text: 'Of course! Send me your favourites 💿', hoursAgo: 69 }
      ] },
      { fanIdx: 7, msgs: [
        { side: 'fan', text: 'Just sent a tip! You deserve it ❤️', hoursAgo: 5 },
        { side: 'creator', text: 'You\'re amazing Daniel, thank you! 🙏', hoursAgo: 4 }
      ] }
    ];
    for (const thread of chatThreads) {
      const fan = fans[thread.fanIdx];
      for (const m of thread.msgs) {
        const createdAt = hoursAgo(m.hoursAgo);
        const senderId = m.side === 'fan' ? fan._id : creator._id;
        const receiverId = m.side === 'fan' ? creator._id : fan._id;
        await Message.create({
          senderId,
          receiverId,
          content: m.text,
          mediaType: 'none',
          isPaywall: !!m.paywall,
          coinPrice: m.paywall ? m.coinPrice : 0,
          isOpened: m.side === 'creator',
          createdAt,
          updatedAt: createdAt
        });
      }
    }
    console.log('Seeded messages.');

    // 13. Reconcile subscriberCount with active subscriptions
    const activeSubs = await Subscription.aggregate([
      { $match: { creatorId: creator._id, status: 'active', expiryDate: { $gt: new Date() } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    profile.subscriberCount = activeSubs[0] ? activeSubs[0].count : 0;
    await profile.save({ validateBeforeSave: false });

    console.log('Creator data seeded successfully!');
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
  } catch (error) {
    console.error('Error seeding creator data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedCreatorData();
