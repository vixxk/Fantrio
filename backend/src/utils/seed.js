const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const Post = require('../models/Post');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

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

    console.log('Data cleared. Seeding users...');

    // Default password (will be hashed once by User pre-save hook)
    const hashedPassword = 'password123';

    // 1. Create Logged-In User (Johnn)
    const johnn = await User.create({
      email: 'johnn@example.com',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      username: 'johnn',
      displayName: 'Johnn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
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
      bio: 'Digital creator & fitness enthusiast. Daily post-workout updates and exclusive content!',
      categories: ['Fitness', 'Lifestyle'],
      isVerifiedBadge: true,
      verificationStatus: 'approved',
      rates: {
        subscriptionMonthly: 9.99,
        audioCallPerMin: 5,
        videoCallPerMin: 10
      },
      followerCount: 15430,
      subscriberCount: 342
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
        subscriberCount: 420
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
        subscriberCount: 810
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
        subscriberCount: 310
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
        subscriberCount: 1540
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
        subscriberCount: 180
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
        rates: {
          subscriptionMonthly: 4.99,
          audioCallPerMin: 3,
          videoCallPerMin: 6
        },
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
    }

    console.log('Seeding posts...');

    // Molly Jane's Post 1: Image PPV post
    const post1 = await Post.create({
      creatorId: molly._id,
      content: 'My Standard Post-workout Meal',
      postType: 'ppv',
      coinPrice: 20,
      media: [
        {
          url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
          type: 'image',
          thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
          isLocked: true
        }
      ],
      likes: [],
      comments: Array.from({ length: 48 }).map((_, idx) => ({
        userId: johnn._id,
        text: `Looks delicious, Molly! (Comment ${idx + 1})`
      })),
      sharesCount: 48,
      isPublished: true
    });

    // Add 156 likes (simulated by adding Johnn and generating mock ObjectIds)
    post1.likes.push(johnn._id);
    for (let i = 0; i < 155; i++) {
      post1.likes.push(new mongoose.Types.ObjectId());
    }
    await post1.save();

    // Molly Jane's Post 2: Video PPV post
    const post2 = await Post.create({
      creatorId: molly._id,
      content: 'My Standard Post-workout Meal',
      postType: 'ppv',
      coinPrice: 20,
      media: [
        {
          url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-sportswear-doing-exercises-at-home-40893-large.mp4',
          type: 'video',
          thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
          isLocked: true
        }
      ],
      likes: [],
      comments: Array.from({ length: 48 }).map((_, idx) => ({
        userId: johnn._id,
        text: `Great workout video! (Comment ${idx + 1})`
      })),
      sharesCount: 48,
      isPublished: true
    });

    post2.likes.push(johnn._id);
    for (let i = 0; i < 155; i++) {
      post2.likes.push(new mongoose.Types.ObjectId());
    }
    await post2.save();

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
