import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './features/sidebar/Sidebar';
import { CreatorSidebar } from './features/sidebar/CreatorSidebar';
import { Header } from './features/header/Header';
import { Stories } from './features/users/stories/Stories';
import { LiveStreams } from './features/users/live/LiveStreams';
import { LiveStreamsPage } from './features/users/live/LiveStreamsPage';
import { Feed } from './features/users/feed/Feed';
import { SuggestionsSidebar } from './features/users/suggestions/SuggestionsSidebar';
import { Banner } from './features/users/banner/Banner';
import { AllCreators } from './features/creators/AllCreators';
import { AnalyticsPage } from './features/creators/analytics/AnalyticsPage';
import { LiveCallsPage as CreatorLiveCallsPage } from './features/creators/live-calls/LiveCallsPage';
import { AudioCallsPage as CreatorAudioCallsPage } from './features/creators/audio-calls/AudioCallsPage';
import { VideoCallsPage as CreatorVideoCallsPage } from './features/creators/video-calls/VideoCallsPage';
import { ProfilePage } from './features/creators/profile/ProfilePage';
import { ContentPage } from './features/creators/content/ContentPage';
import { DashboardPage } from './features/creators/dashboard/DashboardPage';
import { CreatorMessagesPage } from './features/creators/messages/CreatorMessagesPage';
import { PPVContentPage } from './features/creators/ppv-content/PPVContentPage';
import { AudioCallsPage } from './features/users/audio/AudioCallsPage';
import { VideoCallsPage } from './features/users/video/VideoCallsPage';
import { SubscriptionsPage } from './features/users/subscriptions/SubscriptionsPage';
import { MessagesPage } from './features/users/messages/MessagesPage';
import { BuyCoinsPage } from './features/users/coins/BuyCoinsPage';
import { SettingsPage } from './features/users/settings/SettingsPage';
import { MorePage } from './features/users/more/MorePage';
import { AdminPage } from './features/admin/AdminPage';
import { AdminLogin } from './features/admin/AdminLogin';
import { Menu, X, Compass, Radio, Phone, MessageSquare, User } from 'lucide-react';
import './App.css';

const AppContent = () => {
  const { darkMode, activeTab, setActiveTab, currentPath, user } = useApp();
  const isCreatorPage = activeTab.startsWith('Creator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    lastScrollY.current = 0;
    setShowBottomNav(true);
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

  const isChatOpen = (activeTab === 'Messages' || activeTab === 'Creator Messages') && currentPath && currentPath.split('/').filter(Boolean).length > 1;

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
        return (
          <div className="tabMessages">
            <MessagesPage />
          </div>
        );
      case 'Buy Coins':
        return (
          <div className="tabBuyCoins">
            <BuyCoinsPage />
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

  if (activeTab === 'Admin Panel') {
    if (!user || user.role !== 'admin') {
      return <AdminLogin />;
    }
    return <AdminPage />;
  }

  return (
    <div className={`appShell ${darkMode ? 'darkTheme' : 'lightTheme'}`}>
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Desktop Left Sidebar */}
      <div className="desktopSidebar">
        {isCreatorPage ? <CreatorSidebar /> : <Sidebar />}
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
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
        <div className="headerWrapper">
          <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        </div>

        <main className={`scrollableContent ${activeTab === 'Messages' || activeTab === 'Creator Messages' ? 'noScroll' : ''}`}>
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`mobileBottomNav ${(!showBottomNav || isChatOpen || mobileMenuOpen) ? 'bottomNavHidden' : ''}`}>
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
          <span>Chats</span>
        </button>
      </nav>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
