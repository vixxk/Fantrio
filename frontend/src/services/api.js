const BASE_URL = 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token') || '';
    this.userId = 'user-1';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Try real backend API first
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const fetchOptions = {
        method,
        headers,
      };
      if (options.body) {
        fetchOptions.body = options.body;
      }
      
      const res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
      const data = await res.json();
      if (res.ok) {
        return data;
      } else {
        if (res.status !== 404 && res.status !== 500) {
          throw new Error(data.message || 'API request failed');
        }
      }
    } catch (err) {
      console.log('Real API failed or 404, falling back to mock handler:', err.message);
    }

    // Normalise endpoint (e.g. remove query strings)
    const urlObj = new URL(`http://dummy.com${endpoint}`);
    const pathname = urlObj.pathname;
    const _q = (urlObj.searchParams.get('search') || '').trim().toLowerCase();
    const _match = (...fields) => !_q || fields.some((f) => f && String(f).toLowerCase().includes(_q));

    // Helper functions to get/set local storage states
    const getBalance = () => {
      const stored = localStorage.getItem('fantrio_balance');
      return stored !== null ? parseInt(stored, 10) : 5000;
    };
    const setBalance = (val) => {
      localStorage.setItem('fantrio_balance', val.toString());
    };

    const getSubscriptions = () => {
      const stored = localStorage.getItem('fantrio_subscriptions');
      if (stored) return JSON.parse(stored);
      // default list of mock subscriptions
      const defaultSubs = [
        {
          _id: 'sub-1',
          creatorId: 'creator-savannah',
          status: 'active',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          priceCoins: 18,
          creator: {
            displayName: 'Savannah Nguyen',
            username: 'savannah_n',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
            isVerifiedBadge: true,
            rates: { voiceCallMinute: 18, videoCallMinute: 25 }
          }
        }
      ];
      localStorage.setItem('fantrio_subscriptions', JSON.stringify(defaultSubs));
      return defaultSubs;
    };

    const setSubscriptions = (subs) => {
      localStorage.setItem('fantrio_subscriptions', JSON.stringify(subs));
    };

    const getFollows = () => {
      const stored = localStorage.getItem('fantrio_follows');
      return stored ? JSON.parse(stored) : [];
    };

    const setFollows = (follows) => {
      localStorage.setItem('fantrio_follows', JSON.stringify(follows));
    };

    const getTickets = () => {
      const stored = localStorage.getItem('fantrio_tickets');
      if (stored) return JSON.parse(stored);
      const defaultTickets = [
        { _id: 't-1', subject: 'Coin Purchase Issue', status: 'resolved', createdAt: new Date().toISOString() },
        { _id: 't-2', subject: 'Payout Setup', status: 'pending', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('fantrio_tickets', JSON.stringify(defaultTickets));
      return defaultTickets;
    };

    const setTickets = (tickets) => {
      localStorage.setItem('fantrio_tickets', JSON.stringify(tickets));
    };

    const getFeatures = () => {
      const stored = localStorage.getItem('fantrio_features');
      if (stored) return JSON.parse(stored);
      const defaultFeatures = [
        { _id: 'f-1', title: 'Group Video Streams', description: 'Host streams with multiple co-hosts.', votes: ['user-1'], status: 'planned' },
        { _id: 'f-2', title: 'Tipping Animations', description: 'Cute visual triggers when someone tips coins.', votes: [], status: 'considering' }
      ];
      localStorage.setItem('fantrio_features', JSON.stringify(defaultFeatures));
      return defaultFeatures;
    };

    const setFeatures = (features) => {
      localStorage.setItem('fantrio_features', JSON.stringify(features));
    };

    const getTransactions = () => {
      const stored = localStorage.getItem('fantrio_transactions');
      if (stored) return JSON.parse(stored);
      const defaultTx = [
        { _id: 'tx-1', type: 'purchase', coins: 500, description: 'Added Coins', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: 'tx-2', type: 'tip', coins: -50, description: 'Tipped Leslie Alexander', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
      ];
      localStorage.setItem('fantrio_transactions', JSON.stringify(defaultTx));
      return defaultTx;
    };

    const addTransaction = (type, coins, description) => {
      const txs = getTransactions();
      txs.unshift({
        _id: 'tx-' + Date.now(),
        type,
        coins,
        description,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('fantrio_transactions', JSON.stringify(txs));
    };

    // MOCK CREATORS DATA
    const MOCK_CREATORS_DB = [
      {
        _id: 'creator-savannah',
        displayName: 'Savannah Nguyen',
        username: 'savannah_n',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 50000,
        postCount: 234,
        country: 'United States',
        language: 'English',
        categories: ['Model', 'Lingerie', 'Influencer'],
        rates: { voiceCallMinute: 18, videoCallMinute: 25 },
        rating: 4.9,
        ratingCount: 125,
        contentType: ['Photos', 'Videos', 'PPV']
      },
      {
        _id: 'creator-leslie',
        displayName: 'Leslie Alexander',
        username: 'leslie_alex',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 12500,
        postCount: 512,
        country: 'United States',
        language: 'English',
        categories: ['Fashion', 'Lifestyle', 'Cosplay'],
        rates: { voiceCallMinute: 15, videoCallMinute: 20 },
        rating: 4.8,
        ratingCount: 98,
        contentType: ['Photos']
      },
      {
        _id: 'creator-jenny',
        displayName: 'Jenny Wilson',
        username: 'jenny_wilson',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 22000,
        postCount: 640,
        country: 'Canada',
        language: 'English',
        categories: ['Gaming', 'Lifestyle', 'Dance'],
        rates: { voiceCallMinute: 20, videoCallMinute: 25 },
        rating: 4.9,
        ratingCount: 310,
        contentType: ['Videos']
      },
      {
        _id: 'creator-kristin',
        displayName: 'Kristin Watson',
        username: 'kristin_w',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: false,
        audioAvailable: false,
        videoAvailable: true,
        followerCount: 18500,
        postCount: 104,
        country: 'United Kingdom',
        language: 'English',
        categories: ['Music', 'Entertainment', 'Art'],
        rates: { voiceCallMinute: 12, videoCallMinute: 18 },
        rating: 4.7,
        ratingCount: 64,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-dianne',
        displayName: 'Dianne Russell',
        username: 'dianne_r',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 9500,
        postCount: 88,
        country: 'Australia',
        language: 'English',
        categories: ['Dance', 'Lifestyle', 'Gaming', 'ASMR'],
        rates: { voiceCallMinute: 10, videoCallMinute: 15 },
        rating: 4.6,
        ratingCount: 42,
        contentType: ['Photos']
      },
      {
        _id: 'creator-molly',
        displayName: 'Molly Jane',
        username: 'mollyjane',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 34200,
        postCount: 150,
        country: 'United States',
        language: 'English',
        categories: ['Fitness', 'Lifestyle'],
        rates: { voiceCallMinute: 18, videoCallMinute: 24 },
        rating: 4.9,
        ratingCount: 15430,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-jessica',
        displayName: 'Jessica Williams',
        username: 'jessica_w',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: false,
        isOnline: true,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 15000,
        postCount: 95,
        country: 'Spain',
        language: 'Spanish',
        categories: ['Model'],
        rates: { voiceCallMinute: 14, videoCallMinute: 19 },
        rating: 4.5,
        ratingCount: 3100,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-emily',
        displayName: 'Emily Smith',
        username: 'emily_s',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: false,
        isLive: true,
        audioAvailable: true,
        videoAvailable: false,
        followerCount: 32000,
        postCount: 120,
        country: 'Germany',
        language: 'German',
        categories: ['Gaming'],
        rates: { voiceCallMinute: 12, videoCallMinute: 16 },
        rating: 4.8,
        ratingCount: 7800,
        contentType: ['Videos']
      },
      {
        _id: 'creator-sophia',
        displayName: 'Sophia Martinez',
        username: 'sophia_m',
        avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: false,
        audioAvailable: false,
        videoAvailable: true,
        followerCount: 29000,
        postCount: 88,
        country: 'France',
        language: 'French',
        categories: ['Lifestyle'],
        rates: { voiceCallMinute: 15, videoCallMinute: 22 },
        rating: 4.7,
        ratingCount: 12000,
        contentType: ['Photos']
      },
      {
        _id: 'creator-angelina',
        displayName: 'Angelina Jolie',
        username: 'angelina_j',
        avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 88000,
        postCount: 420,
        country: 'United States',
        language: 'English',
        categories: ['Fitness'],
        rates: { voiceCallMinute: 25, videoCallMinute: 35 },
        rating: 4.9,
        ratingCount: 22000,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-mia',
        displayName: 'Mia Conti',
        username: 'mia_c',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: false,
        isOnline: false,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 5000,
        postCount: 65,
        country: 'Italy',
        language: 'Italian',
        categories: ['Art'],
        rates: { voiceCallMinute: 10, videoCallMinute: 15 },
        rating: 4.4,
        ratingCount: 1900,
        contentType: ['Photos']
      },
      {
        _id: 'creator-luna',
        displayName: 'Luna Star',
        username: 'luna_s',
        avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: false,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 14000,
        postCount: 110,
        country: 'United States',
        language: 'English',
        categories: ['Astrology'],
        rates: { voiceCallMinute: 16, videoCallMinute: 20 },
        rating: 4.8,
        ratingCount: 6500,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-charlotte',
        displayName: 'Charlotte Rose',
        username: 'charlotte_r',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 24500,
        postCount: 105,
        country: 'United Kingdom',
        language: 'English',
        categories: ['Model', 'Lingerie'],
        rates: { voiceCallMinute: 18, videoCallMinute: 25 },
        rating: 4.7,
        ratingCount: 5200,
        contentType: ['Photos', 'Videos']
      },
      {
        _id: 'creator-harper',
        displayName: 'Harper Live',
        username: 'harper_live',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 18900,
        postCount: 95,
        country: 'Canada',
        language: 'English',
        categories: ['Fitness', 'Dance'],
        rates: { voiceCallMinute: 14, videoCallMinute: 18 },
        rating: 4.8,
        ratingCount: 3900,
        contentType: ['Videos']
      },
      {
        _id: 'creator-amelia',
        displayName: 'Amelia Star',
        username: 'amelia_star',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
        isVerifiedBadge: true,
        isOnline: true,
        isLive: true,
        audioAvailable: true,
        videoAvailable: true,
        followerCount: 22000,
        postCount: 112,
        country: 'Australia',
        language: 'English',
        categories: ['Cosplay', 'Gaming'],
        rates: { voiceCallMinute: 16, videoCallMinute: 22 },
        rating: 4.9,
        ratingCount: 4600,
        contentType: ['Photos', 'Videos']
      }
    ];

    // ROUTING
    if (pathname === '/auth/login') {
      const isAdmin = body.email === 'admin@fantrio.com';
      if (isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
      return {
        status: 'success',
        token: isAdmin ? 'admin-token' : 'demo-token-xyz',
        user: {
          id: isAdmin ? 'usr-admin' : 'usr-demo',
          username: isAdmin ? 'admin' : 'demo_user',
          displayName: isAdmin ? 'System Admin' : 'Demo User',
          email: body.email || 'demo@fantrio.com',
          role: isAdmin ? 'admin' : 'user',
          avatarUrl: isAdmin 
            ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        }
      };
    }

    if (pathname === '/auth/logout') {
      localStorage.removeItem('isAdmin');
      return { status: 'success' };
    }

    if (pathname === '/auth/me') {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      return {
        status: 'success',
        user: {
          id: isAdmin ? 'usr-admin' : 'usr-demo',
          username: isAdmin ? 'admin' : 'demo_user',
          displayName: isAdmin ? 'System Admin' : 'Demo User',
          email: isAdmin ? 'admin@fantrio.com' : 'johnn@example.com',
          role: isAdmin ? 'admin' : 'user',
          avatarUrl: isAdmin 
            ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        }
      };
    }

    // Admin Panel Mock Endpoints
    if (pathname === '/admin/stats') {
      return {
        status: 'success',
        stats: {
          users: { totalUsers: 15, totalCreators: 5, totalAdmins: 1 },
          wallet: { totalCoinsCirculating: getBalance() + 25000 },
          transactions: [
            { _id: 'purchase', totalCoins: 12000, count: 24 },
            { _id: 'tip', totalCoins: 8500, count: 12 },
            { _id: 'subscription', totalCoins: 4500, count: 8 }
          ],
          moderation: { totalReportedPosts: 1, totalReportsCount: 2 },
          calls: { activeCallsCount: 1 }
        }
      };
    }

    if (pathname === '/admin/settings') {
      const stored = localStorage.getItem('fantrio_admin_settings');
      const settings = stored ? JSON.parse(stored) : {
        commissionRate: 0.20,
        coinPackages: [
          { coins: 100, priceUSD: 9.99 },
          { coins: 500, priceUSD: 44.99 },
          { coins: 1000, priceUSD: 79.99 }
        ]
      };
      return { status: 'success', settings };
    }

    if (pathname === '/admin/users') {
      let users = [
        { _id: 'usr-demo', email: 'johnn@example.com', username: 'johnn', displayName: 'Johnn', role: 'user', isVerified: true, isSuspended: false, createdAt: '2026-07-01' },
        { _id: 'usr-admin', email: 'admin@fantrio.com', username: 'admin', displayName: 'System Admin', role: 'admin', isVerified: true, isSuspended: false, createdAt: '2026-07-02' },
        { _id: 'creator-savannah', email: 'savannah@example.com', username: 'savannah_n', displayName: 'Savannah Nguyen', role: 'creator', isVerified: true, isSuspended: false, createdAt: '2026-07-03' },
        { _id: 'creator-leslie', email: 'leslie@example.com', username: 'leslie_alex', displayName: 'Leslie Alexander', role: 'creator', isVerified: true, isSuspended: false, createdAt: '2026-07-04' }
      ];
      if (_q) users = users.filter((u) => _match(u.email, u.username, u.displayName, u.role));
      return { status: 'success', total: users.length, users };
    }

    if (pathname.startsWith('/admin/users/')) {
      const parts = pathname.split('/');
      const userId = parts[3];
      if (parts[4] === 'toggle-suspension') {
        return { status: 'success', message: 'User suspension toggled', isSuspended: true };
      }
      if (method === 'PUT') {
        return { status: 'success', user: { _id: userId, ...body } };
      }
      if (method === 'DELETE') {
        return { status: 'success', message: 'User deleted' };
      }
    }

    if (pathname === '/admin/creators') {
      let profiles = MOCK_CREATORS_DB.map(c => ({
        _id: c._id,
        userId: { _id: c._id, username: c.username, email: `${c.username}@example.com`, role: 'creator', displayName: c.displayName },
        bio: c.bio || 'Professional creator and entertainer',
        categories: c.categories,
        rates: c.rates,
        followerCount: c.followerCount,
        subscriberCount: Math.floor(c.followerCount / 100),
        rating: c.rating,
        verificationStatus: c.isVerifiedBadge ? 'approved' : 'pending',
        isVerifiedBadge: c.isVerifiedBadge
      }));
      if (_q) profiles = profiles.filter((p) => _match(p.userId.username, p.userId.email, p.userId.displayName));
      return { status: 'success', profiles };
    }

    if (pathname.startsWith('/admin/creators/')) {
      const parts = pathname.split('/');
      const creatorId = parts[3];
      const action = parts[4];
      if (action === 'approve') {
        return { status: 'success', message: 'Creator approved' };
      }
      if (action === 'reject') {
        return { status: 'success', message: 'Creator rejected' };
      }
      if (action === 'verify') {
        return { status: 'success', message: 'Creator verification status toggled' };
      }
      if (method === 'PUT') {
        return { status: 'success', profile: { userId: creatorId, ...body } };
      }
    }

    if (pathname === '/admin/posts') {
      let posts = [
        { _id: 'post-1', creatorId: { _id: 'creator-savannah', username: 'savannah_n', displayName: 'Savannah Nguyen', avatarUrl: MOCK_CREATORS_DB[0].avatarUrl }, content: 'Exclusive shoot previews for my premium subscribers!', likes: ['user-1'], comments: [], createdAt: '2026-07-05' },
        { _id: 'post-2', creatorId: { _id: 'creator-leslie', username: 'leslie_alex', displayName: 'Leslie Alexander', avatarUrl: MOCK_CREATORS_DB[1].avatarUrl }, content: 'Going live in 10 minutes, get ready!', likes: [], comments: [], createdAt: '2026-07-06' }
      ];
      if (_q) posts = posts.filter((p) => _match(p.content, p.creatorId.displayName, p.creatorId.username));
      return { status: 'success', posts };
    }

    if (pathname === '/admin/reports') {
      let posts = [
        { 
          _id: 'post-1', 
          creatorId: { _id: 'creator-savannah', username: 'savannah_n', displayName: 'Savannah Nguyen', avatarUrl: MOCK_CREATORS_DB[0].avatarUrl }, 
          content: 'Reported post content.', 
          reports: [{ userId: { username: 'reporter1', displayName: 'Reporter 1' }, reason: 'Inappropriate content', date: '2026-07-08' }] 
        }
      ];
      if (_q) posts = posts.filter((p) => _match(p.content, p.creatorId.displayName, p.creatorId.username));
      return { status: 'success', posts };
    }

    if (pathname.startsWith('/admin/reports/')) {
      return { status: 'success', message: 'Moderation action successful' };
    }

    if (pathname === '/admin/transactions') {
      let transactions = [
        { _id: 'tx-1', senderId: { username: 'johnn', displayName: 'Johnn', email: 'johnn@example.com' }, receiverId: { username: 'savannah_n', displayName: 'Savannah Nguyen', email: 'savannah@example.com' }, type: 'subscription', amountCoins: 18, status: 'completed', createdAt: '2026-07-07' },
        { _id: 'tx-2', senderId: { username: 'johnn', displayName: 'Johnn', email: 'johnn@example.com' }, receiverId: null, type: 'deposit', amountCoins: 500, status: 'completed', createdAt: '2026-07-06' }
      ];
      if (_q) transactions = transactions.filter((t) => _match(t.type, t.senderId && t.senderId.displayName, t.receiverId && t.receiverId.displayName));
      return { status: 'success', transactions };
    }

    if (pathname === '/admin/withdrawals') {
      let withdrawals = [
        { _id: 'w-1', senderId: { username: 'savannah_n', displayName: 'Savannah Nguyen', email: 'savannah@example.com' }, type: 'withdrawal', amountCoins: 1000, status: 'pending', createdAt: '2026-07-08' }
      ];
      if (_q) withdrawals = withdrawals.filter((w) => _match(w.senderId.displayName, w.senderId.username, w.status));
      return { status: 'success', withdrawals };
    }

    if (pathname.startsWith('/admin/withdrawals/')) {
      return { status: 'success', message: 'Withdrawal cleared' };
    }

    if (pathname.startsWith('/admin/refund/')) {
      return { status: 'success', message: 'Transaction refunded' };
    }

    if (pathname === '/admin/announcements') {
      const announcements = [
        { _id: 'a-1', title: 'V2 Platform Upgrade complete!', content: 'We successfully rolled out new call protocols for clearer audio/video calls.', category: 'news', createdAt: '2026-07-02' }
      ];
      return { status: 'success', announcements };
    }

    if (pathname.startsWith('/admin/announcements')) {
      if (method === 'POST') return { status: 'success', announcement: { _id: 'a-' + Date.now(), ...body } };
      if (method === 'PUT') return { status: 'success', announcement: { _id: pathname.split('/').pop(), ...body } };
      if (method === 'DELETE') return { status: 'success', message: 'Announcement deleted' };
    }

    if (pathname === '/admin/tickets') {
      let tickets = [
        { _id: 't-1', userId: { username: 'johnn', displayName: 'Johnn', email: 'johnn@example.com' }, subject: 'Coin Purchase Issue', message: 'I bought 500 coins but did not receive them.', status: 'pending', createdAt: '2026-07-08' },
        { _id: 't-2', userId: { username: 'savannah_n', displayName: 'Savannah Nguyen', email: 'savannah@example.com' }, subject: 'Payout delayed', message: 'My withdrawal is taking too long.', status: 'resolved', createdAt: '2026-07-09' }
      ];
      if (_q) tickets = tickets.filter((t) => _match(t.subject, t.message, t.userId.displayName, t.userId.username, t.status));
      return { status: 'success', tickets };
    }

    if (pathname.startsWith('/admin/tickets')) {
      if (method === 'PUT') return { status: 'success', ticket: { _id: pathname.split('/').pop(), ...body } };
      if (method === 'DELETE') return { status: 'success', message: 'Ticket deleted' };
    }

    if (pathname === '/admin/features') {
      const features = [
        { _id: 'f-1', userId: { username: 'johnn', displayName: 'Johnn', email: 'johnn@example.com' }, title: 'Group Video Streams', description: 'Host streams with multiple co-hosts.', votes: ['user-1'], status: 'planned', createdAt: '2026-07-07' }
      ];
      return { status: 'success', features };
    }

    if (pathname.startsWith('/admin/features')) {
      if (method === 'PUT') return { status: 'success', feature: { _id: pathname.split('/').pop(), ...body } };
      if (method === 'DELETE') return { status: 'success', message: 'Feature request deleted' };
    }

    if (pathname === '/wallet/balance') {
      return { status: 'success', balanceCoins: getBalance() };
    }

    if (pathname === '/wallet/add-mock-coins') {
      const addVal = parseInt(body.coins, 10) || 0;
      const newBal = getBalance() + addVal;
      setBalance(newBal);
      addTransaction('purchase', addVal, 'Added Coins (20% bonus promo)');
      return { status: 'success', balanceCoins: newBal };
    }

    if (pathname === '/wallet/add-coins') {
      const addVal = parseInt(body.amount, 10) || 0; // negative
      const newBal = getBalance() + addVal;
      setBalance(newBal);
      addTransaction('call', addVal, 'Spent Coins on Call');
      return { status: 'success', balanceCoins: newBal };
    }

    if (pathname === '/creators/stories') {
      return {
        status: 'success',
        stories: MOCK_CREATORS_DB.map(c => ({
          _id: c._id,
          displayName: c.displayName.split(' ')[0],
          avatarUrl: c.avatarUrl,
          isLive: c.isLive,
          isOnline: c.isOnline
        }))
      };
    }

    if (pathname === '/monetization/subscriptions') {
      return {
        status: 'success',
        data: {
          subscriptions: getSubscriptions()
        }
      };
    }

    if (pathname.startsWith('/monetization/unsubscribe/')) {
      const creatorId = pathname.split('/').pop();
      const subs = getSubscriptions().map(s => {
        if (s.creatorId === creatorId) {
          return { ...s, status: 'cancelled' };
        }
        return s;
      });
      setSubscriptions(subs);
      return { status: 'success' };
    }

    if (pathname.startsWith('/monetization/subscribe/')) {
      const creatorId = pathname.split('/').pop();
      const creatorObj = MOCK_CREATORS_DB.find(c => c._id === creatorId);
      const subs = getSubscriptions();
      
      // Check if already subscribed
      const existing = subs.find(s => s.creatorId === creatorId);
      if (existing) {
        existing.status = 'active';
      } else if (creatorObj) {
        subs.push({
          _id: 'sub-' + Date.now(),
          creatorId,
          status: 'active',
          startDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priceCoins: 18,
          creator: {
            displayName: creatorObj.displayName,
            username: creatorObj.username,
            avatarUrl: creatorObj.avatarUrl,
            isVerifiedBadge: creatorObj.isVerifiedBadge,
            rates: creatorObj.rates
          }
        });
      }
      setSubscriptions(subs);
      return { status: 'success' };
    }

    if (pathname === '/creators/live') {
      const liveList = MOCK_CREATORS_DB.map(c => ({
        _id: c._id,
        displayName: c.displayName,
        username: c.username,
        viewerCount: '862',
        coverUrl: c.coverUrl || c.avatarUrl,
        isVerified: c.isVerifiedBadge,
        category: c.categories ? c.categories[0] : 'Just Chatting',
        streamTitle: 'Live session with ' + c.displayName,
        language: c.language || 'English',
        isLive: true,
        rate: c.rates ? c.rates.videoCallMinute : 18,
        rating: c.rating || 4.9
      }));

      return {
        status: 'success',
        creators: liveList,
        liveStreams: liveList,
        leaderboard: MOCK_CREATORS_DB.map(c => ({
          _id: c._id,
          displayName: c.displayName,
          username: c.username,
          avatarUrl: c.avatarUrl,
          isVerifiedBadge: c.isVerifiedBadge,
          coinsEarned: c.followerCount ? Math.floor(c.followerCount / 2) : 5000
        }))
      };
    }

    if (pathname === '/creators/trending') {
      return {
        status: 'success',
        creators: MOCK_CREATORS_DB
      };
    }

    if (pathname === '/posts/hashtags') {
      return {
        status: 'success',
        hashtags: [
          { tag: 'exclusive', postCount: '15.2K posts' },
          { tag: 'lifestyle', postCount: '10.5K posts' },
          { tag: 'dancer', postCount: '8.4K posts' },
          { tag: 'singing', postCount: '5.1K posts' },
          { tag: 'cosplay', postCount: '4.8K posts' },
          { tag: 'gaming', postCount: '12.1K posts' },
          { tag: 'behindthescenes', postCount: '9.3K posts' },
          { tag: 'fitness', postCount: '7.6K posts' }
        ]
      };
    }

    if (pathname === '/creators/suggested') {
      return {
        status: 'success',
        creators: MOCK_CREATORS_DB
      };
    }

    if (pathname === '/more/tickets') {
      if (method === 'GET') {
        return { status: 'success', tickets: getTickets() };
      } else {
        // POST
        const tix = getTickets();
        tix.unshift({
          _id: 't-' + Date.now(),
          subject: body.subject || 'Support Ticket',
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        setTickets(tix);
        return { status: 'success' };
      }
    }

    if (pathname === '/more/announcements') {
      return {
        status: 'success',
        announcements: [
          { _id: 'a-1', title: 'V2 Platform Upgrade complete!', content: 'We successfully rolled out new call protocols for clearer audio/video calls.', date: 'July 2, 2026' },
          { _id: 'a-2', title: 'Coins Store Promo Active', content: 'Double coins promotion ends in 2 days. Buy now to grab 20% bonus coins!', date: 'July 1, 2026' }
        ]
      };
    }

    if (pathname === '/more/features') {
      if (method === 'GET') {
        return { status: 'success', features: getFeatures() };
      } else {
        // POST
        const feats = getFeatures();
        feats.unshift({
          _id: 'f-' + Date.now(),
          title: body.title,
          description: body.description,
          votes: [],
          status: 'considering'
        });
        setFeatures(feats);
        return { status: 'success' };
      }
    }

    if (pathname.includes('/more/features/') && pathname.endsWith('/vote')) {
      const id = pathname.split('/')[3];
      const feats = getFeatures().map(f => {
        if (f._id === id) {
          const votes = f.votes || [];
          if (votes.includes('user-1')) {
            return { ...f, votes: votes.filter(v => v !== 'user-1') };
          } else {
            return { ...f, votes: [...votes, 'user-1'] };
          }
        }
        return f;
      });
      setFeatures(feats);
      return { status: 'success' };
    }

    if (pathname === '/creators') {
      return { status: 'success', creators: MOCK_CREATORS_DB };
    }

    if (pathname === '/wallet/transactions') {
      return { status: 'success', transactions: getTransactions() };
    }

    if (pathname === '/more/referrals/stats') {
      return {
        status: 'success',
        stats: {
          totalReferrals: 3,
          earnedCoins: 150,
          referralCode: 'FANTRIO_DEMO_99'
        }
      };
    }

    if (pathname === '/more/referrals/claim') {
      return { status: 'success' };
    }

    if (pathname === '/more/reports') {
      const reports = JSON.parse(localStorage.getItem('fantrio_reports') || '[]');
      reports.push({
        _id: 'rep-' + Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('fantrio_reports', JSON.stringify(reports));
      return { status: 'success' };
    }

    if (pathname.startsWith('/monetization/tip/')) {
      const creatorId = pathname.split('/').pop();
      const creatorObj = MOCK_CREATORS_DB.find(c => c._id === creatorId) || { displayName: 'Creator' };
      const tipVal = parseInt(body.coins, 10) || 0;
      
      const newBal = getBalance() - tipVal;
      setBalance(newBal);
      addTransaction('tip', -tipVal, `Tipped ${creatorObj.displayName}`);
      return { status: 'success', balanceCoins: newBal };
    }

    if (pathname === '/creators/discover') {
      const urlObj = new URL(url, 'http://localhost');
      const pageVal = parseInt(urlObj.searchParams.get('page'), 10) || 1;
      const limitVal = 8;
      const totalCount = MOCK_CREATORS_DB.length;
      const totalPagesVal = Math.ceil(totalCount / limitVal);
      const startIndex = (pageVal - 1) * limitVal;
      const paginatedCreators = MOCK_CREATORS_DB.slice(startIndex, startIndex + limitVal);

      return {
        status: 'success',
        creators: paginatedCreators,
        total: totalCount,
        totalPages: totalPagesVal
      };
    }

    if (pathname.startsWith('/creators/follow/')) {
      const creatorId = pathname.split('/').pop();
      const follows = getFollows();
      let newFollows;
      if (follows.includes(creatorId)) {
        newFollows = follows.filter(id => id !== creatorId);
      } else {
        newFollows = [...follows, creatorId];
      }
      setFollows(newFollows);
      return { status: 'success' };
    }

    if (pathname === '/call/initiate') {
      return {
        status: 'success',
        roomId: 'mock-room-' + Math.random().toString(36).substr(2, 9)
      };
    }

    if (pathname === '/call/heartbeat' || pathname === '/call/end') {
      return { status: 'success' };
    }

    // Default Fallback
    return { status: 'success' };
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();
