export const streamTabs = [
  { id: 'goLive', label: 'Go Live Now' },
  { id: 'schedule', label: 'Schedule Stream' },
];

export const streamStats = [
  {
    label: 'Total Streams',
    value: '12',
    change: '20%',
    changeType: 'positive',
  },
  {
    label: 'Total Views',
    value: '24.5K',
    change: '18%',
    changeType: 'positive',
  },
  {
    label: 'Total Earnings',
    value: '$2,450.70',
    change: '',
    changeType: 'positive',
  },
  {
    label: 'Avg. Duration',
    value: '48m 32s',
    change: '8%',
    changeType: 'positive',
  },
];

export const upcomingStreams = [
  {
    id: 1,
    title: 'Friday Night Show',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
    date: 'May 26, 2024 · 9:00 PM',
    category: 'Just Chatting',
    categoryColor: '#e10075',
    entryPrice: '$5.00',
    status: 'Scheduled',
  },
  {
    id: 2,
    title: 'Sunday Vibes',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop',
    date: 'May 30, 2024 · 8:00 PM',
    category: 'Music',
    categoryColor: '#3b82f6',
    entryPrice: '$3.00',
    status: 'Scheduled',
  },
  {
    id: 3,
    title: 'Late Night Chat',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100&h=100&fit=crop',
    date: 'May 28, 2024 · 10:00 PM',
    category: 'Just Chatting',
    categoryColor: '#e10075',
    entryPrice: 'Free',
    status: 'Scheduled',
  },
];

export const recentStreams = [
  {
    id: 1,
    title: 'Workout Time 💪',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop',
    category: 'Workout & Fitness',
    categoryColor: '#10b981',
    date: 'May 24, 2024',
    duration: '1h 02m',
    views: '2.4K',
    earnings: '$240.80',
  },
  {
    id: 2,
    title: 'Chill & Chat ✨',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
    category: 'Just Chatting',
    categoryColor: '#e10075',
    date: 'May 23, 2024',
    duration: '50m',
    views: '1.8K',
    earnings: '$180.30',
  },
  {
    id: 3,
    title: 'Music Vibes 🎵',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop',
    category: 'Music',
    categoryColor: '#3b82f6',
    date: 'May 21, 2024',
    duration: '1h 15m',
    views: '2.1K',
    earnings: '$210.60',
  },
];

export const streamCategories = [
  { label: 'Just Chatting', count: 6, percentage: 50, color: '#e10075' },
  { label: 'Music', count: 3, percentage: 25, color: '#3b82f6' },
  { label: 'Workout & Fitness', count: 2, percentage: 17, color: '#10b981' },
  { label: 'Other', count: 1, percentage: 8, color: '#6b7280' },
];

export const topStreamers = [
  { id: 1, title: 'Workout Time 💪', category: 'Workout & Fitness', earnings: '$240.80' },
  { id: 2, title: 'Music Vibes 🎵', category: 'Music', earnings: '$210.60' },
  { id: 3, title: 'Chill & Chat ✨', category: 'Just Chatting', earnings: '$180.30' },
];

export const quickStats = [
  { label: 'Total Views', value: '24.5K', change: '18%', changeType: 'positive' },
  { label: 'Total Watch Time', value: '585h', change: '12%', changeType: 'positive' },
  { label: 'New Followers', value: '356', change: '15%', changeType: 'positive' },
];

export const streamOptions = {
  defaultTitle: 'e.g. Friday Night Show',
  defaultPrice: '5.00',
  currency: 'USD',
  freeForSubscribersLabel: 'Make stream free for subscribers',
  freeForSubscribersDesc: 'Subscribers can join for free',
  startGoLiveLabel: 'Go Live Now',
  startGoLiveDesc: 'Start instantly',
  scheduleForLaterLabel: 'Schedule For Later',
  scheduleForLaterDesc: 'Pick date and time',
};
