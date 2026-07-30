// Settings page mock data

export const profileData = {
  displayName: 'Bella Rose',
  username: 'bellarose_official',
  email: 'bella.rose@fantrio.com',
  bio: 'Fitness lover 💪 | Lifestyle creator ✨ | Connecting with my amazing fans ❤️',
  bioLength: 68,
  bioMaxLength: 150,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  verified: true,
  creatorSince: 'May 2023',
};

export const accountStatus = {
  status: 'Active',
  memberSince: 'May 15, 2023',
  accountType: 'Creator',
};

export const verificationProgress = {
  verified: true,
  emailVerified: true,
  idVerified: true,
  profileVerified: true,
};

export const securityScore = {
  score: 90,
  strength: 'Strong',
  description: 'Your account is well protected.',
  passwordStrength: 'Strong',
  twoFactorAuth: 'Enabled',
  emailVerified: 'Verified',
  activeSessions: '2 Active',
};

export const payoutSettings = {
  accountHolder: 'Bella Rose',
  bankName: 'Chase Bank',
  routingNumber: '****1234',
  accountNumber: '****5678',
  verified: true,
  payoutSchedule: 'Weekly (Every Monday)',
  minimumPayout: '$100.00',
  currency: 'USD — US Dollar',
};

export const notifications = [
  { id: 'newMessages', label: 'New Messages', enabled: true },
  { id: 'newSubscribers', label: 'New Subscribers', enabled: true },
  { id: 'tipsPayments', label: 'Tips & Payments', enabled: true },
  { id: 'streamReminders', label: 'Stream Reminders', enabled: true },
  { id: 'productPurchases', label: 'Product Purchases', enabled: false },
];

export const privacySettings = [
  { id: 'profileVisibility', label: 'Profile Visibility', type: 'select', value: 'Public', options: ['Public', 'Private', 'Subscribers Only'] },
  { id: 'showOnlineStatus', label: 'Show Online Status', type: 'toggle', enabled: true },
  { id: 'allowDirectMessages', label: 'Allow Direct Messages', type: 'toggle', enabled: true },
  { id: 'blockedUsers', label: 'Blocked Users', type: 'link', value: '12' },
  { id: 'twoFactorAuth', label: 'Two-Factor Authentication', type: 'link', value: 'Enabled', highlight: true },
];

export const creatorPreferences = [
  { id: 'defaultStreamType', label: 'Default Stream Type', type: 'select', value: 'Live Video', options: ['Live Video', 'Audio Only'] },
  { id: 'defaultCallType', label: 'Default Call Type', type: 'select', value: 'Audio Call', options: ['Audio Call', 'Video Call'] },
  { id: 'contentLanguage', label: 'Content Language', type: 'select', value: 'English', options: ['English', 'Spanish', 'French', 'German'] },
  { id: 'timezone', label: 'Timezone', type: 'select', value: '(GMT-05:00) Eastern Time', options: ['(GMT-05:00) Eastern Time', '(GMT-06:00) Central Time', '(GMT-07:00) Pacific Time'] },
  { id: 'contentMaturity', label: 'Content Maturity', type: 'select', value: 'General Audience', options: ['General Audience', 'Mature Audience'] },
];

export const helpLinks = [
  { id: 'helpCenter', label: 'Help Center', description: 'Get answers to common questions', icon: 'help' },
  { id: 'contactSupport', label: 'Contact Support', description: "We're here to help you", icon: 'support' },
  { id: 'reportIssue', label: 'Report an Issue', description: 'Let us know about a problem', icon: 'report' },
];

export const quickInfo = {
  username: 'bellarose_official',
  email: 'bella.rose@fantrio.com',
  timezone: '(GMT-05:00) Eastern Time',
};
