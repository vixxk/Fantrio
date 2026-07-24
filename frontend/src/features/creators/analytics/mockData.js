// Mock data for Creator Analytics Page

export const statsCards = [
  {
    id: 'subscribers',
    label: 'Total Subscribers',
    value: '1,245',
    change: '+12%',
    changeType: 'positive',
    period: 'vs Apr 25 – May 25',
    icon: 'subscribers',
  },
  {
    id: 'views',
    label: 'Profile Views',
    value: '24.5K',
    change: '+18%',
    changeType: 'positive',
    period: 'vs Apr 25 – May 25',
    icon: 'views',
  },
  {
    id: 'ppv',
    label: 'PPV Sales',
    value: '356',
    change: '+9%',
    changeType: 'positive',
    period: 'vs Apr 25 – May 25',
    icon: 'ppv',
  },
  {
    id: 'tips',
    label: 'Tips Received',
    value: '$1,240',
    change: '+15%',
    changeType: 'positive',
    period: 'vs Apr 25 – May 25',
    icon: 'tips',
  },
  {
    id: 'engagement',
    label: 'Engagement Rate',
    value: '8.7%',
    change: '+6%',
    changeType: 'positive',
    period: 'vs Apr 25 – May 25',
    icon: 'engagement',
  },
];

export const subscriberGrowthData = {
  labels: ['May 1', 'May 6', 'May 11', 'May 16', 'May 21', 'May 26', 'May 31'],
  total: [450, 520, 680, 850, 1020, 1160, 1245],
  new: [30, 45, 55, 70, 85, 75, 85],
  tooltip: {
    date: 'May 31',
    total: '1,245 Total',
    new: '+85 New',
  },
};

export const earningsOverviewData = {
  labels: ['May 1', 'May 6', 'May 11', 'May 16', 'May 21', 'May 26', 'May 31'],
  total: [1200, 1500, 1800, 2100, 2300, 2400, 2450.70],
  net: [900, 1200, 1500, 1800, 2000, 2100, 2150.40],
  tooltip: {
    date: 'May 31',
    total: '$2,450.70 Total',
    net: '$2,150.40 Net',
  },
};

export const insights = [
  {
    id: 'growth',
    icon: 'growth',
    text: 'Your subscriber growth is',
    highlight: '12% higher',
    suffix: 'than last month.',
  },
  {
    id: 'views',
    icon: 'views',
    text: 'Profile views increased',
    highlight: '18%',
    suffix: 'compared to last month.',
  },
  {
    id: 'ppv',
    icon: 'ppv',
    text: 'PPV sales are up 9%',
    highlight: '',
    suffix: 'Keep creating exclusive content!',
  },
  {
    id: 'tips',
    icon: 'tips',
    text: 'Tips received increased',
    highlight: '15%',
    suffix: 'Keep engaging with your fans.',
  },
  {
    id: 'engagement',
    icon: 'engagement',
    text: 'Your engagement rate improved by',
    highlight: '6%',
    suffix: 'Great job connecting!',
  },
];

export const contentPerformance = [
  {
    id: 1,
    title: 'Good morning ☀️',
    date: 'May 31, 2024 · 9:00 AM',
    type: 'Post',
    status: 'OPEN',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    views: '1.2K',
    likes: 256,
    comments: 48,
    revenue: '$0.00',
    conversion: '-',
  },
  {
    id: 2,
    title: 'Behind the scenes 💋',
    date: 'May 30, 2024 · 10:00 AM',
    type: 'PPV',
    status: 'LOCKED',
    thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80',
    views: '866',
    likes: 124,
    comments: 32,
    revenue: '$520.00',
    conversion: '12.4%',
  },
  {
    id: 3,
    title: 'Workout time 💪',
    date: 'May 29, 2024 · 8:00 AM',
    type: 'Stream',
    status: 'OPEN',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    views: '2.4K',
    likes: 312,
    comments: 76,
    revenue: '$312.00',
    conversion: '18.2%',
  },
  {
    id: 4,
    title: 'Shower fun 🙈',
    date: 'May 28, 2024 · 10:00 PM',
    type: 'PPV',
    status: 'LOCKED',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
    views: '1.6K',
    likes: 198,
    comments: 45,
    revenue: '$380.00',
    conversion: '14.0%',
  },
  {
    id: 5,
    title: 'Late Night Chat',
    date: 'May 27, 2024 · 10:00 PM',
    type: 'Stream',
    status: 'OPEN',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    views: '1.1K',
    likes: 143,
    comments: 29,
    revenue: '$120.00',
    conversion: '10.9%',
  },
];

export const trafficSources = [
  { source: 'Fantrio App', views: '15.2K', percentage: 61, color: '#e10075' },
  { source: 'Direct', views: '5.1K', percentage: 21, color: '#7e00f3' },
  { source: 'Social Media', views: '3.4K', percentage: 14, color: '#00d4ff' },
  { source: 'Other', views: '800', percentage: 4, color: '#6b7280' },
];

export const contentTabs = ['All', 'Posts', 'Streams', 'PPV'];

export const creatorProfile = {
  name: 'Bella Rose',
  handle: '@bellarose_official',
  isVerified: true,
  isOnline: true,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
};
