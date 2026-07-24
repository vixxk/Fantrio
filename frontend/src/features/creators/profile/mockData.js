// Mock data for Creator Public Profile Page

export const creatorProfile = {
  name: 'Bella Rose',
  handle: '@bellarose_official',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  isVerified: true,
  isOnline: true,
  role: 'Creator',
  bio: 'Welcome to my world 💕\nHere for good vibes, real talk, and unforgettable moments. Let\'s make it special.',
  location: 'Los Angeles, CA',
  languages: 'English',
  memberSince: 'Jan 2024',
  responseTime: 'Within a few hours',
};

export const profileStats = [
  { label: 'Subscribers', value: '12.5K', icon: 'subscribers' },
  { label: 'Followers', value: '48.7K', icon: 'followers' },
  { label: 'Profile Views', value: '24.5K', icon: 'views' },
  { label: 'Tips Received', value: '$12.4K', icon: 'tips' },
  { label: 'Content', value: '356', icon: 'content' },
];

export const actionButtons = [
  { label: 'Subscribe', sublabel: '$14.99 / month', icon: 'star', variant: 'primary' },
  { label: 'Message', sublabel: '', icon: 'message', variant: 'secondary' },
  { label: 'Audio Call', sublabel: '$0.50 / min', icon: 'phone', variant: 'outline' },
  { label: 'Video Call', sublabel: '$2.00 / min', icon: 'video', variant: 'outline' },
  { label: 'Send Tip', sublabel: '', icon: 'gift', variant: 'outline' },
];

export const subscriptionPlans = {
  title: 'Subscription Plans',
  subtitle: 'Choose the perfect plan to unlock exclusive content and connect with me.',
  plans: [
    {
      name: 'Monthly Plan',
      price: '$14.99',
      period: '/ month',
      features: [
        'Exclusive posts & videos',
        'Member-only stories',
        'Priority messages',
        'Cancel anytime',
      ],
    },
  ],
};

export const callRates = {
  title: 'Call Rates',
  subtitle: '1:1 private calls with me',
  rates: [
    {
      type: 'Audio Call',
      rate: '$0.50',
      unit: '/ min',
      description: 'Talk one-on-one with me',
      color: '#3b82f6',
    },
    {
      type: 'Video Call',
      rate: '$2.00',
      unit: '/ min',
      description: 'Face-to-face connection',
      color: '#8b5cf6',
    },
  ],
};

export const profileInsights = {
  title: 'Profile Insights',
  period: 'This Month',
  stats: [
    { label: 'Profile Views', value: '24.5K', change: '+18%', changeType: 'positive' },
    { label: 'New Subscribers', value: '1,245', change: '+12%', changeType: 'positive' },
    { label: 'Tips Received', value: '$1,240', change: '+15%', changeType: 'positive' },
  ],
};

export const fanSpotlight = {
  title: 'Fan Spotlight',
  fan: {
    name: 'Michael_23',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    isVerified: true,
    label: 'Top Fan',
    spent: '$512 this month',
    message: 'Thank you for being so amazing! 💕',
  },
};

export const recentContent = {
  title: 'Recent Content',
  tabs: ['All', 'Photos', 'Videos', 'Stories'],
  items: [
    {
      id: 1,
      title: 'Good morning sunshine ☀️',
      timestamp: '2 hours ago',
      thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      badge: 'NEW',
      badgeColor: '#10b981',
      stats: { comments: 12, likes: 256 },
    },
    {
      id: 2,
      title: 'Workout time 💪',
      timestamp: '1 day ago',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      badge: 'VIDEO',
      badgeColor: '#8b5cf6',
      stats: { duration: '01:24', views: '1.2K' },
    },
    {
      id: 3,
      title: 'Late night thoughts 🌙',
      timestamp: '2 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      badge: 'STORY',
      badgeColor: '#e10075',
      stats: { comments: 8, likes: 194 },
    },
    {
      id: 4,
      title: 'Beach day perfection 🏖️',
      timestamp: '3 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      badge: 'NEW',
      badgeColor: '#10b981',
      stats: { comments: 15, likes: 312 },
    },
    {
      id: 5,
      title: 'Behind the scenes 🎬',
      timestamp: '5 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      badge: 'VIDEO',
      badgeColor: '#8b5cf6',
      stats: { duration: '02:15', views: '986' },
    },
  ],
};

export const subscribeSave = {
  title: 'Subscribe & Save',
  subtitle: 'Subscribe for exclusive content, special offers, and more!',
  price: '$14.99 / month',
};
