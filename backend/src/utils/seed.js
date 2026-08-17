const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const Post = require('../models/Post');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Story = require('../models/Story');
const LiveStream = require('../models/LiveStream');
const SystemSetting = require('../models/SystemSetting');
const Faq = require('../models/Faq');
const PaymentMethod = require('../models/PaymentMethod');
const SupportTicket = require('../models/SupportTicket');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const CallLog = require('../models/CallLog');
const Report = require('../models/Report');
const Announcement = require('../models/Announcement');
const FeatureRequest = require('../models/FeatureRequest');
const Message = require('../models/Message');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantrio';

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Connected! Clearing existing data...');

    await User.deleteMany({});
    await CreatorProfile.deleteMany({});
    await Post.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Subscription.deleteMany({});
    await Story.deleteMany({});
    await LiveStream.deleteMany({});
    await SystemSetting.deleteMany({});
    await Faq.deleteMany({});
    await PaymentMethod.deleteMany({});
    await SupportTicket.deleteMany({});
    await Referral.deleteMany({});
    await Reward.deleteMany({});
    await CallLog.deleteMany({});
    await Report.deleteMany({});
    await Announcement.deleteMany({});
    await FeatureRequest.deleteMany({});
    await Message.deleteMany({});

    console.log('Data cleared. Seeding users...');

    // Default password (will be hashed once by User pre-save hook)
    const hashedPassword = 'password123';

    // 0. Create Admin User from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fantrio.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

    await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      username: adminUsername,
      displayName: 'System Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
    });

    // 1. Create Logged-In User (Johnn)
    const johnn = await User.create({
      email: 'johnn@example.com',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      username: 'johnn',
      displayName: 'Johnn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      bio: 'Just a fan of the creators on Fantrio. Here for the exclusive content and great conversations!',
      notificationPreferences: {
        newMessages: true,
        newSubscribers: true,
        tipsAndPayments: true,
        liveStreamReminders: false,
        productPurchases: true,
        announcements: false
      },
      loginActivity: [
        { device: 'Windows Computer', ip: '192.168.1.21', location: 'New York, USA', loggedInAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        { device: 'Mobile Device', ip: '172.20.10.4', location: 'Brooklyn, USA', loggedInAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ]
    });

    // Create Johnn's Wallet with 1254 coins
    await Wallet.create({
      userId: johnn._id,
      balanceCoins: 1254.00
    });

    // 2. Create Molly Jane (Creator)
    const molly = await User.create({
      email: 'molly@example.com',
      password: hashedPassword,
      role: 'creator',
      isVerified: true,
      username: 'mollyjane',
      displayName: 'Molly Jane',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    });

    await CreatorProfile.create({
      userId: molly._id,
      username: 'mollyjane',
      displayName: 'Molly Jane',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      coverBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      bio: 'Digital creator & fitness enthusiast. Daily post-workout updates and exclusive content! #fitness #lifestyle',
      categories: ['Fitness', 'Lifestyle'],
      isVerifiedBadge: true,
      verificationStatus: 'approved',
      rates: {
        subscriptionMonthly: 18,
        audioCallPerMin: 5,
        videoCallPerMin: 10
      },
      subscriptionPlans: [
        { name: 'Basic', priceCoins: 10, isActive: true, features: ['Exclusive posts', 'Community chat'] },
        { name: 'Premium', priceCoins: 18, isActive: true, features: ['Exclusive posts & videos', 'Priority messages', '1:1 chat'] },
        { name: 'VIP', priceCoins: 30, isActive: true, features: ['Everything in Premium', 'Monthly video call', 'Priority support'] }
      ],
      followerCount: 15430,
      subscriberCount: 342,
      isOnline: true,
      isLive: true
    });

    await Wallet.create({
      userId: molly._id,
      balanceCoins: 500.00
    });

    // 3. Create other top creators matching UI with diverse properties
    const creatorsData = [
      {
        name: 'Leslie Alexander',
        username: 'leslie_alexander',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        categories: ['Fashion', 'Lifestyle'],
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: false,
        country: 'United States',
        language: 'English',
        contentType: ['Photos'],
        rating: 4.8,
        ratingCount: 15400,
        followerCount: 12500,
        subscriberCount: 420,
        rates: { subscriptionMonthly: 25, audioCallPerMin: 6, videoCallPerMin: 12 }
      },
      {
        name: 'Jenny Wilson',
        username: 'jenny_wilson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        categories: ['Gaming', 'Lifestyle'],
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'Canada',
        language: 'English',
        contentType: ['Videos'],
        rating: 4.9,
        ratingCount: 9500,
        followerCount: 22000,
        subscriberCount: 810,
        rates: { subscriptionMonthly: 20, audioCallPerMin: 7, videoCallPerMin: 14 }
      },
      {
        name: 'Kristin Watson',
        username: 'kristin_watson',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
        categories: ['Music', 'Entertainment'],
        isOnline: true,
        isLive: false,
        audioAvailable: false,
        videoAvailable: true,
        country: 'United Kingdom',
        language: 'English',
        contentType: ['Photos', 'Videos'],
        rating: 4.7,
        ratingCount: 11000,
        followerCount: 18500,
        subscriberCount: 310,
        rates: { subscriptionMonthly: 15, audioCallPerMin: 4, videoCallPerMin: 9 }
      },
      {
        name: 'Savannah Nguyen',
        username: 'savannah_nguyen',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        categories: ['Model', 'Influencer'],
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        country: 'United States',
        language: 'English',
        contentType: ['Photos', 'Videos', 'PPV'],
        rating: 4.9,
        ratingCount: 12500,
        followerCount: 50000,
        subscriberCount: 1540,
        rates: { subscriptionMonthly: 30, audioCallPerMin: 8, videoCallPerMin: 16 }
      },
      {
        name: 'Dianne Russell',
        username: 'dianne_russell',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
        categories: ['Dance', 'Lifestyle'],
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'Australia',
        language: 'English',
        contentType: ['Photos'],
        rating: 4.6,
        ratingCount: 8400,
        followerCount: 9500,
        subscriberCount: 180,
        rates: { subscriptionMonthly: 12, audioCallPerMin: 3, videoCallPerMin: 6 }
      },
      {
        name: 'Harper Quinn',
        username: 'harper_quinn',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
        categories: ['Photography'],
        isOnline: true,
        isLive: false,
        audioAvailable: true,
        videoAvailable: false,
        country: 'United Kingdom',
        language: 'English',
        contentType: ['Photos'],
        rating: 4.7,
        ratingCount: 5200,
        followerCount: 42000,
        subscriberCount: 950,
        rates: { subscriptionMonthly: 22, audioCallPerMin: 6, videoCallPerMin: 12 }
      },
      {
        name: 'Amelia Rose',
        username: 'amelia_rose',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
        categories: ['Travel'],
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        country: 'Australia',
        language: 'English',
        contentType: ['Photos', 'Videos', 'PPV'],
        rating: 4.8,
        ratingCount: 9800,
        followerCount: 34000,
        subscriberCount: 720,
        rates: { subscriptionMonthly: 20, audioCallPerMin: 5, videoCallPerMin: 10 }
      },
      {
        name: 'Evelyn Fox',
        username: 'evelyn_fox',
        avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80',
        categories: ['Gaming'],
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'Germany',
        language: 'German',
        contentType: ['Videos', 'PPV'],
        rating: 4.6,
        ratingCount: 4100,
        followerCount: 27000,
        subscriberCount: 610,
        rates: { subscriptionMonthly: 18, audioCallPerMin: 4, videoCallPerMin: 9 }
      },
      {
        name: 'Grace Kim',
        username: 'grace_kim',
        avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80',
        categories: ['Music'],
        isOnline: true,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'United States',
        language: 'English',
        contentType: ['Photos', 'Videos'],
        rating: 4.9,
        ratingCount: 13700,
        followerCount: 51000,
        subscriberCount: 1100,
        rates: { subscriptionMonthly: 26, audioCallPerMin: 8, videoCallPerMin: 15 }
      },
      {
        name: 'Aria Chen',
        username: 'aria_chen',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        categories: ['Art'],
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'United States',
        language: 'English',
        contentType: ['Photos'],
        rating: 4.5,
        ratingCount: 2100,
        followerCount: 18000,
        subscriberCount: 320,
        rates: { subscriptionMonthly: 15, audioCallPerMin: 3, videoCallPerMin: 6 }
      },
      {
        name: 'Zara Cole',
        username: 'zara_cole',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        categories: ['Dance'],
        isOnline: true,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        country: 'France',
        language: 'French',
        contentType: ['Photos', 'Videos', 'PPV'],
        rating: 4.7,
        ratingCount: 6300,
        followerCount: 23000,
        subscriberCount: 480,
        rates: { subscriptionMonthly: 19, audioCallPerMin: 5, videoCallPerMin: 11 }
      }
    ];

    const storiesCreators = [
      { name: 'Jessica', username: 'jessica', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80', categories: ['Model'], isOnline: true, country: 'Spain', language: 'Spanish' },
      { name: 'Emily', username: 'emily', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80', categories: ['Gaming'], isOnline: false, country: 'Germany', language: 'German' },
      { name: 'Sophia', username: 'sophia', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80', categories: ['Lifestyle'], isOnline: true, country: 'France', language: 'French' },
      { name: 'Angelina', username: 'angelina', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80', categories: ['Fitness'], isOnline: true, country: 'United States', language: 'English', isLive: true },
      { name: 'Mia', username: 'mia', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', categories: ['Art'], isOnline: false, country: 'Italy', language: 'Italian' },
      { name: 'Luna', username: 'luna', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', categories: ['Astrology'], isOnline: true, country: 'United States', language: 'English' },
      { name: 'Emmy', username: 'emmy', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80', categories: ['Photography'], isOnline: false, country: 'United Kingdom', language: 'English' },
      { name: 'Ava', username: 'ava', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80', categories: ['Travel'], isOnline: true, country: 'Australia', language: 'English', isLive: true }
    ];

    const allCreatorsToCreate = [...creatorsData, ...storiesCreators];

    const creatorUserIds = {};
    for (const c of allCreatorsToCreate) {
      const creatorUser = await User.create({
        email: `${c.username}@example.com`,
        password: hashedPassword,
        role: 'creator',
        isVerified: true,
        username: c.username,
        displayName: c.name,
        avatarUrl: c.avatar
      });

      await CreatorProfile.create({
        userId: creatorUser._id,
        username: c.username,
        displayName: c.name,
        avatarUrl: c.avatar,
        coverBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        bio: `Official profile of ${c.name}. Connect with me!`,
        categories: c.categories || ['Model', 'Influencer'],
        isVerifiedBadge: true,
        verificationStatus: 'approved',
        rates: c.rates || { subscriptionMonthly: 15, audioCallPerMin: 4, videoCallPerMin: 8 },
        subscriptionPlans: (c.subscriptionPlans) || (() => {
          const premium = (c.rates && c.rates.subscriptionMonthly) || 15;
          return [
            { name: 'Basic', priceCoins: Math.round(premium * 0.55), isActive: true, features: ['Exclusive posts', 'Community chat'] },
            { name: 'Premium', priceCoins: premium, isActive: true, features: ['Exclusive posts & videos', 'Priority messages', '1:1 chat'] },
            { name: 'VIP', priceCoins: Math.round(premium * 1.65), isActive: true, features: ['Everything in Premium', 'Monthly video call', 'Priority support'] }
          ];
        })(),
        followerCount: c.followerCount || 12500,
        subscriberCount: c.subscriberCount || 210,
        rating: c.rating || 4.9,
        ratingCount: c.ratingCount || 1200,
        isOnline: c.isOnline !== undefined ? c.isOnline : Math.random() > 0.4,
        isLive: c.isLive !== undefined ? c.isLive : false,
        audioAvailable: c.audioAvailable !== undefined ? c.audioAvailable : true,
        videoAvailable: c.videoAvailable !== undefined ? c.videoAvailable : true,
        country: c.country || 'United States',
        language: c.language || 'English',
        contentType: c.contentType || ['Photos', 'Videos']
      });

      await Wallet.create({
        userId: creatorUser._id,
        balanceCoins: 100.00
      });

      creatorUserIds[c.username] = creatorUser._id;
    }

    console.log('Seeding posts...');

    const postMedia = (url, type, thumb) => [
      {
        url,
        type,
        thumbnailUrl: thumb || url,
        isLocked: type !== 'audio' && false
      }
    ];

    const posts = [
      // Molly Jane's posts
      {
        creatorId: molly._id,
        content: 'My Standard Post-workout Meal 💪 #fitness #lifestyle',
        postType: 'ppv',
        coinPrice: 20,
        media: postMedia('https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 156,
        comments: 48,
        shares: 48
      },
      {
        creatorId: molly._id,
        content: 'Quick home workout routine you can do anywhere 🔥 #fitness #workout',
        postType: 'ppv',
        coinPrice: 20,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-in-sportswear-doing-exercises-at-home-40893-large.mp4', 'video', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'),
        likes: 190,
        comments: 32,
        shares: 61
      },
      {
        creatorId: molly._id,
        content: 'Good morning everyone! Sending positive vibes for a productive week ☀️ #morningvibes',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 310,
        comments: 45,
        shares: 89
      },
      {
        creatorId: molly._id,
        content: 'Voice note check-in for my subscribers 🎙️ #exclusive #subscribersonly',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80'),
        likes: 88,
        comments: 12,
        shares: 5
      },
      // Leslie Alexander
      {
        creatorId: creatorUserIds['leslie_alexander'],
        content: 'Behind the scenes from my latest fashion shoot 📸 #fashion #behindthescenes',
        postType: 'ppv',
        coinPrice: 35,
        media: postMedia('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 205,
        comments: 28,
        shares: 42
      },
      {
        creatorId: creatorUserIds['leslie_alexander'],
        content: 'New photos dropping this weekend 👀 #model #exclusive',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 142,
        comments: 19,
        shares: 33
      },
      // Jenny Wilson
      {
        creatorId: creatorUserIds['jenny_wilson'],
        content: 'Live gameplay highlights from last night 🎮 #gaming #stream',
        postType: 'ppv',
        coinPrice: 50,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-gaming-at-her-desk-32837-large.mp4', 'video', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'),
        likes: 89,
        comments: 21,
        shares: 12
      },
      // Kristin Watson
      {
        creatorId: creatorUserIds['kristin_watson'],
        content: 'New acoustic cover coming soon 🎸 #music #singing',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'audio', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'),
        likes: 204,
        comments: 17,
        shares: 24
      },
      // Savannah Nguyen
      {
        creatorId: creatorUserIds['savannah_nguyen'],
        content: 'Unlock my exclusive behind-the-scenes video from the last photo shoot 📸 #exclusive #bts',
        postType: 'ppv',
        coinPrice: 50,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-dancing-34360-large.mp4', 'video', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'),
        likes: 750,
        comments: 89,
        shares: 120
      },
      {
        creatorId: creatorUserIds['savannah_nguyen'],
        content: 'Sunset rooftop shoot was magical 🌅 #model #behindthescenes',
        postType: 'ppv',
        coinPrice: 40,
        media: postMedia('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 198,
        comments: 14,
        shares: 15
      },
      // Dianne Russell
      {
        creatorId: creatorUserIds['dianne_russell'],
        content: 'Coffee break between rehearsal sets ☕✨ #dance #lifestyle',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 242,
        comments: 31,
        shares: 30
      },
      // Jenny Wilson
      {
        creatorId: creatorUserIds['jenny_wilson'],
        content: 'Ranked grind recap — clutch plays only 🎮🔥 #gaming #clips',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-player-gaming-at-home-setup-41645-large.mp4', 'video', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'),
        likes: 312,
        comments: 44,
        shares: 78
      },
      {
        creatorId: creatorUserIds['jenny_wilson'],
        content: 'Subscriber-exclusive: my full pro settings & loadout breakdown 🎙️ #subscribersonly',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'audio', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80'),
        likes: 96,
        comments: 17,
        shares: 9
      },
      // Kristin Watson
      {
        creatorId: creatorUserIds['kristin_watson'],
        content: 'Full acoustic cover of a fan request — hope you love it 🎸❤️ #cover #music',
        postType: 'ppv',
        coinPrice: 30,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-singing-with-a-guitar-41924-large.mp4', 'video', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'),
        likes: 486,
        comments: 67,
        shares: 91
      },
      {
        creatorId: creatorUserIds['kristin_watson'],
        content: 'Songwriting session snippet 🎼 #behindthescenes #music',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 176,
        comments: 23,
        shares: 18
      },
      // Grace Kim
      {
        creatorId: creatorUserIds['grace_kim'],
        content: 'New single teaser — dropping Friday 🎵 #newmusic #sneakpeek',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'audio', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80'),
        likes: 528,
        comments: 74,
        shares: 132
      },
      {
        creatorId: creatorUserIds['grace_kim'],
        content: 'Full studio session — subscribers get the raw stems 🎧 #exclusive',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-song-in-the-studio-41595-large.mp4', 'video', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'),
        likes: 390,
        comments: 52,
        shares: 44
      },
      {
        creatorId: creatorUserIds['grace_kim'],
        content: 'Unlock the acoustic version of my latest track 🎸✨ #ppv #exclusive',
        postType: 'ppv',
        coinPrice: 45,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-playing-guitar-and-singing-40911-large.mp4', 'video', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80'),
        likes: 210,
        comments: 29,
        shares: 25
      },
      // Harper Quinn
      {
        creatorId: creatorUserIds['harper_quinn'],
        content: 'Golden hour shots from this week\'s shoot 🌇 #photography #goldenhour',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 344,
        comments: 41,
        shares: 55
      },
      {
        creatorId: creatorUserIds['harper_quinn'],
        content: 'Behind the lens: how I edit my signature look 📸 #tutorial #exclusive',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'audio', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80'),
        likes: 155,
        comments: 26,
        shares: 12
      },
      {
        creatorId: creatorUserIds['harper_quinn'],
        content: 'Full-resolution print collection — unlocked for PPV 🔒 #fineart',
        postType: 'ppv',
        coinPrice: 60,
        media: postMedia('https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 189,
        comments: 22,
        shares: 14
      },
      // Amelia Rose
      {
        creatorId: creatorUserIds['amelia_rose'],
        content: 'Morning view from the cliffs — travel diary day 3 🏔️✈️ #travel #adventure',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 467,
        comments: 58,
        shares: 121
      },
      {
        creatorId: creatorUserIds['amelia_rose'],
        content: 'Full vlog: 72 hours in the mountains 🎥 #vlog #travel',
        postType: 'ppv',
        coinPrice: 40,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-mountain-range-42002-large.mp4', 'video', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'),
        likes: 322,
        comments: 47,
        shares: 63
      },
      {
        creatorId: creatorUserIds['amelia_rose'],
        content: 'Subscriber Q&A about solo travel — your questions answered 🎙️',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'audio', 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=300&q=80'),
        likes: 128,
        comments: 31,
        shares: 10
      },
      // Evelyn Fox
      {
        creatorId: creatorUserIds['evelyn_fox'],
        content: 'Speedrunning my favorite level — new PB! ⏱️🎮 #speedrun #gaming',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-man-playing-video-games-32835-large.mp4', 'video', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80'),
        likes: 274,
        comments: 38,
        shares: 47
      },
      {
        creatorId: creatorUserIds['evelyn_fox'],
        content: 'Exclusive gameplay breakdown with commentary 🎙️ #exclusive #gaming',
        postType: 'ppv',
        coinPrice: 35,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-on-a-computer-32840-large.mp4', 'video', 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=800&q=80'),
        likes: 143,
        comments: 19,
        shares: 16
      },
      // Aria Chen
      {
        creatorId: creatorUserIds['aria_chen'],
        content: 'New watercolor piece — what should I paint next? 🎨 #art #process',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 208,
        comments: 53,
        shares: 27
      },
      {
        creatorId: creatorUserIds['aria_chen'],
        content: 'Subscriber sketchbook tour + commission slots open 🖌️ #subscribersonly',
        postType: 'subscription',
        coinPrice: 0,
        media: postMedia('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'audio', 'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?auto=format&fit=crop&w=300&q=80'),
        likes: 119,
        comments: 24,
        shares: 8
      },
      // Zara Cole
      {
        creatorId: creatorUserIds['zara_cole'],
        content: 'Choreography rehearsal — new routine coming 🔥💃 #dance #rehearsal',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-dark-room-40587-large.mp4', 'video', 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80'),
        likes: 356,
        comments: 48,
        shares: 84
      },
      {
        creatorId: creatorUserIds['zara_cole'],
        content: 'Unlock the full routine tutorial — step by step 💃✨ #ppv #dance',
        postType: 'ppv',
        coinPrice: 50,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-studio-40415-large.mp4', 'video', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'),
        likes: 198,
        comments: 25,
        shares: 33
      },
      // Jessica (Model)
      {
        creatorId: creatorUserIds['jessica'],
        content: 'Polaroid dump from today\'s editorial shoot 📷 #model #editorial',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 289,
        comments: 36,
        shares: 41
      },
      // Sophia (Lifestyle)
      {
        creatorId: creatorUserIds['sophia'],
        content: 'Cozy morning routine with a little ASMR 🎧☕ #lifestyle #asmr',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://images.unsplash.com/photo-1519821172144-4f87d85de2a1?auto=format&fit=crop&w=800&q=80', 'image'),
        likes: 231,
        comments: 29,
        shares: 36
      },
      // Ava (Travel)
      {
        creatorId: creatorUserIds['ava'],
        content: 'Drone footage from the coast — unreal colors 🌊🚁 #travel #drone',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-aerial-coastline-footage-41342-large.mp4', 'video', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'),
        likes: 401,
        comments: 45,
        shares: 96
      },
      // Angelina (Fitness)
      {
        creatorId: creatorUserIds['angelina'],
        content: 'Full body mobility flow — 15 minutes, anywhere 💪 #fitness #workout',
        postType: 'free',
        coinPrice: 0,
        media: postMedia('https://assets.mixkit.co/videos/preview/mixkit-woman-doing-yoga-exercises-at-home-40627-large.mp4', 'video', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'),
        likes: 265,
        comments: 33,
        shares: 58
      }
    ];

    const likeTargets = [johnn._id, molly._id, ...Object.values(creatorUserIds)];
    const commentTexts = [
      'Love this! 😍',
      'Absolutely stunning 🔥',
      'Can\'t wait for more!',
      'This made my day 💖',
      'Where was this taken?',
      'Great content as always!',
      'You look amazing!',
      'Keep it coming!'
    ];

    for (const p of posts) {
      const likesArr = [];
      for (let i = 0; i < p.likes; i++) {
        likesArr.push(i === 0 ? johnn._id : new mongoose.Types.ObjectId());
      }

      const commentsArr = [];
      for (let i = 0; i < p.comments; i++) {
        commentsArr.push({
          userId: likeTargets[i % likeTargets.length],
          text: commentTexts[i % commentTexts.length]
        });
      }

      await Post.create({
        creatorId: p.creatorId,
        content: p.content,
        postType: p.postType,
        coinPrice: p.coinPrice,
        media: p.media.map((m) => ({
          ...m,
          isLocked: p.postType === 'ppv' ? true : false
        })),
        likes: likesArr,
        comments: commentsArr,
        sharesCount: p.shares,
        isPublished: true
      });
    }

    console.log('Seeding stories...');

    const storyCreators = [molly._id, creatorUserIds['savannah_nguyen'], creatorUserIds['leslie_alexander'], creatorUserIds['jessica'], creatorUserIds['sophia'], creatorUserIds['ava'], creatorUserIds['angelina']];
    const storyMedia = [
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', type: 'image' }
    ];

    for (let i = 0; i < storyCreators.length; i++) {
      const creatorId = storyCreators[i];
      const mediaItem = storyMedia[i % storyMedia.length];
      await Story.create({
        creatorId,
        mediaUrl: mediaItem.url,
        mediaType: mediaItem.type,
        expiresAt: new Date(Date.now() + (i % 2 === 0 ? 24 : 12) * 60 * 60 * 1000),
        views: [johnn._id]
      });
    }

    console.log('Seeding subscriptions and transactions...');

    // Fan users so creators have real subscribers to manage
    const fanData = [
      { email: 'sarah@example.com', username: 'sarahj', displayName: 'Sarah Johnson' },
      { email: 'mike@example.com', username: 'miket', displayName: 'Michael Thompson' },
      { email: 'emma@example.com', username: 'emmad', displayName: 'Emma Davis' },
      { email: 'david@example.com', username: 'davew', displayName: 'David Wilson' },
      { email: 'olivia@example.com', username: 'oliviam', displayName: 'Olivia Martinez' },
      { email: 'james@example.com', username: 'jamesa', displayName: 'James Anderson' },
      { email: 'sophiabrown@example.com', username: 'sophiab', displayName: 'Sophia Brown' },
      { email: 'danielgarcia@example.com', username: 'dannyg', displayName: 'Daniel Garcia' },
      { email: 'emilychen@example.com', username: 'emilyc', displayName: 'Emily Chen' },
      { email: 'ryantaylor@example.com', username: 'ryant', displayName: 'Ryan Taylor' },
      { email: 'avamartinez@example.com', username: 'ava_m', displayName: 'Ava Martinez' },
      { email: 'liamwright@example.com', username: 'liam_w', displayName: 'Liam Wright' }
    ];

    const fans = [];
    for (const f of fanData) {
      const fan = await User.create({
        email: f.email,
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        username: f.username,
        displayName: f.displayName,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      });
      await Wallet.create({ userId: fan._id, balanceCoins: 500.00 });
      fans.push(fan);
    }

    console.log('Seeding live streams...');

    const liveNow = Date.now();
    const roomId = () => `live_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    // Build a viewers array up to `count` (real fan ids first, then placeholders)
    const buildViewers = (count) => {
      const ids = [];
      for (let i = 0; i < count; i++) {
        ids.push(i < fans.length ? fans[i]._id : new mongoose.Types.ObjectId());
      }
      return ids;
    };

    // Currently-live streams (one paid-entry stream so earnings exist)
    const liveStreamData = [
      { creatorId: molly._id, title: 'Morning workout live session 🏋️', category: 'Fitness', coverUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80', viewers: 862 },
      { creatorId: creatorUserIds['savannah_nguyen'], title: 'Q&A with Savannah 💬', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', viewers: 712, entryPriceCoins: 15, freeForSubscribers: true },
      { creatorId: creatorUserIds['leslie_alexander'], title: 'Fashion haul & chat 🛍️', category: 'Fashion', coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', viewers: 524, entryPriceCoins: 10 },
      { creatorId: creatorUserIds['jenny_wilson'], title: 'Late night gaming 🎮', category: 'Gaming', coverUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', viewers: 342 },
      { creatorId: creatorUserIds['kristin_watson'], title: 'Acoustic session 🎸', category: 'Music', coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', viewers: 432 },
      { creatorId: creatorUserIds['angelina'], title: 'Morning stretch & coffee ☕', category: 'Fitness', coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', viewers: 310 },
      { creatorId: creatorUserIds['ava'], title: 'Travel vlog live ✈️', category: 'Others', coverUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', viewers: 180 },
      { creatorId: creatorUserIds['sophia'], title: 'ASMR sleep sounds 🎧', category: 'ASMR', coverUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80', viewers: 260 }
    ];

    const seededLiveStreams = [];
    for (const s of liveStreamData) {
      const viewers = buildViewers(s.viewers);
      const stream = await LiveStream.create({
        creatorId: s.creatorId,
        streamTitle: s.title,
        category: s.category,
        language: 'English',
        coverUrl: s.coverUrl,
        isLive: true,
        entryPriceCoins: s.entryPriceCoins || 0,
        freeForSubscribers: !!s.freeForSubscribers,
        viewers,
        viewerCount: viewers.length,
        peakViewers: Math.round(viewers.length * 1.15),
        totalViews: Math.round(viewers.length * 2.3),
        roomId: roomId(),
        startedAt: new Date(liveNow - Math.floor(Math.random() * 3) * 60 * 60 * 1000)
      });
      seededLiveStreams.push(stream);
      await CreatorProfile.updateOne(
        { userId: s.creatorId },
        { $set: { isLive: true } }
      );
    }

    // Ended streams (recent history so creator analytics are populated)
    const endedStreamData = [
      { creatorId: molly._id, title: 'Workout Time 💪', category: 'Fitness', coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', daysAgo: 3, minutes: 62, views: 2400 },
      { creatorId: molly._id, title: 'Chill & Chat ✨', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80', daysAgo: 5, minutes: 50, views: 1800 },
      { creatorId: molly._id, title: 'Music Vibes 🎵', category: 'Music', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', daysAgo: 8, minutes: 75, views: 2100 },
      { creatorId: creatorUserIds['jenny_wilson'], title: 'Ranked grind 🎮', category: 'Gaming', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', daysAgo: 9, minutes: 120, views: 1500 }
    ];

    for (const s of endedStreamData) {
      const ended = new Date(liveNow - s.daysAgo * 24 * 60 * 60 * 1000);
      const started = new Date(ended.getTime() - s.minutes * 60 * 1000);
      await LiveStream.create({
        creatorId: s.creatorId,
        streamTitle: s.title,
        category: s.category,
        language: 'English',
        coverUrl: s.coverUrl,
        isLive: false,
        entryPriceCoins: 0,
        viewers: [],
        viewerCount: 0,
        peakViewers: Math.round(s.views * 0.4),
        totalViews: s.views,
        roomId: roomId(),
        startedAt: started,
        endedAt: ended
      });
    }

    // Scheduled (upcoming) streams
    const scheduledStreamData = [
      { creatorId: molly._id, title: 'Friday Night Show', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80', daysAhead: 1, entryPriceCoins: 5 },
      { creatorId: molly._id, title: 'Sunday Vibes', category: 'Music', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', daysAhead: 3, entryPriceCoins: 3, freeForSubscribers: true },
      { creatorId: creatorUserIds['savannah_nguyen'], title: 'Behind the scenes', category: 'Just Chatting', coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', daysAhead: 2, entryPriceCoins: 10 },
      { creatorId: creatorUserIds['leslie_alexander'], title: 'Fashion haul preview', category: 'Fashion', coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', daysAhead: 4, entryPriceCoins: 0 }
    ];

    for (const s of scheduledStreamData) {
      await LiveStream.create({
        creatorId: s.creatorId,
        streamTitle: s.title,
        category: s.category,
        language: 'English',
        coverUrl: s.coverUrl,
        isLive: false,
        scheduledAt: new Date(liveNow + s.daysAhead * 24 * 60 * 60 * 1000),
        entryPriceCoins: s.entryPriceCoins || 0,
        freeForSubscribers: !!s.freeForSubscribers,
        viewers: [],
        viewerCount: 0,
        roomId: roomId()
      });
    }

    // Johnn already paid to enter a paid live stream (Savannah's Q&A)
    const paidStream = seededLiveStreams.find((st) => st.entryPriceCoins > 0);
    if (paidStream) {
      await Transaction.create({
        senderId: johnn._id,
        receiverId: paidStream.creatorId,
        type: 'live_entry',
        status: 'completed',
        amountCoins: paidStream.entryPriceCoins,
        referenceId: paidStream._id,
        gateway: 'internal',
        createdAt: new Date(liveNow - 3600000),
        updatedAt: new Date(liveNow - 3600000)
      });
    }

    // Subscription factory: creates sub + linked transaction
    const createSubscription = async ({ user, creatorUserId, plan, status, startOffsetDays, expiryOffsetDays, priceCoins, createdAtOffsetDays }) => {
      const profile = await CreatorProfile.findOne({ userId: creatorUserId });
      const price = priceCoins !== undefined ? priceCoins : (profile ? (profile.rates.subscriptionMonthly || 0) : 15);
      const createdDate = new Date(Date.now() + (createdAtOffsetDays !== undefined ? createdAtOffsetDays : startOffsetDays) * 24 * 60 * 60 * 1000);

      const sub = await Subscription.create({
        userId: user._id,
        creatorId: creatorUserId,
        status,
        plan: plan || 'Premium',
        startDate: new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + expiryOffsetDays * 24 * 60 * 60 * 1000),
        priceCoins: price,
        createdAt: createdDate,
        updatedAt: createdDate
      });

      if (status === 'active' || status === 'expired' || status === 'cancelled') {
        await Transaction.create({
          senderId: user._id,
          receiverId: creatorUserId,
          type: 'subscription',
          status: 'completed',
          amountCoins: price,
          referenceId: sub._id,
          gateway: 'internal',
          createdAt: createdDate,
          updatedAt: createdDate
        });
      }

      return sub;
    };

    // Johnn subscribes to Molly (Premium, active) and Savannah (VIP, active)
    await createSubscription({
      user: johnn,
      creatorUserId: molly._id,
      plan: 'Premium',
      status: 'active',
      startOffsetDays: -15,
      expiryOffsetDays: 15,
      createdAtOffsetDays: -15
    });

    await createSubscription({
      user: johnn,
      creatorUserId: creatorUserIds['savannah_nguyen'],
      plan: 'VIP',
      status: 'active',
      startOffsetDays: -15,
      expiryOffsetDays: 15,
      createdAtOffsetDays: -15
    });

    // Johnn also has an expired + a cancelled subscription (history)
    await createSubscription({
      user: johnn,
      creatorUserId: creatorUserIds['leslie_alexander'],
      plan: 'Premium',
      status: 'expired',
      startOffsetDays: -50,
      expiryOffsetDays: -20,
      createdAtOffsetDays: -50
    });

    await createSubscription({
      user: johnn,
      creatorUserId: creatorUserIds['jenny_wilson'],
      plan: 'Basic',
      status: 'cancelled',
      startOffsetDays: -60,
      expiryOffsetDays: -30,
      createdAtOffsetDays: -60
    });

    // Fan subscriptions to Molly (so her Subscribers page is populated)
    const mollyFans = [
      { fanIdx: 0, plan: 'Premium', status: 'active', start: -10, expiry: 20, created: -10 },        // Sarah Johnson
      { fanIdx: 1, plan: 'VIP', status: 'active', start: -20, expiry: 10, created: -20 },            // Michael Thompson
      { fanIdx: 2, plan: 'Premium', status: 'active', start: -2, expiry: 28, created: -2 },          // Emma Davis
      { fanIdx: 3, plan: 'Premium', status: 'active', start: -26, expiry: 3, created: -26 },       // David Wilson
      { fanIdx: 4, plan: 'Basic', status: 'active', start: -12, expiry: 18, created: -12 },          // Olivia Martinez
      { fanIdx: 5, plan: 'VIP', status: 'active', start: -8, expiry: 22, created: -8 },              // James Anderson
      { fanIdx: 6, plan: 'Premium', status: 'cancelled', start: -60, expiry: -30, created: -60 },    // Sophia Brown
      { fanIdx: 7, plan: 'Basic', status: 'cancelled', start: -70, expiry: -40, created: -70 },      // Daniel Garcia
      { fanIdx: 8, plan: 'VIP', status: 'active', start: -27, expiry: 2, created: -27 },           // Emily Chen
      { fanIdx: 9, plan: 'Premium', status: 'active', start: -5, expiry: 25, created: -5 },          // Ryan Taylor
      { fanIdx: 10, plan: 'Premium', status: 'expired', start: -45, expiry: -15, created: -45 },     // Ava Martinez
      { fanIdx: 11, plan: 'Basic', status: 'expired', start: -55, expiry: -25, created: -55 }        // Liam Wright
    ];

    for (const f of mollyFans) {
      await createSubscription({
        user: fans[f.fanIdx],
        creatorUserId: molly._id,
        plan: f.plan,
        status: f.status,
        startOffsetDays: f.start,
        expiryOffsetDays: f.expiry,
        createdAtOffsetDays: f.created
      });
    }

    // A few fans subscribe to other creators for variety
    await createSubscription({
      user: fans[0],
      creatorUserId: creatorUserIds['savannah_nguyen'],
      plan: 'Premium',
      status: 'active',
      startOffsetDays: -18,
      expiryOffsetDays: 12,
      createdAtOffsetDays: -18
    });
    await createSubscription({
      user: fans[1],
      creatorUserId: creatorUserIds['grace_kim'],
      plan: 'VIP',
      status: 'active',
      startOffsetDays: -6,
      expiryOffsetDays: 24,
      createdAtOffsetDays: -6
    });
    await createSubscription({
      user: fans[2],
      creatorUserId: creatorUserIds['leslie_alexander'],
      plan: 'Basic',
      status: 'active',
      startOffsetDays: -22,
      expiryOffsetDays: 8,
      createdAtOffsetDays: -22
    });

    // Johnn sends tips to several creators
    const tipAmounts = [10, 20, 50, 15, 25];
    let tipIdx = 0;
    for (const cid of [molly._id, creatorUserIds['leslie_alexander'], creatorUserIds['jenny_wilson'], creatorUserIds['savannah_nguyen'], creatorUserIds['kristin_watson']]) {
      const amount = tipAmounts[tipIdx % tipAmounts.length];
      await Transaction.create({
        senderId: johnn._id,
        receiverId: cid,
        type: 'tip',
        status: 'completed',
        amountCoins: amount,
        gateway: 'internal'
      });
      tipIdx += 1;
    }

    // Johnn unlocked a couple of PPV posts (reference the newest Molly posts)
    const ppvPosts = await Post.find({ creatorId: molly._id, postType: 'ppv' }).limit(2);
    for (const post of ppvPosts) {
      await Transaction.create({
        senderId: johnn._id,
        receiverId: molly._id,
        type: 'ppv_unlock',
        status: 'completed',
        amountCoins: post.coinPrice,
        referenceId: post._id,
        gateway: 'internal'
      });
    }

    // Real coin package purchases (simulated gateway charges) for Johnn's wallet history
    const coinPurchases = [
      { coins: 500, priceUSD: 7.99, gateway: 'segpay', daysAgo: 30 },
      { coins: 1000, priceUSD: 14.99, gateway: 'ccbill', daysAgo: 18 },
      { coins: 250, priceUSD: 4.49, gateway: 'segpay', daysAgo: 9 }
    ];
    for (const purchase of coinPurchases) {
      await Transaction.create({
        senderId: null,
        receiverId: johnn._id,
        type: 'deposit',
        status: 'completed',
        amountCoins: purchase.coins,
        amountUSD: purchase.priceUSD,
        gateway: purchase.gateway,
        gatewayTxId: `${purchase.gateway}_SEED_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        metadata: {
          packageId: null,
          packageCoins: purchase.coins,
          packagePriceUSD: purchase.priceUSD,
          offerBonusCoins: 0,
          packBonusCoins: 0,
          totalBonusCoins: 0,
          cardLast4: '4242'
        },
        createdAt: new Date(Date.now() - purchase.daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - purchase.daysAgo * 24 * 60 * 60 * 1000)
      });
    }

    // Johnn follows a few creators
    const followIds = [molly._id, creatorUserIds['savannah_nguyen'], creatorUserIds['leslie_alexander']];
    johnn.following = followIds;
    await johnn.save({ validateBeforeSave: false });

    console.log('Seeding payment methods, tickets and FAQs...');

    // Johnn's saved payment methods
    await PaymentMethod.create([
      {
        userId: johnn._id,
        cardBrand: 'Visa',
        last4: '4242',
        holderName: 'Johnn Smith',
        expMonth: 8,
        expYear: 2028,
        billingAddress: '123 Main Street, New York, NY 10001',
        isDefault: true
      },
      {
        userId: johnn._id,
        cardBrand: 'Mastercard',
        last4: '5567',
        holderName: 'Johnn Smith',
        expMonth: 2,
        expYear: 2027,
        billingAddress: '123 Main Street, New York, NY 10001',
        isDefault: false
      }
    ]);

    // A couple of support tickets for Johnn's history
    await SupportTicket.create([
      {
        userId: johnn._id,
        subject: 'Coin purchase not credited',
        message: 'I purchased the 1000 coin package but the coins were not added to my wallet balance.',
        category: 'billing',
        status: 'in-progress'
      },
      {
        userId: johnn._id,
        subject: 'Video call audio issue',
        message: 'During my last video call the audio kept cutting out every few seconds.',
        category: 'technical',
        status: 'closed'
      }
    ]);

    // Referrals: Molly referred Johnn (so Johnn's "claim" is already real),
    // plus a few fan referrals so the admin referral overview has data.
    await Referral.create([
      { referrerId: molly._id, referredId: johnn._id, rewardGranted: true },
      { referrerId: creatorUserIds['savannah_nguyen'], referredId: fans[0]._id, rewardGranted: true },
      { referrerId: creatorUserIds['grace_kim'], referredId: fans[1]._id, rewardGranted: true }
    ]);

    // Johnn has already completed a 1:1 audio call with Molly (reward milestone).
    await CallLog.create({
      callerId: johnn._id,
      receiverId: molly._id,
      roomId: `room_seed_audio_${Date.now()}`,
      type: 'audio',
      status: 'completed',
      coinRatePerMinute: 5,
      totalMinutesBilling: 3,
      totalCoinsBilled: 15,
      endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });


    console.log('Seeding richer call logs + multi-month transactions...');

    // Richer call history so creator Audio/Video call stats pages are populated
    const callSeedData = [
      // Molly audio calls
      { callerIdx: 0, type: 'audio', status: 'completed', mins: 12, daysAgo: 1 },
      { callerIdx: 1, type: 'audio', status: 'completed', mins: 8, daysAgo: 2 },
      { callerIdx: 2, type: 'audio', status: 'completed', mins: 15, daysAgo: 3 },
      { callerIdx: 3, type: 'audio', status: 'missed', mins: 0, daysAgo: 3 },
      { callerIdx: 4, type: 'audio', status: 'completed', mins: 5, daysAgo: 5 },
      { callerIdx: 5, type: 'audio', status: 'completed', mins: 20, daysAgo: 7 },
      { callerIdx: 6, type: 'audio', status: 'rejected', mins: 0, daysAgo: 8 },
      { callerIdx: 7, type: 'audio', status: 'completed', mins: 10, daysAgo: 10 },
      // Molly video calls
      { callerIdx: 0, type: 'video', status: 'completed', mins: 25, daysAgo: 2 },
      { callerIdx: 1, type: 'video', status: 'completed', mins: 18, daysAgo: 4 },
      { callerIdx: 2, type: 'video', status: 'completed', mins: 30, daysAgo: 6 },
      { callerIdx: 3, type: 'video', status: 'missed', mins: 0, daysAgo: 9 },
      { callerIdx: 4, type: 'video', status: 'completed', mins: 12, daysAgo: 11 },
      { callerIdx: 5, type: 'video', status: 'completed', mins: 22, daysAgo: 13 }
    ];

    const mollyRates = await CreatorProfile.findOne({ userId: molly._id }).select('rates');
    for (const c of callSeedData) {
      const rate = c.type === 'audio' ? (mollyRates.rates.audioCallPerMin || 5) : (mollyRates.rates.videoCallPerMin || 10);
      const billed = c.mins * rate;
      const createdAt = new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000);
      const callLog = await CallLog.create({
        callerId: fans[c.callerIdx % fans.length]._id,
        receiverId: molly._id,
        roomId: `room_seed_${c.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
          receiverId: molly._id,
          type: 'call_billing',
          status: 'completed',
          amountCoins: billed,
          referenceId: callLog._id,
          metadata: { callType: c.type },
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Multi-month historical income so analytics/earnings charts look rich:
    // subscriptions, tips, PPV unlocks and live entries spread over ~5 months.
    const monthAgo = (months, dayOffset = 0) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      d.setDate(Math.max(1, Math.min(28, d.getDate() - dayOffset)));
      d.setHours(10 + (dayOffset % 8), (dayOffset * 7) % 60, 0, 0);
      return d;
    };

    // Monthly subscription renewals for Molly (from real fans, across 5 months)
    const subPlans = ['Basic', 'Premium', 'VIP'];
    const subPrices = { Basic: 10, Premium: 18, VIP: 30 };
    for (let m = 1; m <= 5; m++) {
      const count = 4 + (m % 3); // 4-6 renewals per month
      for (let i = 0; i < count; i++) {
        const fan = fans[(m * 3 + i) % fans.length];
        const plan = subPlans[(m + i) % 3];
        const price = subPrices[plan];
        const createdAt = monthAgo(m, i * 2);
        await Transaction.create({
          senderId: fan._id,
          receiverId: molly._id,
          type: 'subscription',
          status: 'completed',
          amountCoins: price,
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Historical tips to Molly across 5 months
    const tipValues = [5, 10, 15, 20, 25, 50];
    for (let m = 1; m <= 5; m++) {
      const count = 3 + (m % 2);
      for (let i = 0; i < count; i++) {
        const fan = fans[(m + i) % fans.length];
        const amount = tipValues[(m + i) % tipValues.length];
        const createdAt = monthAgo(m, i);
        await Transaction.create({
          senderId: fan._id,
          receiverId: molly._id,
          type: 'tip',
          status: 'completed',
          amountCoins: amount,
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Historical PPV unlocks for Molly's PPV posts across 5 months
    const ppvPostsAll = await Post.find({ creatorId: molly._id, postType: 'ppv' });
    for (let m = 1; m <= 5; m++) {
      const count = 3 + (m % 2);
      for (let i = 0; i < count; i++) {
        const post = ppvPostsAll[i % Math.max(1, ppvPostsAll.length)];
        const fan = fans[(m + i + 2) % fans.length];
        const createdAt = monthAgo(m, i + 1);
        await Transaction.create({
          senderId: fan._id,
          receiverId: molly._id,
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

    // Historical live entry fees for Molly's ended streams
    const mollyEndedStreams = await LiveStream.find({ creatorId: molly._id, endedAt: { $ne: null } });
    for (let m = 1; m <= 3; m++) {
      const count = 2 + (m % 2);
      for (let i = 0; i < count; i++) {
        const stream = mollyEndedStreams[i % Math.max(1, mollyEndedStreams.length)];
        const fan = fans[(m + i + 1) % fans.length];
        const createdAt = monthAgo(m, i * 3);
        await Transaction.create({
          senderId: fan._id,
          receiverId: molly._id,
          type: 'live_entry',
          status: 'completed',
          amountCoins: 5,
          referenceId: stream ? stream._id : null,
          gateway: 'internal',
          createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Help Centre FAQ content
    await Faq.create([
      {
        question: 'How do I buy Fantrio Coins?',
        answer: "You can purchase coins by clicking 'Buy Coins' in the sidebar. We support multiple packages with secure payments, plus bonus coin promotions and promo codes.",
        category: 'billing',
        order: 1,
        isActive: true
      },
      {
        question: 'What is the coin conversion rate?',
        answer: '100 Fantrio Coins are equivalent to approximately $1.00 USD. All prices on the platform are transparently displayed in coins and USD.',
        category: 'billing',
        order: 2,
        isActive: true
      },
      {
        question: 'How do I subscribe to a creator?',
        answer: "Visit any creator's profile page and click the 'Subscribe' button. Subscriptions are billed monthly using your Fantrio Coins.",
        category: 'general',
        order: 3,
        isActive: true
      },
      {
        question: 'How do 1:1 audio and video calls work?',
        answer: 'If a creator is online and has call availability enabled, you can request an audio or video call directly. Coins are deducted per minute based on the creator\'s set rate.',
        category: 'technical',
        order: 4,
        isActive: true
      },
      {
        question: 'Are my chat messages and calls private?',
        answer: 'Yes, all messages and calls on Fantrio are encrypted and completely secure to protect your privacy.',
        category: 'safety',
        order: 5,
        isActive: true
      },
      {
        question: 'How do I enable two-factor authentication?',
        answer: 'Go to Settings > Security and click "Enable 2FA". We will email you a one-time verification code to confirm your request.',
        category: 'account',
        order: 6,
        isActive: true
      },
      {
        question: 'How do I report a creator or content?',
        answer: 'You can report a creator or piece of content from the Safety & Reporting section under More. Our moderation team reviews every report.',
        category: 'safety',
        order: 7,
        isActive: true
      }
    ]);

    console.log('Seeding system settings...');

    await SystemSetting.create({
      commissionRate: 0.20,
      coinPackages: [
        { coins: 100, priceUSD: 1.99, oldPriceUSD: 2.99, image: '/1 stack.png', isPopular: false, isActive: true, sortOrder: 1 },
        { coins: 250, priceUSD: 4.49, oldPriceUSD: 5.99, image: '/2 stack.png', isPopular: true, isActive: true, sortOrder: 2 },
        { coins: 500, priceUSD: 7.99, oldPriceUSD: 9.99, image: '/3 stack.png', isPopular: false, isActive: true, sortOrder: 3 },
        { coins: 1000, priceUSD: 14.99, oldPriceUSD: 19.99, image: '/chest.png', isPopular: false, isActive: true, sortOrder: 4 },
        { coins: 1500, priceUSD: 19.99, oldPriceUSD: 24.99, image: '/Gift & Coins.png', isPopular: false, isActive: true, sortOrder: 5 },
        { coins: 2000, priceUSD: 24.99, oldPriceUSD: 34.99, image: '/Gift & Coins.png', isPopular: false, isActive: true, sortOrder: 6 },
        { coins: 3000, priceUSD: 34.99, oldPriceUSD: 49.99, image: '/Gift & Coins.png', isPopular: false, isActive: true, sortOrder: 7 },
        { coins: 5000, priceUSD: 49.99, oldPriceUSD: 69.99, image: '/Gift & Coins.png', isPopular: false, isActive: true, sortOrder: 8 }
      ],
      coinOffer: {
        bonusPercent: 20,
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      promoCodes: [
        {
          code: 'FANTRIO20',
          bonusCoins: 200,
          description: 'Get 200 bonus coins on your first purchase',
          maxRedemptions: 50,
          redemptionCount: 12,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          code: 'BONUS100',
          bonusCoins: 100,
          description: 'Welcome gift - 100 bonus coins',
          maxRedemptions: 100,
          redemptionCount: 34,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ]
    });

    console.log('Seeding direct messages...');

    // Real conversations: fans <-> creators with lastMessage, paywalls, and varied timestamps.
    // Each entry: [fanIdx, creatorUserId, [{side, text, hoursAgo, paywall?}]]
    const creatorIdsForChat = [
      molly._id,
      creatorUserIds['savannah_nguyen'],
      creatorUserIds['leslie_alexander'],
      creatorUserIds['jenny_wilson']
    ];
    const chatThreads = [
      { fanIdx: 0, creatorIdx: 0, msgs: [
        { side: 'fan', text: 'Hey Molly! Your last stream was incredible 🔥', hoursAgo: 50 },
        { side: 'creator', text: 'Thank you so much Sarah! Means a lot 🥰', hoursAgo: 49 },
        { side: 'fan', text: 'When is the next one? I have to be there!', hoursAgo: 3 },
        { side: 'creator', text: 'This weekend! Stay tuned 😉', hoursAgo: 2, isPaywall: true, coinPrice: 25 },
        { side: 'fan', text: 'Amazing, can\'t wait! 🙌', hoursAgo: 1 }
      ] },
      { fanIdx: 1, creatorIdx: 0, msgs: [
        { side: 'fan', text: 'Loved the workout video today 💪', hoursAgo: 30 },
        { side: 'creator', text: 'You\'re too kind Michael! 💕', hoursAgo: 29 }
      ] },
      { fanIdx: 2, creatorIdx: 0, msgs: [
        { side: 'fan', text: 'Just subscribed to your VIP plan! 🎉', hoursAgo: 100 },
        { side: 'creator', text: 'Welcome to the family Emma! 🩷', hoursAgo: 99 },
        { side: 'creator', text: 'Here\'s a special thank you photo 😘', hoursAgo: 20, isPaywall: true, coinPrice: 40 },
        { side: 'fan', text: 'Ooh, unlocking right now!', hoursAgo: 19 }
      ] },
      { fanIdx: 3, creatorIdx: 1, msgs: [
        { side: 'fan', text: 'Hi Savannah, big fan of your Q&A streams!', hoursAgo: 80 },
        { side: 'creator', text: 'Hey David! Thanks for the love 💜', hoursAgo: 79 },
        { side: 'fan', text: 'Any spoilers on the next topic?', hoursAgo: 6 },
        { side: 'creator', text: 'Maybe... you\'ll have to come find out 👀', hoursAgo: 5, isPaywall: true, coinPrice: 15 }
      ] },
      { fanIdx: 4, creatorIdx: 1, msgs: [
        { side: 'fan', text: 'Your fashion haul was everything 🛍️', hoursAgo: 24 }
      ] },
      { fanIdx: 5, creatorIdx: 2, msgs: [
        { side: 'fan', text: 'That gaming session was so fun to watch!', hoursAgo: 12 },
        { side: 'creator', text: 'Glad you enjoyed it James! 🎮', hoursAgo: 11 }
      ] },
      { fanIdx: 6, creatorIdx: 2, msgs: [
        { side: 'fan', text: 'Do you accept song requests?', hoursAgo: 70 },
        { side: 'creator', text: 'Of course! Send me your favourites 💿', hoursAgo: 69 },
        { side: 'fan', text: 'Here are my top 3!', hoursAgo: 68 },
        { side: 'creator', text: 'Loving this playlist already 🎶', hoursAgo: 67 }
      ] },
      { fanIdx: 7, creatorIdx: 3, msgs: [
        { side: 'fan', text: 'Late night streams are the best 🌙', hoursAgo: 15 },
        { side: 'creator', text: 'Right?! Night owls unite 🦉', hoursAgo: 14 }
      ] },
      { fanIdx: 8, creatorIdx: 3, msgs: [
        { side: 'fan', text: 'Just sent a tip! You deserve it ❤️', hoursAgo: 5 },
        { side: 'creator', text: 'You\'re amazing Emily, thank you! 🙏', hoursAgo: 4 },
        { side: 'creator', text: 'Exclusive Q&A recording just for you', hoursAgo: 3, isPaywall: true, coinPrice: 30 },
        { side: 'fan', text: 'Unlocked! Going to watch it now', hoursAgo: 2 }
      ] },
      { fanIdx: 9, creatorIdx: 0, msgs: [
        { side: 'fan', text: 'Hello! New here, love your content', hoursAgo: 200 },
        { side: 'creator', text: 'Welcome Ryan! Happy to have you 💫', hoursAgo: 199 }
      ] },
      // Johnn's conversations (the demo user) so his Messages panel is live.
      { isJohnn: true, creatorIdx: 0, msgs: [
        { side: 'fan', text: 'Hey Molly! Loved the workout stream this morning 💪', hoursAgo: 26 },
        { side: 'creator', text: 'Johnn! So glad you caught it 🥰', hoursAgo: 25 },
        { side: 'fan', text: 'Just unlocked your new video — unreal quality! 🔥', hoursAgo: 4 },
        { side: 'creator', text: 'You\'re the best! More coming this weekend 😉', hoursAgo: 3, unread: true }
      ] },
      { isJohnn: true, creatorIdx: 1, msgs: [
        { side: 'fan', text: 'Hi Savannah! Is the BTS video still dropping Friday?', hoursAgo: 40 },
        { side: 'creator', text: 'Hey Johnn! Yes — and VIP members get it a day early 💜', hoursAgo: 39 },
        { side: 'creator', text: 'Here\'s an early sneak peek just for you 👀', hoursAgo: 8, isPaywall: true, coinPrice: 20 },
        { side: 'fan', text: 'Just unlocked it, thank you! 🙌', hoursAgo: 7 }
      ] },
      { isJohnn: true, creatorIdx: 2, msgs: [
        { side: 'fan', text: 'Your fashion haul was so good last week 🛍️', hoursAgo: 90 },
        { side: 'creator', text: 'Thanks Johnn! New drop coming soon 👀', hoursAgo: 89 }
      ] },
      { isJohnn: true, creatorIdx: 3, msgs: [
        { side: 'fan', text: 'Do you stream on weekends?', hoursAgo: 12 },
        { side: 'creator', text: 'Friday nights! Hope to see you there 🎮', hoursAgo: 11 }
      ] }
    ];

    for (const thread of chatThreads) {
      const fan = thread.isJohnn ? johnn : fans[thread.fanIdx];
      const creatorId = creatorIdsForChat[thread.creatorIdx];
      for (const m of thread.msgs) {
        const createdAt = new Date(Date.now() - m.hoursAgo * 60 * 60 * 1000);
        const senderId = m.side === 'fan' ? fan._id : creatorId;
        const receiverId = m.side === 'fan' ? creatorId : fan._id;
        const isOpened = m.unread ? false : m.side === 'creator';
        const msg = await Message.create({
          senderId,
          receiverId,
          content: m.text,
          mediaType: 'none',
          isPaywall: !!m.isPaywall,
          coinPrice: m.isPaywall ? m.coinPrice : 0,
          isOpened,
          createdAt,
          updatedAt: createdAt
        });
        // Paywall messages are pre-unlocked by the fan when the thread says so
        if (m.isPaywall && m.unlocked) {
          msg.unlockedUsers.push(fan._id);
          await msg.save({ validateBeforeSave: false });
        }
      }
    }

    console.log('Reconciling creator subscriber counts...');

    // Reconcile subscriberCount with the actual number of active subscriptions
    const activeByCreator = await Subscription.aggregate([
      { $match: { status: 'active', expiryDate: { $gt: new Date() } } },
      { $group: { _id: '$creatorId', count: { $sum: 1 } } }
    ]);
    for (const row of activeByCreator) {
      await CreatorProfile.updateOne(
        { userId: row._id },
        { $set: { subscriberCount: row.count } }
      );
    }
    // Any creator with no active subs gets 0
    await CreatorProfile.updateMany(
      { userId: { $nin: activeByCreator.map((r) => r._id) } },
      { $set: { subscriberCount: 0 } }
    );

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
