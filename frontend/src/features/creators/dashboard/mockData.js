export const quickActions = [
  {
    id: 'audio',
    type: 'audio',
    icon: 'Phone',
    title: 'Audio Calls',
    rate: '$0.50',
    rateUnit: '/ min',
    isOnline: true,
    goLiveBtnLabel: 'Go Live Now',
    editRateLabel: 'Edit Rate',
    color: '#3b82f6',
  },
  {
    id: 'video',
    type: 'video',
    icon: 'Video',
    title: 'Video Calls',
    rate: '$2.00',
    rateUnit: '/ min',
    isOnline: true,
    goLiveBtnLabel: 'Go Live Now',
    editRateLabel: 'Edit Rate',
    color: '#10b981',
  },
  {
    id: 'messages',
    type: 'messages',
    icon: 'MessageCircle',
    title: 'Reply to Messages',
    badge: 24,
    description: 'Respond to your fans and keep them happy',
    actionLabel: 'Open Messages',
    color: '#9b51e0',
  },
];

export const streamOptions = {
  defaultTitle: 'e.g. Friday Night Show',
  defaultPrice: '5.00',
  currency: 'USD',
  freeForSubscribersLabel: 'Make stream free for subscribers',
  freeForSubscribersDesc: 'Subscribers can join for free',
  goLiveLabel: 'Go Live Now',
  scheduleLabel: 'Schedule Stream',
  startGoLiveLabel: 'Go Live Now',
  startGoLiveDesc: 'Start instantly',
  scheduleForLaterLabel: 'Schedule For Later',
  scheduleForLaterDesc: 'Pick date and time',
  mainGoLiveLabel: 'Go Live Now',
};

export const createContentCards = [
  {
    id: 'locked',
    icon: 'Lock',
    title: 'Create Locked Content',
    description: 'Lock your content and set a price to unlock',
    buttons: [
      { label: 'Image', variant: 'outlined' },
      { label: 'Video', variant: 'outlined' },
    ],
    color: '#e10075',
  },
  {
    id: 'open',
    icon: 'Globe',
    title: 'Post Open Content',
    description: 'Share content for free with all your fans',
    buttons: [
      { label: 'Image', variant: 'outlined' },
      { label: 'Video', variant: 'outlined' },
    ],
    color: '#3b82f6',
  },
  {
    id: 'stories',
    icon: 'CircleDot',
    title: 'Create Stories',
    description: 'Share moments that disappear in 24 hours',
    buttons: [
      { label: 'Create Story', variant: 'outlined' },
    ],
    color: '#9b51e0',
  },
  {
    id: 'mycontent',
    icon: 'FolderOpen',
    title: 'My Content',
    description: 'Manage all your content in one place',
    buttons: [
      { label: 'View All Content', variant: 'outlined' },
    ],
    color: '#3b82f6',
  },
];

export const recentContentTabs = ['All', 'Open', 'Locked', 'Stories'];

export const recentContent = [
  {
    id: 1,
    title: 'Good morning 🌞',
    type: 'Image',
    timeAgo: '2 hours ago',
    status: 'Open',
    views: '1.2K',
    likes: 256,
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 2,
    title: 'Behind the scenes 🎬',
    type: 'Video',
    timeAgo: '1 day ago',
    status: 'Locked',
    price: '$5.00',
    views: '866',
    likes: 124,
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 3,
    title: 'Workout time 💪',
    type: 'Video',
    timeAgo: '2 days ago',
    status: 'Open',
    views: '2.4K',
    likes: 312,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 4,
    title: 'Shower fun 😏',
    type: 'Video',
    timeAgo: '3 days ago',
    status: 'Locked',
    price: '$8.00',
    views: '1.6K',
    likes: 198,
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=100&q=80',
  },
];

export const earningsOverview = {
  period: 'This Month',
  totalEarnings: '$2,450.70',
  pending: '$560.30',
  paidOut: '$12,540.80',
  totalCallsMinutes: '1,250',
};

export const upcomingStreams = [
  {
    id: 1,
    title: 'Friday Night Show',
    date: 'May 26, 2024 • 9:00 PM',
    price: '$5.00',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 2,
    title: 'Sunday Vibes',
    date: 'May 30, 2024 • 8:00 PM',
    price: '$3.00',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 3,
    title: 'Late Night Chat',
    date: 'May 28, 2024 • 10:00 PM',
    price: 'Free',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=100&q=80',
  },
];

export const quickStats = {
  period: 'This Month',
  stats: [
    { label: 'Subscribers', value: '1,245', change: '12%', changeType: 'positive' },
    { label: 'Profile Views', value: '24.5K', change: '18%', changeType: 'positive' },
    { label: 'PPV Sales', value: '356', change: '9%', changeType: 'positive' },
    { label: 'Tips Received', value: '$1,240', change: '15%', changeType: 'positive' },
  ],
};
