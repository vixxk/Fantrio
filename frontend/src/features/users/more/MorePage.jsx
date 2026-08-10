import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { 
  LayoutGrid, ChevronRight, ArrowLeft, Ticket, Headphones, 
  HelpCircle, Gift, Shield, ShieldAlert, Megaphone, 
  Lightbulb, Info, CreditCard, FileText, Lock, Plus, ThumbsUp, Check, AlertTriangle,
  User, Wallet, Scale, Trophy, Copy, UserPlus
} from 'lucide-react';
import styles from './MorePage.module.css';

export const MorePage = () => {
  const { darkMode, setActiveTab } = useApp();
  const [subView, setSubView] = useState(null); // 'tickets', 'contact', 'faq', 'referral', 'rewards', 'announcements', 'features', 'about', 'report-creator', 'report-content', 'transactions', 'terms', 'privacy'

  // Sub-view specific states
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [features, setFeatures] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [creators, setCreators] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'general', message: '' });
  const [reportCreatorForm, setReportCreatorForm] = useState({ creatorId: '', reason: 'Inappropriate Content', description: '' });
  const [reportContentForm, setReportContentForm] = useState({ postId: '', reason: 'Copyright Infringement', description: '' });
  const [featureForm, setFeatureForm] = useState({ title: '', description: '' });
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralStats, setReferralStats] = useState({ referralCode: '', referredCount: 0, claimed: false, referredBy: null });
  
  // Accordion faq state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Status messages
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const clearStatus = () => setStatusMsg({ type: '', text: '' });

  // Load data depending on active sub-view
  useEffect(() => {
    if (!subView) return;
    Promise.resolve().then(() => {
      clearStatus();

    const fetchData = async () => {
      setLoading(true);
      try {
        if (subView === 'tickets') {
          const res = await api.get('/more/tickets');
          if (res.status === 'success') setTickets(res.tickets);
        } else if (subView === 'announcements') {
          const res = await api.get('/more/announcements');
          if (res.status === 'success') setAnnouncements(res.announcements);
        } else if (subView === 'features') {
          const res = await api.get('/more/features');
          if (res.status === 'success') setFeatures(res.features);
        } else if (subView === 'faq') {
          const res = await api.get('/settings/faqs');
          if (res.status === 'success') setFaqs(res.faqs || []);
        } else if (subView === 'rewards') {
          const res = await api.get('/more/rewards');
          if (res.status === 'success') setRewards(res.rewards || []);
        } else if (subView === 'report-creator') {
          const res = await api.get('/more/creators');
          if (res.status === 'success') setCreators(res.creators || []);
        } else if (subView === 'report-content') {
          const res = await api.get('/posts?limit=100');
          if (res.status === 'success') setPosts(res.posts || []);
        } else if (subView === 'referral') {
          const res = await api.get('/more/referrals/stats');
          if (res.status === 'success') setReferralStats(res);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setStatusMsg({ type: 'error', text: err.message || 'Failed to load data.' });
      } finally {
        setLoading(false);
      }
    };

      fetchData();
    });
  }, [subView]);

  // Form Submissions
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) return;
    setLoading(true);
    try {
      const res = await api.post('/more/tickets', ticketForm);
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Support ticket submitted successfully!' });
        setTicketForm({ subject: '', category: 'general', message: '' });
        setTimeout(() => setSubView('tickets'), 1500);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit ticket.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReportCreator = async (e) => {
    e.preventDefault();
    if (!reportCreatorForm.creatorId || !reportCreatorForm.reason) return;
    setLoading(true);
    try {
      const res = await api.post('/more/reports', {
        targetType: 'creator',
        targetId: reportCreatorForm.creatorId,
        reason: reportCreatorForm.reason,
        description: reportCreatorForm.description
      });
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Creator report submitted successfully. Our safety team will review it.' });
        setReportCreatorForm({ creatorId: '', reason: 'Inappropriate Content', description: '' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit report.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReportContent = async (e) => {
    e.preventDefault();
    if (!reportContentForm.postId || !reportContentForm.reason) return;
    setLoading(true);
    try {
      const res = await api.post('/more/reports', {
        targetType: 'content',
        targetId: reportContentForm.postId,
        reason: reportContentForm.reason,
        description: reportContentForm.description
      });
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Content report submitted successfully. Our safety team will review it.' });
        setReportContentForm({ postId: '', reason: 'Copyright Infringement', description: '' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit report.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();
    if (!featureForm.title || !featureForm.description) return;
    setLoading(true);
    try {
      const res = await api.post('/more/features', featureForm);
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Feature suggestion submitted successfully!' });
        setFeatureForm({ title: '', description: '' });
        // Refresh features
        const fresh = await api.get('/more/features');
        if (fresh.status === 'success') setFeatures(fresh.features);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit suggestion.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVoteFeature = async (id) => {
    try {
      const res = await api.post(`/more/features/${id}/vote`);
      if (res.status === 'success') {
        setFeatures(prev => prev.map(f => (
          f._id === id ? { ...f, votesCount: res.votesCount, hasVoted: res.hasVoted } : f
        )));
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleClaimReferral = async (e) => {
    e.preventDefault();
    if (!referralCodeInput) return;
    setLoading(true);
    try {
      const res = await api.post('/more/referrals/claim', { code: referralCodeInput });
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: res.message || 'Referral claimed successfully!' });
        setReferralCodeInput('');
        // Reload stats
        const fresh = await api.get('/more/referrals/stats');
        if (fresh.status === 'success') setReferralStats(fresh);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to claim referral.' });
    } finally {
      setLoading(false);
    }
  };



  const handleCopyReferral = async () => {
    if (!referralStats.referralCode) return;
    try {
      await navigator.clipboard.writeText(referralStats.referralCode);
      setStatusMsg({ type: 'success', text: 'Referral code copied to clipboard!' });
    } catch (err) {
      console.error('Failed to copy referral code:', err);
      setStatusMsg({ type: 'error', text: 'Failed to copy referral code.' });
    }
  };



  // Render Sub-Views
  const renderSubViewContent = () => {
    if (loading && subView !== 'features') {
      return (
        <div className={styles.subPageContainer} style={{ width: '100%' }}>
          <div className="skeleton-card" style={{ height: '60px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div className="skeleton-box skeleton-title" style={{ width: '200px', height: '100%' }} />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="skeleton-card" style={{ padding: '1.2rem', marginBottom: '1rem', gap: '0.8rem' }}>
              <div className="skeleton-box skeleton-title" style={{ width: '150px' }} />
              <div className="skeleton-box skeleton-content-line" />
              <div className="skeleton-box skeleton-content-line short" />
            </div>
          ))}
        </div>
      );
    }

    switch (subView) {
      case 'tickets':
        return (
          <div className={styles.subPageContainer}>
            <div className={styles.subPageHeader}>
              <h2 className={styles.subPageTitle}>Support Tickets</h2>
              <button className={styles.actionBtn} onClick={() => setSubView('contact')}>
                <Plus size={16} /> Create Ticket
              </button>
            </div>
            {tickets.length === 0 ? (
              <div className={styles.emptyBox}>
                <Ticket size={48} className={styles.emptyBoxIcon} />
                <p>You have not submitted any support tickets yet.</p>
              </div>
            ) : (
              <div className={styles.ticketsList}>
                {tickets.map(t => (
                  <div key={t._id} className={styles.ticketCard}>
                    <div className={styles.ticketHeader}>
                      <span className={styles.ticketSubject}>{t.subject}</span>
                      <span className={`${styles.statusBadge} ${styles[t.status] || styles.open}`}>{t.status}</span>
                    </div>
                    <p className={styles.ticketMessage}>{t.message}</p>
                    {t.reply ? (
                      <div className={styles.ticketReplyBox}>
                        <strong>Support Response:</strong>
                        <p>{t.reply}</p>
                      </div>
                    ) : null}
                    <div className={styles.ticketFooter}>
                      <span>Category: {t.category}</span>
                      <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Submit Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  required
                  placeholder="Summarize your issue..."
                  value={ticketForm.subject} 
                  onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select 
                  className={styles.formSelect}
                  value={ticketForm.category}
                  onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                >
                  <option value="general">General Inquiry</option>
                  <option value="billing">Billing & Purchases</option>
                  <option value="technical">Technical Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Message Details</label>
                <textarea 
                  rows={6}
                  required
                  className={styles.formTextarea} 
                  placeholder="Describe your issue or question in detail..."
                  value={ticketForm.message} 
                  onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })} 
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        );

      case 'faq':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>FAQ / Help Center</h2>
            {faqs.length === 0 ? (
              <div className={styles.emptyBox}>
                <HelpCircle size={48} className={styles.emptyBoxIcon} />
                <p>No help articles published yet.</p>
              </div>
            ) : (
              <div className={styles.accordionContainer}>
                {faqs.map((faq, idx) => (
                  <div key={faq._id || idx} className={styles.accordionItem}>
                    <button 
                      className={styles.accordionTrigger}
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    >
                      <span>{faq.question}</span>
                      <ChevronRight 
                        size={18} 
                        className={`${styles.accordionChevron} ${expandedFaq === idx ? styles.chevronRotated : ''}`} 
                      />
                    </button>
                    {expandedFaq === idx && (
                      <div className={styles.accordionPanel}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'referral':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Referral Program</h2>
            <div className={styles.referralGrid}>
              <div className={styles.referralPromoCard}>
                <h3>Your Referral Code</h3>
                <div className={styles.referralCodeBox}>{referralStats.referralCode || 'LOAD...'}</div>
                <button type="button" className={styles.copyBtn} onClick={handleCopyReferral}>
                  <Copy size={16} /> Copy Code
                </button>
                <p>Share this code with your friends! They get 50 bonus coins on sign up, and you get 100 bonus coins.</p>
                <div className={styles.referralStatCount}>
                  <span>Friends Referred:</span> <strong>{referralStats.referredCount}</strong>
                </div>
              </div>

              <div className={styles.referralClaimCard}>
                <h3>Claim Friend's Code</h3>
                {referralStats.claimed ? (
                  <div className={styles.alreadyClaimedMsg}>
                    <Check size={20} className={styles.claimedSuccessIcon} />
                    <span>You have already claimed referral bonus code.</span>
                  </div>
                ) : (
                  <form onSubmit={handleClaimReferral} className={styles.claimForm}>
                    <input 
                      type="text" 
                      className={styles.claimInput} 
                      placeholder="ENTER REFERRAL CODE" 
                      required
                      value={referralCodeInput}
                      onChange={e => setReferralCodeInput(e.target.value)}
                    />
                    <button type="submit" disabled={loading} className={styles.claimSubmitBtn}>
                      Claim Bonus
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );

      case 'rewards':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Rewards Program & Milestones</h2>
            <p className={styles.sectionSubtitle}>Unlock rewards by interacting with creators and completing tasks.</p>
            {rewards.length === 0 ? (
              <div className={styles.emptyBox}>
                <Gift size={48} className={styles.emptyBoxIcon} />
                <p>No rewards available right now.</p>
              </div>
            ) : (
              <div className={styles.rewardsList}>
                {rewards.map(r => (
                  <div key={r.type} className={styles.rewardItem}>
                    <div className={styles.rewardIconCol}>
                      <div className={styles.rewardIconBox}>
                        {r.icon === 'user' ? (
                          <UserPlus size={20} className={styles.rewardIcon} />
                        ) : r.icon === 'call' ? (
                          <Headphones size={20} className={styles.rewardIcon} />
                        ) : (
                          <CreditCard size={20} className={styles.rewardIcon} />
                        )}
                      </div>
                    </div>
                    <div className={styles.rewardInfoCol}>
                      <h4>{r.title}</h4>
                      <p>{r.description}</p>
                      <div className={styles.rewardStatusRow}>
                        <span className={`${styles.rewardStatusBadge} ${r.completed ? styles.claimed : styles.unclaimed}`}>
                          {r.completed ? 'Completed' : 'Pending'}
                        </span>
                        <span className={styles.rewardRewardAmount}>+{r.coins} Coins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'announcements':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>System Announcements</h2>
            {announcements.length === 0 ? (
              <div className={styles.emptyBox}>
                <Megaphone size={48} className={styles.emptyBoxIcon} />
                <p>No system announcements published yet.</p>
              </div>
            ) : (
              <div className={styles.announcementsList}>
                {announcements.map(a => (
                  <div key={a._id} className={styles.announcementCard}>
                    <div className={styles.announcementHeader}>
                      <span className={styles.announcementTitle}>{a.title}</span>
                      <span className={`${styles.announcementBadge} ${styles[a.category]}`}>{a.category}</span>
                    </div>
                    <p className={styles.announcementContent}>{a.content}</p>
                    <span className={styles.announcementDate}>
                      Published: {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'features':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Feature Request Board</h2>
            
            {/* Create suggestion box */}
            <div className={styles.featureFormBox}>
              <h3>Submit Feature Suggestion</h3>
              <form onSubmit={handleCreateFeature} className={styles.featureInlineForm}>
                <input 
                  type="text" 
                  className={styles.featureTitleInput} 
                  placeholder="Feature Title (e.g., Add Giphy comments)" 
                  required
                  value={featureForm.title}
                  onChange={e => setFeatureForm({ ...featureForm, title: e.target.value })}
                />
                <textarea 
                  className={styles.featureDescInput} 
                  placeholder="Explain your feature request..." 
                  required
                  value={featureForm.description}
                  onChange={e => setFeatureForm({ ...featureForm, description: e.target.value })}
                />
                <button type="submit" className={styles.featureSubmitBtn}>
                  Submit Idea
                </button>
              </form>
            </div>

            {/* List suggestions */}
            {features.length === 0 ? (
              <div className={styles.emptyBox}>
                <Lightbulb size={48} className={styles.emptyBoxIcon} />
                <p>No feature requests have been submitted yet. Be the first!</p>
              </div>
            ) : (
              <div className={styles.featuresList}>
                {features.map(f => {
                  const hasVoted = !!f.hasVoted;
                  return (
                    <div key={f._id} className={styles.featureCard}>
                      <div className={styles.featureVoteCol}>
                        <button 
                          className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''}`}
                          onClick={() => handleVoteFeature(f._id)}
                        >
                          <ThumbsUp size={16} />
                          <span>{f.votesCount}</span>
                        </button>
                      </div>
                      <div className={styles.featureInfoCol}>
                        <div className={styles.featureHeader}>
                          <span className={styles.featureTitle}>{f.title}</span>
                          <span className={`${styles.featureStatusBadge} ${styles[f.status]}`}>{f.status}</span>
                        </div>
                        <p className={styles.featureDesc}>{f.description}</p>
                        <div className={styles.featureFooter}>
                          <span>Suggested by: {f.userId?.displayName || 'Community User'}</span>
                          <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>About Fantrio</h2>
            <div className={styles.aboutCard}>
              <div className={styles.aboutLogoRow}>
                <img src="/Fantrio Logo.png" alt="Fantrio Logo" className={styles.aboutLogoImg} />
                <span className={styles.aboutLogoText}>Fant<span className={styles.logoTextPink}>rio</span></span>
              </div>
              <p className={styles.aboutDescription}>
                Fantrio is a premier, next-generation social monetization platform connecting digital creators with their most dedicated fans. We facilitate intimate, premium interactions through private 1:1 video/audio calls, subscriber-only content feeds, and real-time messaging, powered by a secure virtual coin economy.
              </p>
              
              <div className={styles.aboutGridDetails}>
                <div className={styles.detailRow}>
                  <span>Client Version:</span> <strong>v1.0.2 (Beta)</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Server API Version:</span> <strong>v1.0.0 (Node/Express)</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Core Tech Stack:</span> <strong>React, Mongoose, Socket.io, WebRTC</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>License:</span> <strong>ISC License</strong>
                </div>
              </div>
            </div>
          </div>
        );

      case 'report-creator':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Report A Creator</h2>
            <form onSubmit={handleCreateReportCreator} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Creator</label>
                <select 
                  className={styles.formSelect} 
                  required
                  value={reportCreatorForm.creatorId}
                  onChange={e => setReportCreatorForm({ ...reportCreatorForm, creatorId: e.target.value })}
                >
                  <option value="">-- Choose Creator --</option>
                  {creators.map(c => (
                    <option key={c.userId} value={c.userId}>
                      {c.displayName} (@{c.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Violation Reason</label>
                <select 
                  className={styles.formSelect}
                  value={reportCreatorForm.reason}
                  onChange={e => setReportCreatorForm({ ...reportCreatorForm, reason: e.target.value })}
                >
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Harassment/Bullying">Harassment / Bullying</option>
                  <option value="Scam/Fraud">Scam / Fraud</option>
                  <option value="Impersonation">Impersonation</option>
                  <option value="Other">Other Violations</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description / Evidence Details</label>
                <textarea 
                  rows={4}
                  className={styles.formTextarea} 
                  placeholder="Provide details or timestamps of the inappropriate behavior..."
                  value={reportCreatorForm.description}
                  onChange={e => setReportCreatorForm({ ...reportCreatorForm, description: e.target.value })}
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Submit Safety Report
              </button>
            </form>
          </div>
        );

      case 'report-content':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Report Inappropriate Content</h2>
            <form onSubmit={handleCreateReportContent} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Post</label>
                {posts.length === 0 ? (
                  <p className={styles.inlineHint}>No posts available to report right now.</p>
                ) : (
                  <select 
                    className={styles.formSelect} 
                    required
                    value={reportContentForm.postId}
                    onChange={e => setReportContentForm({ ...reportContentForm, postId: e.target.value })}
                  >
                    <option value="">-- Choose Post --</option>
                    {posts.map(p => (
                      <option key={p._id} value={p._id}>
                        {String(p.content || 'Untitled post').slice(0, 80)}
                        {p.content && p.content.length > 80 ? '…' : ''}
                        {p.creatorId?.displayName ? ` — ${p.creatorId.displayName}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Violation Reason</label>
                <select 
                  className={styles.formSelect}
                  value={reportContentForm.reason}
                  onChange={e => setReportContentForm({ ...reportContentForm, reason: e.target.value })}
                >
                  <option value="Copyright Infringement">Copyright Infringement</option>
                  <option value="Explicit Content">Explicit Content</option>
                  <option value="Spam/Misleading">Spam / Misleading</option>
                  <option value="Violence/Hate Speech">Violence / Hate Speech</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Additional Context</label>
                <textarea 
                  rows={4}
                  className={styles.formTextarea} 
                  placeholder="Describe why this content violates platform guidelines..."
                  value={reportContentForm.description}
                  onChange={e => setReportContentForm({ ...reportContentForm, description: e.target.value })}
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Submit Content Report
              </button>
            </form>
          </div>
        );

      case 'terms':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Terms of Service</h2>
            <div className={styles.legalTextBlock}>
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing or using the Fantrio platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
              <h3>2. Virtual Currency Economy</h3>
              <p>All purchases and tipping on the platform use Fantrio Coins. Coins purchased are non-refundable unless required by applicable consumer law. Mock coins are intended for testing only and carry no real-world monetary value.</p>
              <h3>3. Content Guidelines</h3>
              <p>Creators and users are strictly prohibited from posting illegal, non-consensual, or hateful content. Safety violations will result in immediate suspension.</p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className={styles.subPageContainer}>
            <h2 className={styles.subPageTitle}>Privacy Policy</h2>
            <div className={styles.legalTextBlock}>
              <h3>1. Data We Collect</h3>
              <p>We collect personal information necessary to deliver account services, process secure transactions, and connect audio/video calls. This includes email address, username, payment references, and usage data.</p>
              <h3>2. Secure Communication</h3>
              <p>We prioritize your privacy. Direct text chat messages, subscription-exclusive media, and 1:1 call streams are fully secure and not sold or exposed to third-party advertising companies.</p>
              <h3>3. Cookie Policy</h3>
              <p>We use localized tokens and secure cookies to manage authentication sessions. You can clear these via browser options at any time.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
      
      {/* LOCAL BRAND GRADIENT DEFINITION */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff007f" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.mainLayout}>
        {/* Left main content area */}
        <div className={styles.centerFeed}>
          
          {/* Header Area */}
          <div className={styles.feedHeader}>
            <div className={styles.headerTitleArea}>
              <div className={styles.titleRow}>
                {subView ? (
                  <button className={styles.backBtn} onClick={() => setSubView(null)}>
                    <ArrowLeft size={24} />
                  </button>
                ) : (
                  <LayoutGrid className={styles.headerIcon} size={28} style={{ stroke: 'url(#brand-gradient)' }} />
                )}
                <h1 className={styles.pageTitle}>{subView ? 'Back' : 'More'}</h1>
              </div>
              <p className={styles.pageSubtitle}>
                {subView 
                  ? `Return to all links and dashboard` 
                  : `All the important links and information in one place.`}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {statusMsg.text && (
            <div className={`${styles.statusAlert} ${styles[statusMsg.type]}`}>
              {statusMsg.type === 'success' ? (
                <Check size={18} className={styles.alertIcon} />
              ) : (
                <AlertTriangle size={18} className={styles.alertIcon} />
              )}
              <span>{statusMsg.text}</span>
              <button className={styles.alertCloseBtn} onClick={clearStatus}>&times;</button>
            </div>
          )}

          {subView ? (
            /* Render subpage views */
            renderSubViewContent()
          ) : (
            /* Render original Dashboard Categories */
            <div className={styles.dashboardGrid}>
              
              {/* Category Column 1 */}
              <div className={styles.dashboardColumn}>
                
                {/* Section: Contact Support */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <Headphones size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Contact Support</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setSubView('tickets')}>
                      <Ticket size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Support Tickets</span>
                        <span className={styles.cardDesc}>View and track your support requests.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                    
                    <button className={styles.menuCard} onClick={() => setSubView('contact')}>
                      <Headphones size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Contact Support</span>
                        <span className={styles.cardDesc}>Get help from our support team.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('faq')}>
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className={styles.cardIcon}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <circle cx="12" cy="17" r="1.3" fill="currentColor" style={{ stroke: 'none' }} />
                      </svg>
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Help Centre / FAQ</span>
                        <span className={styles.cardDesc}>Browse articles and find answers.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

                {/* Section: Safety & Reporting */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <Shield size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Safety & Reporting</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setSubView('report-creator')}>
                      <User size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Report A Creator</span>
                        <span className={styles.cardDesc}>Report an inappropriate creator.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('report-content')}>
                      <ShieldAlert size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Report Content</span>
                        <span className={styles.cardDesc}>Report inappropriate creator content.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

                {/* Section: Legal & Policies */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <Scale size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Legal & Policies</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setSubView('terms')}>
                      <FileText size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Terms of Service</span>
                        <span className={styles.cardDesc}>Read our terms and conditions.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('privacy')}>
                      <Lock size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Privacy Policy</span>
                        <span className={styles.cardDesc}>Learn how we protect your data.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Category Column 2 */}
              <div className={styles.dashboardColumn}>
                
                {/* Section: Community & Rewards */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <Trophy size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Community & Rewards</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setSubView('referral')}>
                      <UserPlus size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Referral Program</span>
                        <span className={styles.cardDesc}>Invite friends and earn rewards.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('rewards')}>
                      <Gift size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Rewards Program</span>
                        <span className={styles.cardDesc}>Check your rewards and benefits.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

                {/* Section: Billing & Transactions */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <Wallet size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Billing & Transactions</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setActiveTab('Transaction History')}>
                      <CreditCard size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Transaction History</span>
                        <span className={styles.cardDesc}>View your coin purchases and transactions.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

                {/* Section: Platform */}
                <div className={styles.categorySection}>
                  <div className={styles.sectionHeader}>
                    <LayoutGrid size={22} className={styles.sectionIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                    <h3>Platform</h3>
                  </div>
                  <div className={styles.sectionCards}>
                    <button className={styles.menuCard} onClick={() => setSubView('announcements')}>
                      <Megaphone size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Announcements</span>
                        <span className={styles.cardDesc}>Latest updates and news.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('features')}>
                      <Lightbulb size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>Feature Requests</span>
                        <span className={styles.cardDesc}>Suggest new features.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>

                    <button className={styles.menuCard} onClick={() => setSubView('about')}>
                      <Info size={20} className={styles.cardIcon} />
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>About Fantrio</span>
                        <span className={styles.cardDesc}>Learn more about fantrio.</span>
                      </div>
                      <ChevronRight size={16} className={styles.chevron} />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Right persistent panels */}
        <div className={styles.rightSidebar}>
          
          {/* Promo Card: Get More with Coins */}
          <div className={styles.promoCard}>
            <div className={styles.promoTextCol}>
              <h2 className={styles.promoTitle}>
                Get More With <span className={styles.pinkText}>Fantrio Coins</span>
              </h2>
              <p className={styles.promoDesc}>
                Unlock exclusive content, tip your favourite creator and enjoy premium features.
              </p>
            </div>
            <div className={styles.promoImgWrapper}>
              <img src="/Gift & Coins.png" alt="Promo Coins" className={styles.promoImg} />
            </div>
            <button className={styles.buyBtn} onClick={() => setActiveTab('Buy Coins')}>
              Buy Coins
            </button>
          </div>

          {/* Need Help Card */}
          <div className={styles.helpCard}>
            <div className={styles.helpHeader}>
              <div className={styles.helpTextCol}>
                <h3 className={styles.helpTitle}>Need Help?</h3>
                <p className={styles.helpDesc}>
                  Our support team is available 24/7 to assist you with any questions or issues.
                </p>
              </div>
              <div className={styles.helpIconCol}>
                <img src="/contact big.png" alt="Help Support" className={styles.helpImg} />
              </div>
            </div>

            <div className={styles.helpMiniMenu}>
              <button className={styles.miniMenuItem} onClick={() => setSubView('contact')}>
                <div className={styles.miniItemLeft}>
                  <Headphones size={16} className={styles.miniIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                  <span>Contact Support</span>
                </div>
                <div className={styles.miniItemRight}>
                  <span>We're here to help</span>
                  <ChevronRight size={14} />
                </div>
              </button>

              <button className={styles.miniMenuItem} onClick={() => setSubView('faq')}>
                <div className={styles.miniItemLeft}>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="url(#brand-gradient)"
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={styles.miniIcon}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r="1.2" fill="url(#brand-gradient)" style={{ stroke: 'none' }} />
                  </svg>
                  <span>Help Centre / FAQ</span>
                </div>
                <div className={styles.miniItemRight}>
                  <span>Find Answer Fast</span>
                  <ChevronRight size={14} />
                </div>
              </button>

              <button className={styles.miniMenuItem} onClick={() => setSubView('tickets')}>
                <div className={styles.miniItemLeft}>
                  <Ticket size={16} className={styles.miniIcon} style={{ stroke: 'url(#brand-gradient)' }} />
                  <span>Support Tickets</span>
                </div>
                <div className={styles.miniItemRight}>
                  <span>Track Your Requests.</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>

            <div className={styles.helpFooter}>
              <span className={styles.footerLabel}>Average Response Time</span>
              <div className={styles.footerVal}>
                <span className={styles.greenDot}></span>
                <span>Under 5 Minutes</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
