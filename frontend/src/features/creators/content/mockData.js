export const contentTabs = ['All Content', 'Open Content', 'Locked Content', 'Stories'];

export const contentTypes = ['All Types', 'Image', 'Video', 'Story'];
export const sortOptions = ['Newest First', 'Oldest First', 'Most Viewed', 'Most Liked'];

export const contentOverview = {
  period: 'This Month',
  periodOptions: ['This Month', 'Last Month', 'This Year', 'All Time'],
  stats: [
    { label: 'Total Posts', value: '128', change: '18%', changeType: 'positive' },
    { label: 'Open Posts', value: '78', change: '14%', changeType: 'positive' },
    { label: 'Locked Posts', value: '50', change: '22%', changeType: 'positive' },
    { label: 'Stories', value: '36', change: '16%', changeType: 'positive' },
  ],
};

export const contentBreakdown = {
  total: 128,
  categories: [
    { label: 'Images', percentage: 52, count: 66, color: '#e10075' },
    { label: 'Videos', percentage: 38, count: 49, color: '#9b51e0' },
    { label: 'Stories', percentage: 10, count: 13, color: '#3b82f6' },
  ],
};

export const topPerformingContent = [
  {
    id: 1,
    title: 'Workout time 💪',
    type: 'Video',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=100&q=80',
    views: '2.4K',
    likes: 312,
  },
  {
    id: 2,
    title: 'Good morning 🌞',
    type: 'Image',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    views: '1.2K',
    likes: 256,
  },
  {
    id: 3,
    title: 'Shower fun 😏',
    type: 'Video',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=100&q=80',
    views: '1.6K',
    likes: 198,
  },
];

export const recentContent = [
  {
    id: 1,
    title: 'Good morning 🌞',
    type: 'Image',
    status: 'Open',
    date: 'May 31, 2024\n8:15 AM',
    views: '1.2K',
    likes: 256,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 2,
    title: 'Behind the scenes 🎬',
    type: 'Video',
    duration: '00:45',
    status: 'Locked',
    date: 'May 30, 2024\n10:30 PM',
    views: '866',
    likes: 124,
    price: '$5.00',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 3,
    title: 'Workout time 💪',
    type: 'Video',
    duration: '00:32',
    status: 'Open',
    date: 'May 30, 2024\n6:45 PM',
    views: '2.4K',
    likes: 312,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 4,
    title: 'Shower fun 😏',
    type: 'Video',
    duration: '00:38',
    status: 'Locked',
    date: 'May 29, 2024\n9:10 PM',
    views: '1.6K',
    likes: 198,
    price: '$8.00',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 5,
    title: 'Late night vibes 🌙',
    type: 'Image',
    status: 'Open',
    date: 'May 28, 2024\n11:20 PM',
    views: '1.1K',
    likes: 210,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 6,
    title: 'Pool day ☀️',
    type: 'Image',
    status: 'Locked',
    date: 'May 28, 2024\n3:40 PM',
    views: '754',
    likes: 101,
    price: '$6.00',
    thumbnail: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 7,
    title: 'New outfit check ✨',
    type: 'Image',
    status: 'Open',
    date: 'May 27, 2024\n7:05 PM',
    views: '933',
    likes: 172,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 8,
    title: 'Weekend mood 😎',
    type: 'Video',
    duration: '00:29',
    status: 'Locked',
    date: 'May 27, 2024\n12:15 PM',
    views: '612',
    likes: 88,
    price: '$4.00',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  },
];

export const pagination = {
  currentPage: 1,
  totalPages: 15,
};
