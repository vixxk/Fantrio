import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './features/sidebar/Sidebar';
import { Header } from './features/header/Header';
import { Stories } from './features/stories/Stories';
import { LiveStreams } from './features/live/LiveStreams';
import { LiveStreamsPage } from './features/live/LiveStreamsPage';
import { Feed } from './features/feed/Feed';
import { SuggestionsSidebar } from './features/suggestions/SuggestionsSidebar';
import { Banner } from './features/banner/Banner';
import { AllCreators } from './features/creators/AllCreators';
import { AudioCallsPage } from './features/audio/AudioCallsPage';
import { VideoCallsPage } from './features/video/VideoCallsPage';
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';
import { Menu, X, Compass, Radio, Phone, MessageSquare, User } from 'lucide-react';
import './App.css';

const AppContent = () => {
  const { darkMode, activeTab, setActiveTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className={`appShell ${darkMode ? 'darkTheme' : 'lightTheme'}`}>
      {/* Desktop Left Sidebar */}
      <div className="desktopSidebar">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="mobileSidebarOverlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobileSidebarDrawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobileSidebarCloseRow">
              <button className="closeMenuBtn" onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mainArea">
        <div className="headerWrapper">
          {/* Mobile hamburger menu */}
          <button className="mobileMenuToggle" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Header />
        </div>

        <main className="scrollableContent">
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobileBottomNav">
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
