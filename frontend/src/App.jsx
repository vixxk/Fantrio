import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './features/sidebar/Sidebar';
import { CreatorSidebar } from './features/sidebar/CreatorSidebar';
import { Header } from './features/header/Header';
import { Stories } from './features/fans/stories/Stories';
import { LiveStreams } from './features/fans/live/LiveStreams';
import { LiveStreamsPage } from './features/fans/live/LiveStreamsPage';
import { Feed } from './features/fans/feed/Feed';
import { PostDetailPage } from './features/fans/posts/PostDetailPage';
import { SuggestionsSidebar } from './features/fans/suggestions/SuggestionsSidebar';
import { Banner } from './features/fans/banner/Banner';
import { AllCreators } from './features/creators/AllCreators';
import { AnalyticsPage } from './features/creators/analytics/AnalyticsPage';
import { LiveCallsPage as CreatorLiveCallsPage } from './features/creators/live-calls/LiveCallsPage';
import { AudioCallsPage as CreatorAudioCallsPage } from './features/creators/audio-calls/AudioCallsPage';
import { VideoCallsPage as CreatorVideoCallsPage } from './features/creators/video-calls/VideoCallsPage';
import { ProfilePage } from './features/creators/profile/ProfilePage';
import { ContentPage } from './features/creators/content/ContentPage';
import { DashboardPage } from './features/creators/dashboard/DashboardPage';
import { CreatorMessagesPage } from './features/creators/messages/CreatorMessagesPage';
import { CreatorMobileChatPage } from './features/creators/messages/CreatorMobileChatPage';
import { PPVContentPage } from './features/creators/ppv-content/PPVContentPage';
import { SubscribersPage } from './features/creators/subscribers/SubscribersPage';
import { CreatorLiveStreamsPage } from './features/creators/live-streams/CreatorLiveStreamsPage';
import { EarningsPage } from './features/creators/earnings/EarningsPage';
import { StorePage } from './features/creators/store/StorePage';
import { CreatorSettingsPage } from './features/creators/settings/CreatorSettingsPage';
import { AnnouncementsPage } from './features/fans/more/AnnouncementsPage';
import { AudioCallsPage } from './features/fans/audio/AudioCallsPage';
import { VideoCallsPage } from './features/fans/video/VideoCallsPage';
import { SubscriptionsPage } from './features/fans/subscriptions/SubscriptionsPage';
import { MessagesPage } from './features/fans/messages/MessagesPage';
import { CreatorProfilePage } from './features/fans/profile/CreatorProfilePage';
import { MobileChatPage } from './features/fans/messages/MobileChatPage';
import { BuyCoinsPage } from './features/fans/coins/BuyCoinsPage';
import { TransactionHistoryPage } from './features/fans/transactions/TransactionHistoryPage';
import { SettingsPage } from './features/fans/settings/SettingsPage';
import { MorePage } from './features/fans/more/MorePage';
import { AdminPage } from './features/admin/AdminPage';
import { AdminLogin } from './features/admin/AdminLogin';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { IncomingCallProvider } from './features/calls/IncomingCallProvider';
import { ToastProvider } from './components/Toast/Toast';
import { NewMessageNotifier } from './components/NewMessageNotifier/NewMessageNotifier';
import { UnlockNotifier } from './components/UnlockNotifier/UnlockNotifier';
import { AppDialogProvider } from './components/AppDialog/AppDialog';
import { Compass, Radio, Phone, MessageSquare, LayoutDashboard, PenSquare } from 'lucide-react';
import './App.css';

const AppContent = () => {
  const { darkMode, activeTab, setActiveTab, currentPath, user, loading, navigateTo, replacePath, unreadConversations } = useApp();
  const isCreatorPage = activeTab.startsWith('Creator');
  const isFullScreenPage = activeTab === 'Public Creator Profile' || activeTab === 'Listener Profile';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const lastScrollY = useRef(0);
  // Pulse the mobile nav unread badge when the unread-conversations counter
  // goes up (a new message arrived) — cleared once the animation runs.
  const [navBadgePulse, setNavBadgePulse] = useState(false);
  const prevUnreadRef = useRef(unreadConversations);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (!target || typeof target.scrollTop !== 'number') return;
      
      const currentScrollY = target.scrollTop;
      
      // Ignore tiny scroll changes
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
      
      if (currentScrollY <= 10) {
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  // When the unread-conversations counter increases, flash the nav badge so
  // the new message is noticeable even when the user is on another page.
  // The first run (initial count load) is skipped so the badge only pulses on
  // genuine increases.
  const firstUnreadCheck = useRef(true);
  useEffect(() => {
    if (firstUnreadCheck.current) {
      firstUnreadCheck.current = false;
      prevUnreadRef.current = unreadConversations;
      return;
    }
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unreadConversations;
    if (unreadConversations > prev) {
      setNavBadgePulse(true);
      const t = setTimeout(() => setNavBadgePulse(false), 900);
      return () => clearTimeout(t);
    }
  }, [unreadConversations]);

  useEffect(() => {
    Promise.resolve().then(() => {
      lastScrollY.current = 0;
      setShowBottomNav(true);
    });
  }, [activeTab, currentPath]);

  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setShowBottomNav(false);
      }
    };
    const handleBlur = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setShowBottomNav(true);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Hide the mobile bottom nav while viewing an open conversation thread:
  // fan chats use /messages/:id (2 path segments) while creator chats use
  // /creators/messages/:id (3 segments), so each role needs its own depth.
  const pathSegmentCount = (p) => (p ? p.split('/').filter(Boolean).length : 0);
  const isChatOpen =
    (activeTab === 'Messages' && pathSegmentCount(currentPath) > 1) ||
    (activeTab === 'Creator Messages' && pathSegmentCount(currentPath) > 2);

  // Auth page routes: canonical (/login, /signup) + aliases (/auth/login, /auth/signup)
  const isAuthPath = (path) =>
    ['/login', '/signup', '/auth/login', '/auth/signup'].some(
      (p) => path === p || path.startsWith(p + '/')
    );

  // If a logged-in user visits an auth page URL, send them to the app home
  useEffect(() => {
    if (user && isAuthPath(currentPath)) {
      navigateTo(
        user.role === 'admin'
          ? '/admin'
          : user.role === 'creator'
          ? '/creators/dashboard'
          : '/discover'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPath]);

  // Guest on a non-auth route: the login/signup page is rendered below, so make
  // the address bar match what's on screen (e.g. /discover -> /login).
  useEffect(() => {
    if (!loading && !user && !isAuthPath(currentPath)) {
      replacePath('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, currentPath]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Discover Feed':
        return (
          <div className="tabDiscoverFeed">
            <div className="centerContent">
              <Banner />
              <Stories />
              <LiveStreams />
              <Feed />
            </div>
            <div className="rightSidebarContainer">
              <SuggestionsSidebar />
            </div>
          </div>
        );
      case 'Post Detail':
        return (
          <div className="tabPostDetail">
            <PostDetailPage />
          </div>
        );
      case 'Live Streams':
        return (
          <div className="tabLiveStreams">
            <LiveStreamsPage />
          </div>
        );
      case 'All Creators':
        return (
          <div className="tabAllCreators">
            <AllCreators />
          </div>
        );
      case 'Creator Analytics':
        return (
          <div className="tabAnalytics">
            <AnalyticsPage />
          </div>
        );
      case 'Creator Live Calls':
        return (
          <div className="tabAnalytics">
            <CreatorLiveCallsPage />
          </div>
        );
      case 'Creator Audio Calls':
        return (
          <div className="tabAnalytics">
            <CreatorAudioCallsPage />
          </div>
        );
      case 'Creator Video Calls':
        return (
          <div className="tabAnalytics">
            <CreatorVideoCallsPage />
          </div>
        );
      case 'Creator Profile':
        return (
          <div className="tabAnalytics">
            <ProfilePage />
          </div>
        );
      case 'Creator Dashboard':
        return (
          <div className="tabAnalytics">
            <DashboardPage />
          </div>
        );
      case 'Creator Messages':
        if (isMobile && currentPath && currentPath.split('/').filter(Boolean).length > 2) {
          return <CreatorMobileChatPage />;
        }
        return (
          <div className="tabMessages">
            <CreatorMessagesPage />
          </div>
        );
      case 'Creator Content':
        return (
          <div className="tabAnalytics">
            <ContentPage />
          </div>
        );
      case 'Creator PPV Content':
        return (
          <div className="tabAnalytics">
            <PPVContentPage />
          </div>
        );
      case 'Creator Subscribers':
        return (
          <div className="tabAnalytics">
            <SubscribersPage />
          </div>
        );
      case 'Creator Live Streams':
        return (
          <div className="tabAnalytics">
            <CreatorLiveStreamsPage />
          </div>
        );
      case 'Creator Earnings':
        return (
          <div className="tabAnalytics">
            <EarningsPage />
          </div>
        );
      case 'Creator Store':
        return (
          <div className="tabAnalytics">
            <StorePage />
          </div>
        );
      case 'Creator Settings':
        return (
          <div className="tabAnalytics">
            <CreatorSettingsPage />
          </div>
        );
      case 'Creator Announcements':
        return (
          <div className="tabAnalytics">
            <AnnouncementsPage />
          </div>
        );
      case '1:1 Audio Calls':
        return (
          <div className="tabAudioCalls">
            <AudioCallsPage />
          </div>
        );
      case '1:1 Video Calls':
        return (
          <div className="tabVideoCalls">
            <VideoCallsPage />
          </div>
        );
      case 'My Subscription':
        return (
          <div className="tabSubscriptions">
            <SubscriptionsPage />
          </div>
        );
      case 'Messages':
        if (isMobile && currentPath && currentPath.split('/').filter(Boolean).length > 1) {
          return <MobileChatPage />;
        }
        return (
          <div className="tabMessages">
            <MessagesPage />
          </div>
        );
      case 'Public Creator Profile':
      case 'Listener Profile':
        return (
          <div className="tabMessages">
            <CreatorProfilePage key={currentPath} />
          </div>
        );
      case 'Buy Coins':
        return (
          <div className="tabBuyCoins">
            <BuyCoinsPage />
          </div>
        );
      case 'Transaction History':
        return (
          <div className="tabTransactions">
            <TransactionHistoryPage />
          </div>
        );
      case 'Settings':
        return (
          <div className="tabSettings">
            <SettingsPage />
          </div>
        );
      case 'More':
        return (
          <div className="tabMore">
            <MorePage />
          </div>
        );
      case 'Admin Panel':
        return (
          <div className="tabAdmin">
            <AdminPage />
          </div>
        );
      default:
        return (
          <div className="comingSoonContainer">
            <div className="comingSoonCard">
              <h2 className="comingSoonTitle">{activeTab}</h2>
              <p className="comingSoonText">This section is currently under development. Stay tuned!</p>
            </div>
          </div>
        );
    }
  };

  // Boot splash while the session is being restored from storage
  if (loading) {
    return (
      <div className={`authBootScreen ${darkMode ? 'darkTheme' : 'lightTheme'}`}>
        <img src="/Fantrio Logo.png" alt="Fantrio" className="authBootLogo" />
        <span className="authBootSpinner" />
      </div>
    );
  }

  // Logged-in user on an auth page: keep the splash up until the redirect lands
  if (user && isAuthPath(currentPath)) {
    return (
      <div className={`authBootScreen ${darkMode ? 'darkTheme' : 'lightTheme'}`}>
        <img src="/Fantrio Logo.png" alt="Fantrio" className="authBootLogo" />
        <span className="authBootSpinner" />
      </div>
    );
  }

  // Authentication gate — visitors must log in (or sign up) first
  if (!user) {
    const isSignup =
      currentPath.startsWith('/signup') || currentPath.startsWith('/auth/signup');
    return (
      <div className={`authPageRoot ${darkMode ? 'darkTheme' : 'lightTheme'}`}>
        {isSignup ? <SignupPage /> : <LoginPage />}
      </div>
    );
  }

  if (activeTab === 'Admin Panel') {
    if (user.role !== 'admin') {
      return <AdminLogin />;
    }
    return <AdminPage />;
  }

  return (
    <div className={`appShell ${darkMode ? 'darkTheme' : 'lightTheme'} ${isCreatorPage ? 'creatorMode' : ''} ${isFullScreenPage ? 'fullScreenMode' : ''}`}>
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Desktop Left Sidebar — hidden on full-screen pages like Listener Profile */}
      {!isFullScreenPage && (
        <div className="desktopSidebar">
          {isCreatorPage ? <CreatorSidebar /> : <Sidebar />}
        </div>
      )}

      {/* Mobile Drawer Sidebar */}
      {!isFullScreenPage && mobileMenuOpen && (
        <div className="mobileSidebarOverlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobileSidebarDrawer" onClick={(e) => e.stopPropagation()}>
            {isCreatorPage ? (
              <CreatorSidebar onClose={() => setMobileMenuOpen(false)} />
            ) : (
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mainArea">
        {!isFullScreenPage && (
          <div className="headerWrapper">
            <Header onMenuToggle={() => setMobileMenuOpen(true)} />
          </div>
        )}

        <main className={`scrollableContent ${activeTab === 'Messages' || activeTab === 'Creator Messages' ? 'noScroll' : ''}`}>
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar — hidden on full-screen pages */}
      {!isFullScreenPage && (
        <nav className={`mobileBottomNav ${(!showBottomNav || isChatOpen || mobileMenuOpen) ? 'bottomNavHidden' : ''}`}>
        {isCreatorPage ? (
          <>
            <button 
              className={`bottomNavItem ${activeTab === 'Creator Dashboard' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Creator Dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === 'Creator Content' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Creator Content')}
            >
              <PenSquare size={20} />
              <span>Content</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === 'Creator Messages' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Creator Messages')}
            >
              <MessageSquare size={20} />
              {unreadConversations > 0 && (
                <span className={`bottomNavBadge ${navBadgePulse ? 'bottomNavBadgePulse' : ''}`}>{unreadConversations > 99 ? '99+' : unreadConversations}</span>
              )}
              <span>Messages</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === 'Creator Live Calls' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Creator Live Calls')}
            >
              <Phone size={20} />
              <span>Calls</span>
            </button>
          </>
        ) : (
          <>
            <button 
              className={`bottomNavItem ${activeTab === 'Discover Feed' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Discover Feed')}
            >
              <Compass size={20} />
              <span>Discover</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === 'Live Streams' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Live Streams')}
            >
              <Radio size={20} />
              <span>Live</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === '1:1 Audio Calls' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('1:1 Audio Calls')}
            >
              <Phone size={20} />
              <span>Calls</span>
            </button>
            <button 
              className={`bottomNavItem ${activeTab === 'Messages' ? 'bottomActive' : ''}`}
              onClick={() => setActiveTab('Messages')}
            >
              <MessageSquare size={20} />
              {unreadConversations > 0 && (
                <span className={`bottomNavBadge ${navBadgePulse ? 'bottomNavBadgePulse' : ''}`}>{unreadConversations > 99 ? '99+' : unreadConversations}</span>
              )}
              <span>Chats</span>
            </button>
          </>
        )}
      </nav>
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppDialogProvider>
          <IncomingCallProvider>
            <NewMessageNotifier />
            <UnlockNotifier />
            <AppContent />
          </IncomingCallProvider>
        </AppDialogProvider>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
