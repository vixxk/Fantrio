import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Phone, Video, MessageSquareText, Lock, Globe, CircleDot, FolderOpen,
  ChevronDown, ChevronUp, Play, ArrowRight, Eye, Heart, MoreVertical,
  Zap, Calendar, Radio, Check
} from 'lucide-react';
import {
  quickActions, streamOptions, createContentCards,
  recentContentTabs, recentContent, earningsOverview,
  upcomingStreams, quickStats
} from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './DashboardPage.module.css';

const iconMap = {
  Phone, Video, MessageSquareText, Lock, Globe, CircleDot, FolderOpen,
};

export const DashboardPage = () => {
  const { darkMode, navigateTo, setActiveTab } = useApp();
  const [activeContentTab, setActiveContentTab] = useState('All');
  const [streamType, setStreamType] = useState('goLive');
  const [entryPrice, setEntryPrice] = useState('5.00');
  const [freeForSubs, setFreeForSubs] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [selectedScheduleType, setSelectedScheduleType] = useState('');

  const filteredRecent = recentContent.filter((item) => {
    if (activeContentTab === 'All') return true;
    if (activeContentTab === 'Open') return item.status === 'Open';
    if (activeContentTab === 'Locked') return item.status === 'Locked';
    if (activeContentTab === 'Stories') return item.type === 'Story';
    return true;
  });

  return (
    <div className={`${styles.dashboardContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>

          {/* Quick Actions */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.quickActionsGrid}>
              {quickActions.map((action) => {
                const Icon = iconMap[action.icon];
                return (
                  <div key={action.id} className={styles.quickActionCard}>
                    <div className={styles.quickActionTop}>
                      <div className={styles.quickActionIconWrap} style={{ background: `${action.color}20` }}>
                        <Icon size={24} style={{ color: action.color }} />
                      </div>
                      <div className={styles.quickActionInfo}>
                        <div className={styles.quickActionHeaderRow}>
                          <h3 className={styles.quickActionTitle}>{action.title}</h3>
                          {action.isOnline && (
                            <div className={styles.onlineStatus}>
                              <span className={styles.onlineDot} /> Online
                            </div>
                          )}
                        </div>
                        {action.rate && (
                          <p className={styles.quickActionRate}>
                            Your rate: <strong style={{ color: action.color }}>{action.rate}</strong> {action.rateUnit}
                          </p>
                        )}
                        {action.badge && (
                          <span className={styles.quickActionBadge} style={{ background: action.color }}>{action.badge}</span>
                        )}
                        {action.description && (
                          <p className={styles.quickActionDesc}>{action.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={styles.quickActionButtons}>
                      {action.isOnline ? (
                        <>
                          <button className={styles.goLiveBtn} style={{ background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 90%, #ffffff 100%)` }}>
                            {action.goLiveBtnLabel}
                          </button>
                          <button className={styles.editRateBtn} style={{ borderColor: `${action.color}80`, color: action.color }}>{action.editRateLabel}</button>
                        </>
                      ) : (
                        <button className={styles.openMessagesBtn} style={{ background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 90%, #ffffff 100%)` }}>{action.actionLabel}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Go Stream Live */}
          <div className={styles.section}>
            <div className={styles.streamHeader}>
              <div className={styles.streamHeaderLeft}>
                <h2 className={styles.sectionTitle}>Go Stream Live</h2>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.streamSubtitle}>Go live and charge for entry</span>
              </div>
            </div>

            <div className={styles.streamBody}>
              {/* Stream Preview */}
              <div className={styles.streamPreview}>
                <div className={styles.streamPreviewInner}>
                  <div className={styles.liveBadge}>
                    <Radio size={10} /> LIVE
                  </div>
                  <div className={styles.playButton}>
                    <Play size={28} fill="white" />
                  </div>
                </div>
              </div>

              {/* Stream Form */}
              <div className={styles.streamForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stream Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder={streamOptions.defaultTitle}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Entry Price</label>
                  <div className={styles.priceInputGroup}>
                    <span className={styles.pricePrefix}>$</span>
                    <input
                      type="text"
                      className={styles.priceInput}
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                    />
                    <span className={styles.currencyLabel}>USD</span>
                  </div>
                  <p className={styles.formHint}>Fans will pay ${entryPrice} to join your stream</p>
                </div>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>{streamOptions.freeForSubscribersLabel}</span>
                    <span className={styles.toggleDesc}>{streamOptions.freeForSubscribersDesc}</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={freeForSubs}
                      onChange={() => setFreeForSubs(!freeForSubs)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {/* Start Options */}
              <div className={styles.startOptionsSection}>
                <label className={styles.formLabel}>Start</label>
                <div className={styles.startOptions}>
                  <div 
                    className={styles.startOption}
                    onClick={() => setStreamType('goLive')}
                  >
                    <div className={`${styles.startOptionRadio} ${streamType === 'goLive' ? styles.startOptionActive : ''}`}>
                      {streamType === 'goLive' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Zap size={16} className={styles.startOptionIcon} />
                        {streamOptions.startGoLiveLabel}
                      </div>
                      <span className={styles.startOptionDesc}>{streamOptions.startGoLiveDesc}</span>
                    </div>
                  </div>
                  <div 
                    className={styles.startOption}
                    onClick={() => setStreamType('schedule')}
                  >
                    <div className={`${styles.startOptionRadio} ${streamType === 'schedule' ? styles.startOptionActive : ''}`}>
                      {streamType === 'schedule' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Calendar size={16} className={styles.startOptionIcon} />
                        {streamOptions.scheduleForLaterLabel}
                      </div>
                      <span className={styles.startOptionDesc}>{streamOptions.scheduleForLaterDesc}</span>
                    </div>
                  </div>
                </div>

                {/* Smaller Start/Schedule Stream Button */}
                <button 
                  className={styles.startNowBtn}
                  onClick={() => {
                    if (streamType === 'goLive') {
                      alert('Starting live stream now!');
                    } else {
                      // Show schedule popup
                      setShowSchedulePopup(true);
                    }
                  }}
                >
                  {streamType === 'goLive' ? 'Start Stream' : 'Schedule Stream'}
                </button>

                {/* Schedule Popup */}
                <div className={`${styles.popupOverlay} ${showSchedulePopup ? styles.active : ''}`}>
                  <div className={styles.popupContainer}>
                    <div className={styles.popupHeader}>
                      <h3 className={styles.popupTitle}>Schedule Stream</h3>
                      <button 
                        className={styles.popupClose}
                        onClick={() => setShowSchedulePopup(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.popupContent}>
                      <div className={`${styles.popupOption} ${selectedScheduleType === 'later' ? styles.selected : ''}`}
                        onClick={() => setSelectedScheduleType('later')}
                      >
                        <div className={styles.popupOptionIcon}>
                          <Calendar size={20} />
                        </div>
                        <div className={styles.popupOptionInfo}>
                          <div className={styles.popupOptionTitle}>Schedule for Later</div>
                          <div className={styles.popupOptionDesc}>Pick date and time for your stream</div>
                        </div>
                        {selectedScheduleType === 'later' && (
                          <div className={styles.popupOptionSelected}>
                            ✓
                          </div>
                        )}
                      </div>

                      <div className={`${styles.popupOption} ${selectedScheduleType === 'custom' ? styles.selected : ''}`}
                        onClick={() => setSelectedScheduleType('custom')}
                      >
                        <div className={styles.popupOptionIcon}>
                          <Calendar size={20} />
                        </div>
                        <div className={styles.popupOptionInfo}>
                          <div className={styles.popupOptionTitle}>Custom Schedule</div>
                          <div className={styles.popupOptionDesc}>Set specific stream times and timezone</div>
                        </div>
                        {selectedScheduleType === 'custom' && (
                          <div className={styles.popupOptionSelected}>
                            ✓
                          </div>
                        )}
                      </div>

                      {selectedScheduleType && (
                        <div className={styles.popupScheduleDetails}>
                          <p><strong>Selected:</strong> {selectedScheduleType === 'later' ? 'Schedule for Later' : 'Custom Schedule'}</p>
                          <p><strong>Stream entry fee:</strong> ${entryPrice}</p>
                          <p><strong>Status:</strong> {streamType === 'schedule' ? 'Scheduled' : 'Queued'}</p>
                          <p><strong>Reminder:</strong> You'll receive a notification 15 minutes before your scheduled stream</p>
                        </div>
                      )}
                    </div>
                    <div className={styles.popupFooter}>
                      <button 
                        className={styles.popupCancelBtn}
                        onClick={() => setShowSchedulePopup(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        className={styles.popupSaveBtn}
                        onClick={() => {
                          console.log('Stream scheduled:', {
                            type: 'scheduled',
                            streamType,
                            entryPrice,
                            freeForSubs,
                            scheduleType: selectedScheduleType,
                            status: 'scheduled'
                          });
                          setShowSchedulePopup(false);
                        }}
                      >
                        Confirm Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Content */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Create Content</h2>
            <div className={styles.createContentGrid}>
              {createContentCards.map((card) => {
                const Icon = iconMap[card.icon];
                return (
                  <div key={card.id} className={styles.createContentCard}>
                    <div className={styles.createCardTop}>
                      <div className={styles.createCardIconWrap} style={{ background: `${card.color}20` }}>
                        <Icon size={20} style={{ color: card.color }} />
                      </div>
                      <div className={styles.createCardInfo}>
                        <h3 className={styles.createCardTitle}>{card.title}</h3>
                        <p className={styles.createCardDesc}>{card.description}</p>
                      </div>
                    </div>
                    <div className={styles.createCardButtons}>
                      {card.buttons.map((btn) => (
                        <button key={btn.label} className={styles.createCardBtn}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Content */}
          <div className={styles.section}>
            <div className={styles.recentHeader}>
              <h2 className={styles.sectionTitle}>Recent Content</h2>
              <button
                className={styles.viewAllLink}
                onClick={() => setActiveTab('Creator Content')}
              >
                View All
              </button>
            </div>
            <div className={styles.recentTabs}>
              {recentContentTabs.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.recentTab} ${activeContentTab === tab ? styles.recentTabActive : ''}`}
                  onClick={() => setActiveContentTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className={styles.recentGrid}>
              {filteredRecent.map((item) => (
                <div key={item.id} className={styles.recentCard}>
                  <div className={styles.recentThumbWrap}>
                    <img src={item.thumbnail} alt={item.title} className={styles.recentThumb} />
                    <span className={`${styles.recentStatusBadge} ${item.status === 'Open' ? styles.statusOpen : styles.statusLocked}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentTitle}>{item.title}</span>
                    <span className={styles.recentMeta}>
                      {item.type} • {item.timeAgo}
                    </span>
                    {item.price && <span className={styles.recentPrice}>{item.price}</span>}
                  </div>
                  <div className={styles.recentFooter}>
                    <span className={styles.recentStat}><Eye size={12} /> {item.views}</span>
                    <span className={styles.recentStat}><Heart size={12} /> {item.likes}</span>
                    <button className={styles.recentMoreBtn}><MoreVertical size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>

          {/* Earnings Overview */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Earnings Overview</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.earningsList}>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Total Earnings</span>
                <span className={styles.earningsValue}>{earningsOverview.totalEarnings}</span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Pending</span>
                <span className={styles.earningsPending}>{earningsOverview.pending}</span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Paid Out</span>
                <span className={styles.earningsPaidOut}>{earningsOverview.paidOut}</span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Total Calls (mins)</span>
                <span className={styles.earningsCalls}>{earningsOverview.totalCallsMinutes}</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn}>View Earnings</button>
          </div>

          {/* Upcoming Streams */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Upcoming Streams</h3>
              <button className={styles.viewAllSmall}>View All</button>
            </div>
            <div className={styles.streamsList}>
              {upcomingStreams.map((stream) => (
                <div key={stream.id} className={styles.streamItem}>
                  <img src={stream.thumbnail} alt={stream.title} className={styles.streamThumb} />
                  <div className={styles.streamInfo}>
                    <span className={styles.streamTitle}>{stream.title}</span>
                    <span className={styles.streamDate}>{stream.date}</span>
                  </div>
                  <span className={`${styles.streamPrice} ${stream.price === 'Free' ? styles.streamPriceFree : ''}`}>
                    {stream.price}
                  </span>
                </div>
              ))}
            </div>
            <button className={styles.viewStreamsBtn}>View All Streams</button>
          </div>

          {/* Quick Stats */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.statsGrid}>
              {quickStats.stats.map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statRow}>
                    <span className={styles.statValue}>{stat.value}</span>
                    <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.statPositive : styles.statNegative}`}>
                      ↑ {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
