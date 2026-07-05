const Announcement = require('../models/Announcement');
const FeatureRequest = require('../models/FeatureRequest');
const User = require('../models/User');

const seedMoreData = async () => {
  try {
    // 1. Seed Announcements if empty
    const announcementCount = await Announcement.countDocuments();
    if (announcementCount === 0) {
      console.log('Seeding initial announcements...');
      await Announcement.create([
        {
          title: 'Welcome to Fantrio Beta!',
          content: 'We are thrilled to launch the beta version of Fantrio. Explore discover feeds, subscribe to your favorite creators, and initiate 1:1 audio and video calls!',
          category: 'news'
        },
        {
          title: 'HD Video Calling Server Upgrade',
          content: 'We have updated our video calling server infrastructure to support 1080p HD quality. Video call rates remain determined by the creators.',
          category: 'update'
        },
        {
          title: 'New Coin Pack Promotions!',
          content: 'Get up to 20% bonus coins when purchasing packages of 1,000 coins or more. Bonus coins are credited instantly to your wallet.',
          category: 'news'
        }
      ]);
      console.log('Announcements seeded.');
    }

    // 2. Seed Feature Requests if empty
    const featureCount = await FeatureRequest.countDocuments();
    if (featureCount === 0) {
      console.log('Seeding initial feature requests...');
      const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
      if (adminUser) {
        await FeatureRequest.create([
          {
            userId: adminUser._id,
            title: 'Add Dark Theme toggle in mobile quick menu',
            description: 'It would be great to have the theme switcher directly on the mobile navigation bar or sidebar drawer for easier access.',
            votes: [adminUser._id],
            status: 'suggestion'
          },
          {
            userId: adminUser._id,
            title: 'Support GIF comments in Discover Feed',
            description: 'Allowing users to reply with funny GIFs in the post comments section would improve engagement and conversational dynamics.',
            votes: [adminUser._id],
            status: 'under-review'
          },
          {
            userId: adminUser._id,
            title: 'Direct tipping on private messages',
            description: 'Provide an easy way to tip creators directly while chatting with them, without needing to go to their profile page or a post.',
            votes: [adminUser._id],
            status: 'planned'
          }
        ]);
        console.log('Feature requests seeded.');
      }
    }
  } catch (err) {
    console.error('Error seeding more-page data:', err);
  }
};

module.exports = seedMoreData;
