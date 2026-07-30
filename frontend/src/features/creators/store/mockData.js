// Store page mock data

export const storeStats = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$8,450.70',
    change: '18%',
    changeType: 'positive',
    period: 'vs last month',
    icon: 'revenue',
    color: '#e10075',
  },
  {
    id: 'orders',
    label: 'Orders',
    value: '126',
    change: '14%',
    changeType: 'positive',
    period: 'vs last month',
    icon: 'orders',
    color: '#8b5cf6',
  },
  {
    id: 'products',
    label: 'Products',
    value: '18',
    subtitle: 'Active products',
    icon: 'products',
    color: '#10b981',
  },
  {
    id: 'inventory',
    label: 'Inventory Items',
    value: '342',
    subtitle: 'In stock',
    icon: 'inventory',
    color: '#06b6d4',
  },
];

export const storeTabs = [
  { id: 'all', label: 'All Products', count: 18 },
  { id: 'active', label: 'Active', count: 15 },
  { id: 'draft', label: 'Draft', count: 2 },
  { id: 'outOfStock', label: 'Out of Stock', count: 1 },
];

export const products = [
  {
    id: 1,
    name: 'Signed Poster',
    description: '12x18 inch with signature',
    price: '$25.00',
    currency: 'USD',
    inventory: 48,
    inventoryStatus: 'In Stock',
    sold: 32,
    revenue: '$800.00',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    name: 'Custom Polaroid Photo',
    description: 'Personalized & signed',
    price: '$15.00',
    currency: 'USD',
    inventory: 76,
    inventoryStatus: 'In Stock',
    sold: 54,
    revenue: '$810.00',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    name: 'Bella Rose Hoodie',
    description: 'Limited edition hoodie',
    price: '$45.00',
    currency: 'USD',
    inventory: 22,
    inventoryStatus: 'In Stock',
    sold: 18,
    revenue: '$810.00',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop',
  },
  {
    id: 4,
    name: 'Video Shoutout',
    description: 'Personalized video message',
    price: '$35.00',
    currency: 'USD',
    inventory: null,
    inventoryStatus: 'Unlimited',
    sold: 12,
    revenue: '$420.00',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=100&h=100&fit=crop',
  },
  {
    id: 5,
    name: '2024 Calendar',
    description: 'Exclusive calendar',
    price: '$30.00',
    currency: 'USD',
    inventory: 0,
    inventoryStatus: 'Out of Stock',
    sold: 0,
    revenue: '$0.00',
    status: 'Out of Stock',
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4bbe?w=100&h=100&fit=crop',
  },
  {
    id: 6,
    name: 'Phone Wallpaper Pack',
    description: 'High resolution pack',
    price: '$5.00',
    currency: 'USD',
    inventory: null,
    inventoryStatus: 'Unlimited',
    sold: 10,
    revenue: '$50.00',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=100&h=100&fit=crop',
  },
];

export const storeOverview = {
  totalRevenue: '$8,450.70',
  revenueChange: '18%',
  totalOrders: '126',
  ordersChange: '14%',
  averageOrderValue: '$67.07',
  aovChange: '8%',
  conversionRate: '7.3%',
  conversionChange: '5%',
};

export const topSellingProducts = [
  { id: 1, name: 'Custom Polaroid Photo', sold: 54, revenue: '$810.00', thumbnail: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=60&h=60&fit=crop', rank: 1 },
  { id: 2, name: 'Signed Poster', sold: 32, revenue: '$800.00', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=60&h=60&fit=crop', rank: 2 },
  { id: 3, name: 'Bella Rose Hoodie', sold: 18, revenue: '$810.00', thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=60&h=60&fit=crop', rank: 3 },
];

export const recentOrders = [
  { id: 1, customer: 'James Carter', date: 'May 24, 2024 • 4:20 PM', amount: '$25.00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  { id: 2, customer: 'Sarah Mitchell', date: 'May 24, 2024 • 2:15 PM', amount: '$45.00', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face' },
  { id: 3, customer: 'Tyler Brooks', date: 'May 24, 2024 • 11:30 AM', amount: '$15.00', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face' },
];

export const quickStats = {
  period: 'This Month',
  pageViews: { value: '3,245', change: '16%', changeType: 'positive' },
  storeVisits: { value: '1,205', change: '12%', changeType: 'positive' },
  addToCart: { value: '168', change: '9%', changeType: 'positive' },
  checkoutRate: { value: '7.3%', change: '5%', changeType: 'positive' },
};

export const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Most Popular'];
