import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
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
    'Live Streams': '/live',
    '1:1 Audio Calls': '/audio-calls',
    '1:1 Video Calls': '/video-calls',
    'My Subscription': '/subscriptions',
    'Messages': '/messages',
    'Buy Coins': '/buy-coins',
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
    '/live': 'Live Streams',
    '/audio-calls': '1:1 Audio Calls',
    '/video-calls': '1:1 Video Calls',
    '/subscriptions': 'My Subscription',
    '/messages': 'Messages',
    '/buy-coins': 'Buy Coins',
    '/settings': 'Settings',
    '/more': 'More',
    '/admin': 'Admin Panel'
  };

  const getTabFromPath = (path) => {
    if (path.startsWith('/admin')) return 'Admin Panel';
    if (path.startsWith('/messages')) return 'Messages';
    if (path.startsWith('/creators/profile')) return 'Creator Profile';
    if (path.startsWith('/creators/live-calls')) return 'Creator Live Calls';
    if (path.startsWith('/creators/audio-calls')) return 'Creator Audio Calls';
    if (path.startsWith('/creators/video-calls')) return 'Creator Video Calls';
    if (path.startsWith('/creators/analytics')) return 'Creator Analytics';
    if (path.startsWith('/creators/dashboard')) return 'Creator Dashboard';
    if (path.startsWith('/creators/messages')) return 'Creator Messages';
    if (path.startsWith('/creators/ppv-content')) return 'Creator PPV Content';
    if (path.startsWith('/creators/content')) return 'Creator Content';
    return pathToTab[path] || 'Discover Feed';
  };

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Determine initial tab from current pathname
  const initialPath = window.location.pathname;
  const [activeTab, setActiveTabState] = useState(getTabFromPath(initialPath));

  // Wrapper function to update state and push history
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const path = tabToPath[tab] || '/discover';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      const matchingTab = getTabFromPath(path);
      setActiveTabState(matchingTab);
    }
  };

  // Listen to popstate event (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const matchingTab = getTabFromPath(currentPath);
      setActiveTabState(matchingTab);
      setCurrentPath(currentPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Load user profile and wallet balance if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        api.setToken(token);
        try {
          // Fetch balance
          const balanceRes = await api.get('/wallet/balance');
          setBalance(balanceRes.balanceCoins);
          
          // Fetch profile details
          const meRes = await api.get('/auth/me');
          setUser({
            id: meRes.user.id,
            username: meRes.user.username,
            displayName: meRes.user.displayName,
            email: meRes.user.email,
            avatarUrl: meRes.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            role: meRes.user.role
          });
        } catch (err) {
          console.error('Failed to restore session:', err);
          // If token expired/invalid, clear it
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Auto-login with seeded credentials if no user is logged in
  useEffect(() => {
    const autoLogin = async () => {
      if (!token && !user) {
        setLoading(true);
        try {
          console.log('Attempting auto-login with seeded user...');
          const loginRes = await api.post('/auth/login', {
            email: 'johnn@example.com',
            password: 'password123'
          });
          
          if (loginRes.status === 'success') {
            api.setToken(loginRes.token);
            setToken(loginRes.token);
            setUser({
              id: loginRes.user.id,
              email: loginRes.user.email,
              role: loginRes.user.role,
              username: loginRes.user.username,
              displayName: loginRes.user.displayName,
              avatarUrl: loginRes.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
            });
            // Fetch balance
            const balanceRes = await api.get('/wallet/balance');
            setBalance(balanceRes.balanceCoins);
          }
        } catch (err) {
          console.error('Auto-login failed:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    autoLogin();
  }, [token, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      
      const balanceRes = await api.get('/wallet/balance');
      setBalance(balanceRes.balanceCoins);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    api.setToken('');
    setToken('');
    setUser(null);
    setBalance(0);
  };

  const refreshBalance = async () => {
    if (token) {
      try {
        const balanceRes = await api.get('/wallet/balance');
        setBalance(balanceRes.balanceCoins);
      } catch (err) {
        console.error('Failed to refresh balance:', err);
      }
    }
  };

  const addCoins = async (amount) => {
    try {
      const res = await api.post('/wallet/add-mock-coins', { coins: amount });
      if (res.status === 'success') {
        setBalance(res.balanceCoins);
        return res.balanceCoins;
      }
    } catch (err) {
      console.error('Failed to add coins:', err);
      throw err;
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
        login,
        logout,
        refreshBalance,
        addCoins
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
