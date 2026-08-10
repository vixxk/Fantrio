const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const Wallet = require('../models/Wallet');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantrio';

const EMAIL = 'creator@gmail.com';
const PASSWORD = 'password123';

const seedCreator = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Connected!');

    const userUpdate = {
      role: 'creator',
      isVerified: true,
      displayName: 'Creator',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      bio: 'Digital creator on Fantrio. Exclusive content and great conversations!'
    };

    let user = await User.findOne({ email: EMAIL });

    if (user) {
      console.log(`User ${EMAIL} already exists. Updating fields...`);
      await User.updateOne({ _id: user._id }, { $set: userUpdate });
    } else {
      user = await User.create({
        email: EMAIL,
        password: PASSWORD,
        username: 'creator',
        notificationPreferences: {
          newMessages: true,
          newSubscribers: true,
          tipsAndPayments: true,
          liveStreamReminders: true,
          productPurchases: true,
          announcements: true
        },
        ...userUpdate
      });
      console.log(`User ${EMAIL} created.`);
    }

    const profileData = {
      userId: user._id,
      username: 'creator',
      displayName: 'Creator',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      coverBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      bio: 'Digital creator on Fantrio. Exclusive content and great conversations!',
      categories: ['Lifestyle', 'Entertainment'],
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
      followerCount: 12400,
      subscriberCount: 380,
      isOnline: true,
      isLive: false,
      audioAvailable: true,
      videoAvailable: true,
      country: 'United States',
      language: 'English',
      contentType: ['Photos', 'Videos']
    };

    let profile = await CreatorProfile.findOne({ userId: user._id });

    if (profile) {
      console.log('CreatorProfile already exists. Updating fields...');
      await CreatorProfile.updateOne({ userId: user._id }, { $set: profileData });
    } else {
      await CreatorProfile.create(profileData);
      console.log('CreatorProfile created.');
    }

    const wallet = await Wallet.findOne({ userId: user._id });

    if (wallet) {
      console.log('Wallet already exists. Setting balance...');
      await Wallet.updateOne({ userId: user._id }, { $set: { balanceCoins: 500.0 } });
    } else {
      await Wallet.create({ userId: user._id, balanceCoins: 500.0 });
      console.log('Wallet created.');
    }

    console.log('Creator seeded successfully!');
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
  } catch (error) {
    console.error('Error seeding creator:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedCreator();
