import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  BookOpen, Search, X, ChevronRight, ThumbsUp, ThumbsDown, Headphones, MessageSquare 
} from 'lucide-react';
import styles from './SettingsPage.module.css';

export const HelpCentrePage = ({ setStatus, onContact }) => {
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [feedback, setFeedback] = useState({});

  const loadFaqs = async () => {
    try {
      const res = await api.get('/settings/faqs');
      if (res.status === 'success') setFaqs(res.faqs || []);
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load FAQ.' });
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadFaqs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = ['All', 'Account', 'Billing', 'Calls & Streams', 'Safety & Rewards'];

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = !searchQuery.trim() || 
      (f.question && f.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.answer && f.answer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'All' || 
      (f.category && f.category.toLowerCase() === activeCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleFeedback = (idx, type) => {
    setFeedback(prev => {
      if (prev[idx] === type) {
        const next = { ...prev };
        delete next[idx];
        return next;
      }
      return { ...prev, [idx]: type };
    });
  };

  return (
    <div className={styles.subPageBody}>
      <div className={styles.helpCentreHero}>
        <BookOpen size={100} className={styles.heroWatermarkIcon} />

        <div className={styles.helpHeroContent}>
          <h3>Knowledge Hub & FAQ</h3>
          <p>Find instant answers to common questions about subscriptions, coins, and calls.</p>
        </div>

        <div className={styles.faqSearchBox}>
          <Search size={18} className={styles.faqSearchIcon} />
          <input
            type="text"
            className={styles.faqSearchInput}
            placeholder="Search help articles by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className={styles.searchClearBtn} onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className={styles.categoryPillsRow}>
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`${styles.catPill} ${activeCategory === cat ? styles.catPillActive : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredFaqs.length === 0 ? (
        <div className={styles.emptyBox}>
          <BookOpen size={44} className={styles.emptyBoxIcon} />
          <p>{searchQuery ? `No matching help articles found for "${searchQuery}".` : 'No articles published yet.'}</p>
        </div>
      ) : (
        <div className={styles.accordionContainer}>
          {filteredFaqs.map((faq, idx) => {
            const isOpen = expanded === idx;
            const userRating = feedback[idx];
            return (
              <div key={faq._id || idx} className={`${styles.accordionItem} ${isOpen ? styles.accordionOpen : ''}`}>
                <button
                  className={styles.accordionTrigger}
                  onClick={() => setExpanded(isOpen ? null : idx)}
                >
                  <div className={styles.faqQuestionLeft}>
                    <span className={styles.faqTag}>{faq.category || 'General'}</span>
                    <span className={styles.faqQuestionText}>{faq.question}</span>
                  </div>
                  <ChevronRight size={18} className={`${styles.accordionChevron} ${isOpen ? styles.chevronRotated : ''}`} />
                </button>
                {isOpen && (
                  <div className={styles.accordionPanel}>
                    <p className={styles.faqAnswerText}>{faq.answer}</p>
                    <div className={styles.faqRatingRow}>
                      <span>Was this article helpful?</span>
                      <button
                        type="button"
                        className={`${styles.rateBtn} ${userRating === 'up' ? styles.ratedUp : ''}`}
                        onClick={() => handleFeedback(idx, 'up')}
                      >
                        <ThumbsUp size={13} /> Yes
                      </button>
                      <button
                        type="button"
                        className={`${styles.rateBtn} ${userRating === 'down' ? styles.ratedDown : ''}`}
                        onClick={() => handleFeedback(idx, 'down')}
                      >
                        <ThumbsDown size={13} /> No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.helpCtaBanner}>
        <div className={styles.helpCtaLeft}>
          <Headphones size={28} className={styles.ctaHeadphoneIcon} />
          <div>
            <h4>Still need assistance?</h4>
            <p>Our dedicated support team is available 24/7 to resolve your inquiries.</p>
          </div>
        </div>
        <button className={styles.supportBtn} onClick={onContact}>
          <MessageSquare size={15} /> <span>Contact Support Desk</span>
        </button>
      </div>
    </div>
  );
};
