// Mock data for Creator Video Calls Page

export const videoCallStats = [
  {
    id: 'totalCalls',
    label: 'Total Video Calls',
    value: '286',
    change: '+26%',
    changeType: 'positive',
    period: 'vs last week',
    icon: 'video',
    color: '#6366f1',
  },
  {
    id: 'totalMinutes',
    label: 'Total Minutes',
    value: '830',
    change: '+18%',
    changeType: 'positive',
    period: 'vs last week',
    icon: 'clock',
    color: '#8b5cf6',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    value: '$1,702.40',
    change: '+24%',
    changeType: 'positive',
    period: 'vs last week',
    icon: 'dollar',
    color: '#10b981',
  },
  {
    id: 'missedCalls',
    label: 'Missed Calls',
    value: '18',
    change: '+22%',
    changeType: 'negative',
    period: 'vs last week',
    icon: 'phoneMissed',
    color: '#ef4444',
  },
  {
    id: 'pendingRequests',
    label: 'Pending Requests',
    value: '12',
    change: '',
    changeType: '',
    period: '',
    icon: 'users',
    color: '#f59e0b',
    showLink: true,
    linkText: 'View requests',
  },
];

export const todayEarnings = {
  amount: '$412.80',
  change: '+26%',
  changeLabel: 'vs yesterday',
  totalMinutes: 830,
  completedCalls: 28,
  missedCalls: 18,
  estimatedPayout: '$412.80',
};

export const performanceData = {
  totalMinutes: 830,
  completed: { minutes: 650, percentage: 78, color: '#3b82f6' },
  missed: { minutes: 90, percentage: 11, color: '#f43f5e' },
  pending: { minutes: 90, percentage: 11, color: '#eab308' },
};

export const dailyMinutes = {
  period: 'This Week',
  days: [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 90 },
    { label: 'Wed', value: 140 },
    { label: 'Thu', value: 110 },
    { label: 'Fri', value: 160 },
    { label: 'Sat', value: 130 },
    { label: 'Sun', value: 80 },
  ],
  maxY: 180,
};

export const recentCalls = [
  {
    id: 1,
    fan: {
      name: 'Michael_23',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n10:24 PM',
    duration: '18:32',
    earned: '$36.64',
    status: 'Completed',
  },
  {
    id: 2,
    fan: {
      name: 'ChrisFit',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n9:41 PM',
    duration: '12:07',
    earned: '$24.14',
    status: 'Completed',
  },
  {
    id: 3,
    fan: {
      name: 'Alex_World',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n8:58 PM',
    duration: '07:45',
    earned: '$15.50',
    status: 'Completed',
  },
  {
    id: 4,
    fan: {
      name: 'DannyBoy',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n8:12 PM',
    duration: '22:18',
    earned: '$44.36',
    status: 'Completed',
  },
  {
    id: 5,
    fan: {
      name: 'Jake_88',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n6:55 PM',
    duration: '05:10',
    earned: '$10.20',
    status: 'Missed',
  },
  {
    id: 6,
    fan: {
      name: 'NickVibes',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n6:55 PM',
    duration: '15:31',
    earned: '$31.02',
    status: 'Completed',
  },
  {
    id: 7,
    fan: {
      name: 'FitLover',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n5:40 PM',
    duration: '10:05',
    earned: '$20.10',
    status: 'Completed',
  },
  {
    id: 8,
    fan: {
      name: 'StarGazer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n4:15 PM',
    duration: '08:22',
    earned: '$16.44',
    status: 'Completed',
  },
  {
    id: 9,
    fan: {
      name: 'MusicLover22',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      isVerified: false,
    },
    dateTime: 'May 26, 2024\n3:30 PM',
    duration: '12:45',
    earned: '$25.90',
    status: 'Completed',
  },
  {
    id: 10,
    fan: {
      name: 'TechGuy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      isVerified: true,
    },
    dateTime: 'May 26, 2024\n2:55 PM',
    duration: '06:18',
    earned: '$12.36',
    status: 'Missed',
  },
];

export const tips = [
  'Go live during peak hours (6PM - 12AM)',
  'Keep your camera quality high',
  'Offer engaging conversations',
  'Promote your video call availability',
];

export const callTabs = ['All', 'Completed', 'Missed', 'Pending'];
