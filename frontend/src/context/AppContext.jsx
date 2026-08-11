import { createContext, useState, useEffect, useRef, useContext } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
   const [darkMode, setDarkMode] = useState(() => {
     const saved = localStorage.getItem('darkMode');
     if (saved === null) {
       localStorage.setItem('darkMode', JSON.stringify(true));
       return true;
     }
     try {
       return JSON.parse(saved) === true;
     } catch {
       return true;
     }
   });

  const tabToPath = {
    'Discover Feed': '/discover',
    'All Creators': '/creators',
    'Creator Analytics': '/creators/analytics',
    'Creator Live Calls': '/creators/live-calls',
    'Creator Audio Calls': '/creators/audio-calls',
    'Creator Video Calls': '/creators/video-calls',
    'Creator Profile': '/creators/profile',
    'Creator Content': '/creators/content',
    'Creator PPV Content': '/creators/ppv-content',
    'Creator Dashboard': '/creators/dashboard',
    'Creator Messages': '/creators/messages',
    'Creator Subscribers': '/creators/subscribers',
    'Creator Live Streams': '/creators/live-streams',
    'Creator Earnings': '/creators/earnings',
    'Creator Store': '/creators/store',
    'Creator Settings': '/creators/settings',
    'Live Streams': '/live',
    '1:1 Audio Calls': '/audio-calls',
    '1:1 Video Calls': '/video-calls',
    'My Subscription': '/subscriptions',
    'Messages': '/messages',
    'Public Creator Profile': '/creator-profile',
    'Buy Coins': '/buy-coins',
    'Transaction History': '/transactions',
    'Settings': '/settings',
    'More': '/more',
    'Admin Panel': '/admin'
  };

  const pathToTab = {
    '/': 'Discover Feed',
    '/discover': 'Discover Feed',
    '/creators': 'All Creators',
    '/creators/analytics': 'Creator Analytics',
    '/creators/live-calls': 'Creator Live Calls',
    '/creators/audio-calls': 'Creator Audio Calls',
    '/creators/video-calls': 'Creator Video Calls',
    '/creators/profile': 'Creator Profile',
    '/creators/content': 'Creator Content',
    '/creators/ppv-content': 'Creator PPV Content',
    '/creators/dashboard': 'Creator Dashboard',
    '/creators/messages': 'Creator Messages',
    '/creators/subscribers': 'Creator Subscribers',
    '/creators/live-streams': 'Creator Live Streams',
    '/creators/earnings': 'Creator Earnings',
    '/creators/store': 'Creator Store',
    '/creators/settings': 'Creator Settings',
    '/live': 'Live Streams',
    '/audio-calls': '1:1 Audio Calls',
    '/video-calls': '1:1 Video Calls',
    '/subscriptions': 'My Subscription',
    '/messages': 'Messages',
    '/buy-coins': 'Buy Coins',
    '/transactions': 'Transaction History',
    '/settings': 'Settings',
    '/more': 'More',
    '/admin': 'Admin Panel'
  };

  const getTabFromPath = (path) => {
    // Strip query string for tab resolution (e.g. /subscriptions?highlight=xyz)
    const pathname = path.split('?')[0];
    if (pathname.startsWith('/admin')) return 'Admin Panel';
    if (pathname.startsWith('/listener-profile') || pathname.startsWith('/creator-profile')) return 'Public Creator Profile';
    if (pathname.startsWith('/messages')) return 'Messages';
    if (pathname.startsWith('/creators/profile')) return 'Creator Profile';
    if (pathname.startsWith('/creators/live-calls')) return 'Creator Live Calls';
    if (pathname.startsWith('/creators/audio-calls')) return 'Creator Audio Calls';
    if (pathname.startsWith('/creators/video-calls')) return 'Creator Video Calls';
    if (pathname.startsWith('/creators/analytics')) return 'Creator Analytics';
    if (pathname.startsWith('/creators/dashboard')) return 'Creator Dashboard';
    if (pathname.startsWith('/creators/messages')) return 'Creator Messages';
    if (pathname.startsWith('/creators/ppv-content')) return 'Creator PPV Content';
    if (pathname.startsWith('/creators/content')) return 'Creator Content';
    if (pathname.startsWith('/creators/subscribers')) return 'Creator Subscribers';
    if (pathname.startsWith('/creators/live-streams')) return 'Creator Live Streams';
    if (pathname.startsWith('/creators/earnings')) return 'Creator Earnings';
    if (pathname.startsWith('/creators/store')) return 'Creator Store';
    if (pathname.startsWith('/creators/settings')) return 'Creator Settings';
    if (pathname.startsWith('/post/')) return 'Post Detail';
    if (pathname.startsWith('/transactions')) return 'Transaction History';
    if (pathname.startsWith('/subscriptions')) return 'My Subscription';
    if (pathname.startsWith('/live')) return 'Live Streams';
    if (pathname.startsWith('/audio-calls')) return '1:1 Audio Calls';
    if (pathname.startsWith('/video-calls')) return '1:1 Video Calls';
    if (pathname.startsWith('/buy-coins')) return 'Buy Coins';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/more')) return 'More';
    if (pathname.startsWith('/help-centre') || pathname.startsWith('/faq')) return 'Settings';
    if (pathname.startsWith('/support-tickets') || pathname.startsWith('/tickets')) return 'More';
    if (pathname.startsWith('/contact-support') || pathname.startsWith('/contact')) return 'More';
    if (pathname.startsWith('/community-guidelines')) return 'Settings';
    if (pathname.startsWith('/creators')) return 'All Creators';
    if (pathname === '/' || pathname.startsWith('/discover')) return 'Discover Feed';
    return pathToTab[pathname] || 'Discover Feed';
  };

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const [activeTab, setActiveTabState] = useState(getTabFromPath(window.location.pathname));

  // Always-current snapshot of the session role so event handlers registered
  // once (e.g. popstate) can enforce role-based routing without stale closures.
  const roleRef = useRef(user?.role || null);

  // ---- Role-based access control ----
  const isCreatorTab = (tab) => typeof tab === 'string' && tab.startsWith('Creator');

  // Maps a requested tab to one the current user is allowed to see. Creators
  // are confined to creator tabs, regular users to user tabs, and admins are
  // confined to the admin panel. `role` lets callers pass an explicit role
  // (e.g. right after session restore) instead of relying on the possibly-
  // stale `user` state.
  const resolveAccessibleTab = (tab, role) => {
    const currentRole = role || user?.role;
    if (!currentRole) return tab;

    // Admins only get the admin panel — user and creator routes are off-limits.
    if (currentRole === 'admin') return 'Admin Panel';

    const wantCreator = isCreatorTab(tab);
    const isCreator = currentRole === 'creator';
    if (wantCreator && !isCreator) return 'Discover Feed';
    if (!wantCreator && isCreator) return 'Creator Dashboard';
    return tab;
  };

  // Wrapper function to update state and push history
  const setActiveTab = (tab) => {
    const resolved = resolveAccessibleTab(tab);
    setActiveTabState(resolved);
    const path = tabToPath[resolved] || '/discover';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  const navigateTo = (path) => {
    const requestedTab = getTabFromPath(path);
    const resolvedTab = resolveAccessibleTab(requestedTab);
    if (window.location.pathname !== path) {
      // When the requested path is off-limits for the current role, land on
      // that role's allowed home instead of leaving the forbidden URL live.
      if (resolvedTab !== requestedTab) {
        const homePath = tabToPath[resolvedTab];
        if (window.location.pathname !== homePath) {
          window.history.pushState(null, '', homePath);
          setCurrentPath(homePath);
        }
      } else {
        window.history.pushState(null, '', path);
        setCurrentPath(path);
      }
      setActiveTabState(resolvedTab);
    }
  };

  // Like navigateTo but uses replaceState, so auth-route normalization
  // doesn't add a history entry the back button would have to traverse.
  const replacePath = (path) => {
    const requestedTab = getTabFromPath(path);
    const resolvedTab = resolveAccessibleTab(requestedTab);
    if (window.location.pathname !== path) {
      if (resolvedTab !== requestedTab) {
        const homePath = tabToPath[resolvedTab];
        if (window.location.pathname !== homePath) {
          window.history.replaceState(null, '', homePath);
          setCurrentPath(homePath);
        }
      } else {
        window.history.replaceState(null, '', path);
        setCurrentPath(path);
      }
      setActiveTabState(resolvedTab);
    }
  };

  // Listen to popstate event (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const nowPath = window.location.pathname;
      const requestedTab = getTabFromPath(nowPath);
      const matchingTab = resolveAccessibleTab(requestedTab, roleRef.current);
      if (matchingTab !== requestedTab) {
        const homePath = tabToPath[matchingTab];
        window.history.replaceState(null, '', homePath);
        setCurrentPath(homePath);
      } else {
        // Always sync currentPath so downstream components (e.g. MessagesPage)
        // can parse the full path including conversation IDs
        setCurrentPath(nowPath);
      }
      setActiveTabState(matchingTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Keep the role snapshot in sync with the authenticated session
  useEffect(() => {
    roleRef.current = user?.role || null;
  }, [user]);

  // Load user profile and wallet balance on mount to check for existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          api.setToken(storedToken);
          setToken(storedToken);
        }
        const meRes = await api.get('/auth/me');
        if (meRes.user) {
          setUser({
            id: meRes.user.id,
            username: meRes.user.username,
            displayName: meRes.user.displayName,
            email: meRes.user.email,
            avatarUrl: meRes.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            role: meRes.user.role
          });
          {
            const resolved = resolveAccessibleTab(activeTab, meRes.user.role);
            if (resolved !== activeTab) {
              setActiveTabState(resolved);
              const homePath = tabToPath[resolved];
              if (window.location.pathname !== homePath) {
                window.history.replaceState(null, '', homePath);
                setCurrentPath(homePath);
              }
            }
          }
          if (meRes.user.role !== 'admin') {
            try {
              const balanceRes = await api.get('/wallet/balance');
              setBalance(balanceRes.balanceCoins);
            } catch (err) {
              console.error('Failed to fetch balance:', err);
            }
          }
        }
      } catch (err) {
        console.error('No active session:', err);
      }
      setLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a request comes back 401 (expired/invalid token), drop the session and
  // send the user back to the login page.
  useEffect(() => {
    const handleAuthExpired = () => {
      api.setToken('');
      setToken('');
      setUser(null);
      setBalance(0);
      if (!window.location.pathname.startsWith('/login')) {
        window.history.replaceState(null, '', '/login');
      }
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const applyAuth = async (res) => {
    if (res.token) {
      api.setToken(res.token);
      setToken(res.token);
    }
    setUser(res.user);
    // Skip balance fetch for admin users (they don't have a wallet)
    if (res.user?.role === 'admin') {
      setBalance(0);
      return;
    }
    // Fetch balance
    try {
      const balanceRes = await api.get('/wallet/balance');
      setBalance(balanceRes.balanceCoins);
    } catch (err) {
      console.error('Failed to fetch balance after auth:', err);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.requires2FA) {
      return res;
    }
    if (res.token) {
      await applyAuth(res);
    }
    return res;
  };

  const verify2FALogin = async (pendingToken, code) => {
    const res = await api.post('/auth/verify-2fa', { pendingToken, code });
    if (res.token) {
      await applyAuth(res);
    }
    return res;
  };

  const refreshProfile = async () => {
    // Gate on the authenticated user rather than the `token` state: auth is
    // cookie-based, so `token` state can be empty even when the user is
    // logged in (e.g. after a page refresh).
    if (!user) return null;
    try {
      const meRes = await api.get('/auth/me');
      setUser({
        id: meRes.user.id,
        username: meRes.user.username,
        displayName: meRes.user.displayName,
        email: meRes.user.email,
        avatarUrl: meRes.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: meRes.user.role,
        bio: meRes.user.bio || ''
      });
      return meRes.user;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      return null;
    }
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const register = async ({ email, password, role, username, displayName, referralCode }) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      role: (role === 'user' || !role) ? 'fan' : role,
      username,
      displayName,
      referralCode
    });
    // Auto-login when the backend (or mock) returns a token right away.
    // If only a verification message comes back (production OTP flow),
    // the signup page surfaces the message instead.
    if (res.token) {
      await applyAuth(res);
      // Navigate to discover after auto-login (development mode)
      // User will be on login page in production after OTP verification
      window.history.pushState(null, '', '/discover');
    }
    return res;
  };

  async function logout() {
    // Optimistic: drop the local session immediately so the UI flips to the
    // login screen right after the user confirms — no waiting on the server.
    api.setToken('');
    setToken('');
    setUser(null);
    setBalance(0);
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed:', e);
    }
  }

  const refreshBalance = async () => {
    // Gate on the authenticated user rather than the `token` state: auth is
    // cookie-based, and after a session restore (page refresh) `token` state
    // is empty even though the user is logged in — using it here would
    // silently skip the refresh and leave the header balance stale after
    // spending coins (e.g. sending a gift).
    if (user) {
      try {
        const balanceRes = await api.get('/wallet/balance');
        setBalance(balanceRes.balanceCoins);
      } catch (err) {
        console.error('Failed to refresh balance:', err);
      }
    }
  };

  const addCoins = async (amount, type) => {
    if (amount >= 0) {
      const res = await api.post('/wallet/recharge', { coins: amount });
      if (res.status === 'success') {
        setBalance(res.balanceCoins);
        return res.balanceCoins;
      }
    } else {
      const res = await api.post('/wallet/spend', { coins: Math.abs(amount), type: type || 'ppv_unlock' });
      if (res.status === 'success') {
        setBalance(res.balanceCoins);
        return res.balanceCoins;
      }
    }
  };

  const purchaseCoins = async (packageId) => {
    const res = await api.post('/wallet/purchase', { packageId });
    if (res.status === 'success') {
      setBalance(res.balanceCoins);
      return res;
    }
  };

  const redeemPromo = async (code) => {
    const res = await api.post('/wallet/redeem-promo', { code });
    if (res.status === 'success') {
      setBalance(res.balanceCoins);
      return res;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        balance,
        loading,
        darkMode,
        setDarkMode,
        activeTab,
        setActiveTab,
        currentPath,
        navigateTo,
        replacePath,
        login,
        register,
        logout,
        verify2FALogin,
        refreshProfile,
        updateUser,
        refreshBalance,
        addCoins,
        purchaseCoins,
        redeemPromo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
