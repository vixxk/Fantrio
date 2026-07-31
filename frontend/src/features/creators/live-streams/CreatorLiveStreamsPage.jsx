import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Radio, Calendar, Play, Eye, TrendingUp, BarChart3, Users, Clock,
  Edit2, MoreVertical, Zap, Check, ChevronDown, ChevronRight,
  MessageSquare, Music, Dumbbell, MoreHorizontal
} from 'lucide-react';
import {
  streamStats, upcomingStreams, recentStreams,
  streamCategories, topStreamers, quickStats, streamOptions
} from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './CreatorLiveStreamsPage.module.css';

const categoryIconMap = {
  MessageSquare,
  Music,
  Dumbbell,
  MoreHorizontal,
  Radio,
};

export const CreatorLiveStreamsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('goLive');
  const [streamTitle, setStreamTitle] = useState('');
  const [entryPrice, setEntryPrice] = useState('5.00');
  const [freeForSubs, setFreeForSubs] = useState(false);

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>

          {/* Go Live / Schedule Tabs */}
          <div className={styles.streamCard}>
            <div className={styles.streamTabsRow}>
              <button
                className={`${styles.streamTab} ${activeTab === 'goLive' ? styles.streamTabActive : ''}`}
                onClick={() => setActiveTab('goLive')}
              >
                Go Live Now
              </button>
              <button
                className={`${styles.streamTab} ${activeTab === 'schedule' ? styles.streamTabActive : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Schedule Stream
              </button>
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
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
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
                  <div className={`${styles.startOption} ${activeTab === 'goLive' ? styles.startOptionActive : ''}`}>
                    <div className={`${styles.startOptionRadio} ${activeTab === 'goLive' ? styles.startOptionRadioActive : ''}`}>
                      {activeTab === 'goLive' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Zap size={16} className={styles.startOptionIcon} />
                        {streamOptions.startGoLiveLabel}
                      </div>
                      <span className={styles.startOptionDesc}>{streamOptions.startGoLiveDesc}</span>
                    </div>
                  </div>
                  <div className={`${styles.startOption} ${activeTab === 'schedule' ? styles.startOptionActive : ''}`}>
                    <div className={`${styles.startOptionRadio} ${activeTab === 'schedule' ? styles.startOptionRadioActive : ''}`}>
                      {activeTab === 'schedule' && <Check size={14} />}
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

                <button
                  className={styles.startNowBtn}
                  onClick={() => {
                    if (activeTab === 'goLive') {
                      alert('Starting live stream now!');
                    } else {
                      alert('Stream scheduled!');
                    }
                  }}
                >
                  {activeTab === 'goLive' ? 'Go Live Now' : 'Schedule Stream'}
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Streams */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Streams</h2>
              <button className={styles.viewCalendarBtn}>View Calendar</button>
            </div>
            <div className={styles.upcomingCard}>
              <div className={`${styles.upcomingList} ${styles.hideMobile}`}>
                {upcomingStreams.map((stream) => (
                  <div key={stream.id} className={styles.upcomingItem}>
                    <div className={styles.upcomingItemTop}>
                      <img src={stream.thumbnail} alt={stream.title} className={styles.upcomingThumb} />
                      <div className={styles.upcomingInfo}>
                        <div className={styles.upcomingTitleRow}>
                          <span className={styles.upcomingTitle}>{stream.title}</span>
                          <span className={styles.scheduledBadge}>{stream.status}</span>
                        </div>
                        <span className={styles.upcomingDate}>{stream.date}</span>
                        <span className={styles.upcomingCategory}>
                          <span className={styles.categoryDot} style={{ background: stream.categoryColor }} />
                          {stream.category}
                        </span>
                      </div>
                      <div className={styles.upcomingRight}>
                        <div className={styles.upcomingPrice}>
                          <div className={styles.entryPriceLabel}>Entry Price</div>
                          <div className={styles.entryPriceValue}>{stream.entryPrice}</div>
                        </div>
                        <div className={styles.upcomingActions}>
                          <button className={styles.editBtn}>Edit</button>
                          <button className={styles.moreBtn}><MoreVertical size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Upcoming Streams Cards */}
              <div className={`${styles.upcomingMobileList} ${styles.showMobile}`}>
                {upcomingStreams.map((stream) => (
                  <article key={stream.id} className={styles.mobileUpcomingCard}>
                    <div className={styles.mobileUpcomingTop}>
                      <img src={stream.thumbnail} alt={stream.title} className={styles.mobileUpcomingThumb} />
                      <div className={styles.mobileUpcomingContent}>
                        <div className={styles.mobileUpcomingTitleRow}>
                          <span className={styles.mobileUpcomingTitle}>{stream.title}</span>
                          <span className={styles.scheduledBadge}>{stream.status}</span>
                        </div>
                        <div className={styles.mobileRecentMetaRow}>
                          <span className={styles.mobileRecentMeta}>{stream.date}</span>
                          <span className={styles.mobileRecentCategory} style={{ color: stream.categoryColor }}>
                            {stream.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.mobileUpcomingFooter}>
                      <div className={styles.mobileUpcomingPrice}>
                        <span className={styles.mobileUpcomingPriceLabel}>Entry Price</span>
                        <span className={styles.mobileUpcomingPriceValue}>{stream.entryPrice}</span>
                      </div>
                      <div className={styles.mobileUpcomingActions}>
                        <button className={styles.actionBtn}><Edit2 size={13} /></button>
                        <button className={styles.actionBtn}><MoreVertical size={13} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button className={styles.viewAllLink}>View All Upcoming Streams</button>
            </div>
          </div>

          {/* Recent Streams */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Streams</h2>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.recentTableCard}>
              <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
                <table className={styles.contentTable}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Stream Title</th>
                      <th className={styles.th}>Category</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Duration</th>
                      <th className={styles.th}>Views</th>
                      <th className={styles.th}>Earnings</th>
                      <th className={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStreams.map((stream) => (
                      <tr key={stream.id} className={styles.tableRow}>
                        <td className={styles.td}>
                          <div className={styles.streamInfo}>
                            <img src={stream.thumbnail} alt={stream.title} className={styles.streamThumb} />
                            <span className={styles.streamTitle}>{stream.title}</span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.categoryBadge}>
                            <span className={styles.categoryDot} style={{ background: stream.categoryColor }} />
                            {stream.category}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.dateText}>{stream.date}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.durationText}>{stream.duration}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.viewsText}>{stream.views}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.earningsValue}>{stream.earnings}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actions}>
                            <button className={styles.actionBtn}><TrendingUp size={14} /></button>
                            <button className={styles.actionBtn}><MoreVertical size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Recent Streams Cards */}
              <div className={`${styles.mobileRecentList} ${styles.showMobile}`}>
                {recentStreams.map((stream) => (
                  <article key={stream.id} className={styles.mobileRecentCard}>
                    <div className={styles.mobileRecentTop}>
                      <div className={styles.mobileRecentThumbCol}>
                        <img src={stream.thumbnail} alt={stream.title} className={styles.mobileRecentThumb} />
                      </div>
                      <div className={styles.mobileRecentContent}>
                        <div className={styles.mobileRecentTitleRow}>
                          <span className={styles.mobileRecentTitle}>{stream.title}</span>
                          <div className={styles.mobileRecentActions}>
                            <button className={styles.actionBtn}><TrendingUp size={13} /></button>
                            <button className={styles.actionBtn}><MoreVertical size={13} /></button>
                          </div>
                        </div>
                        <div className={styles.mobileRecentMetaRow}>
                          <span className={styles.mobileRecentMeta}>
                            {stream.duration} • {stream.date}
                          </span>
                          <span className={styles.mobileRecentCategory} style={{ color: stream.categoryColor }}>
                            {stream.category}
                          </span>
                        </div>
                        <div className={styles.mobileRecentStatsRow}>
                          <div className={styles.mobileRecentStats}>
                            <div className={styles.mobileStatItem}>
                              <Eye size={11} />
                              <span>{stream.views} views</span>
                            </div>
                          </div>
                          <span className={styles.mobileRecentEarnings}>{stream.earnings}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button className={styles.viewAllLink}>View All Recent Streams</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>

          {/* Stream Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Stream Overview</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.overviewGrid}>
              {streamStats.map((stat, idx) => (
                <div key={idx} className={styles.overviewStat}>
                  <span className={styles.overviewStatLabel}>{stat.label}</span>
                  <div className={styles.overviewStatRow}>
                    <span className={styles.overviewStatValue}>{stat.value}</span>
                    {stat.change && (
                      <span className={`${styles.overviewStatChange} ${styles.positive}`}>
                        ↑ {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.viewAnalyticsBtn}
              onClick={() => navigateTo('/creators/analytics')}
            >
              View Analytics
            </button>
          </div>

          {/* Stream Categories */}
          <div className={styles.categoriesCard}>
            <div className={styles.categoriesHeader}>
              <h3 className={styles.categoriesTitle}>Stream Categories</h3>
              <button className={styles.manageLink}>Manage</button>
            </div>
            <div className={styles.categoriesList}>
              {streamCategories.map((cat, idx) => (
                <div key={idx} className={styles.categoryItem}>
                  <div className={styles.categoryItemLeft}>
                    <div className={styles.categoryIconWrap} style={{ background: `${cat.color}20` }}>
                      {(() => { const Icon = categoryIconMap[cat.icon] || Radio; return <Icon size={16} style={{ color: cat.color }} />; })()}
                    </div>
                    <div className={styles.categoryInfo}>
                      <span className={styles.categoryName}>{cat.label}</span>
                      <span className={styles.categoryCount}>{cat.count} streams</span>
                    </div>
                  </div>
                  <div className={styles.categoryRight}>
                    <span className={styles.categoryPercentage}>{cat.percentage}%</span>
                    <div className={styles.categoryProgressBar}>
                      <div
                        className={styles.categoryProgressFill}
                        style={{ width: `${cat.percentage}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Streamers */}
          <div className={styles.topCard}>
            <div className={styles.topHeader}>
              <h3 className={styles.topTitle}>Top Streamers (You)</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.topList}>
              {topStreamers.map((stream, idx) => (
                <div key={stream.id} className={styles.topItem}>
                  <span className={styles.topRank}>{idx + 1}</span>
                  <div className={styles.topInfo}>
                    <span className={styles.topItemTitle}>{stream.title}</span>
                    <span className={styles.topItemCategory}>{stream.category}</span>
                  </div>
                  <div className={styles.topEarnings}>
                    <span className={styles.topEarningsLabel}>Earnings</span>
                    <span className={styles.topEarningsValue}>{stream.earnings}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.viewAllStreamsBtn}>View All Streams</button>
          </div>

          {/* Quick Stats */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <h3 className={styles.statsTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.statsGrid}>
              {quickStats.map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statRow}>
                    <span className={styles.statValue}>{stat.value}</span>
                    <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.positive : styles.negative}`}>
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
