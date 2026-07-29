import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { ChevronLeft, MoreVertical, Send, Smile, Image as ImageIcon, Star, DollarSign, Gift, Ban, Lock, Check } from 'lucide-react';
import styles from './CreatorMobileChatPage.module.css';

const FANS = {
  fan1: {
    displayName: 'Michael Chen',
    username: 'mikechen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isVerified: false,
    isOnline: true,
    isTopFan: true,
  },
  fan2: {
    displayName: 'Sarah Williams',
    username: 'sarahw',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    isVerified: false,
    isOnline: false,
    isTopFan: false,
  },
  fan3: {
    displayName: 'Alex Thompson',
    username: 'alext',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isVerified: false,
    isOnline: true,
    isTopFan: true,
  },
};

const MESSAGES = [
  { id: 'm1', sender: 'fan', text: 'Hey! Love your content 🔥', time: '10:15 AM' },
  { id: 'm2', sender: 'creator', text: 'Thank you so much! 🥰', time: '10:16 AM' },
  { id: 'm3', sender: 'fan', text: 'When is your next live stream?', time: '10:17 AM' },
  { id: 'm4', sender: 'creator', text: 'Planning one for this weekend!', time: '10:18 AM' },
  { id: 'm5', sender: 'creator', isPaywall: true, isLocked: true, coinPrice: 50, title: 'You sent an exclusive photo', mediaType: 'Exclusive Photo', textSub: 'Locked — fan needs to pay', previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80', time: '10:19 AM' },
  { id: 'm6', sender: 'fan', text: 'Can\'t wait! I\'ll be there', time: '10:20 AM' },
  { id: 'm7', sender: 'creator', text: 'Amazing, I\'ll send you a reminder', time: '10:21 AM' },
  { id: 'm8', sender: 'creator', isPaywall: true, isLocked: false, coinPrice: 30, title: 'You sent a premium video', mediaType: 'Premium Video', textSub: 'Fan has unlocked this', previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80', time: '10:22 AM' },
  { id: 'm9', sender: 'fan', text: 'Also, I sent a tip your way 💰', time: '10:23 AM' },
  { id: 'm10', sender: 'creator', text: 'You\'re the best! 🙏💕', time: '10:24 AM' },
  { id: 'm11', sender: 'fan', text: 'Keep doing what you do! ✨', time: '10:25 AM' },
];

export const CreatorMobileChatPage = () => {
  const { darkMode, currentPath, navigateTo } = useApp();
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const fanId = currentPath.split('/').filter(Boolean).pop();
  const fan = FANS[fanId] || FANS.fan1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setInputText('');
  };

  const handleBack = () => {
    navigateTo('/creators/messages');
  };

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} type="button">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.userBlock}>
          <div className={styles.avatarWrap}>
            <img src={fan.avatarUrl} alt={fan.displayName} className={styles.avatar} />
            {fan.isOnline && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.displayName}>
              {fan.displayName}
              {fan.isTopFan && <Star size={12} fill="#eab308" color="#eab308" />}
            </div>
            <span className={styles.status}>{fan.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)} type="button">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} type="button">
                  <Star size={14} /> View Profile
                </button>
                <button className={styles.dropdownItem} type="button">
                  <DollarSign size={14} /> Send Tip
                </button>
                <button className={styles.dropdownItem} type="button">
                  <Gift size={14} /> PPV Offer
                </button>
                <button className={`${styles.dropdownItem} ${styles.dangerItem}`} type="button">
                  <Ban size={14} /> Block
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.messagesArea}>
        <div className={styles.dateSep}>
          <span>Today</span>
        </div>

        {MESSAGES.map((msg) => {
          const isCreator = msg.sender === 'creator';
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isCreator ? styles.msgRight : styles.msgLeft}`}>
              {!isCreator && (
                <img src={fan.avatarUrl} alt="" className={styles.msgAvatar} />
              )}
              <div className={styles.msgContent}>
                {msg.isPaywall ? (
                  <div className={styles.paywall}>
                    <div className={styles.paywallPreview}>
                      <img src={msg.previewUrl} alt="" className={styles.paywallImg} />
                      {msg.isLocked && (
                        <div className={styles.lockOverlay}>
                          <Lock size={16} />
                        </div>
                      )}
                    </div>
                    <div className={styles.paywallInfo}>
                      <span className={styles.paywallLabel}>{msg.mediaType}</span>
                      <span className={styles.paywallDesc}>{msg.textSub}</span>
                    </div>
                    {msg.isLocked ? (
                      <div className={styles.paywallAction}>
                        <span className={styles.coinTag}>
                          <img src="/coin.png" alt="" className={styles.coinIcon} />
                          {msg.coinPrice} Coins
                        </span>
                        <button className={styles.unlockBtn} type="button">Unlock</button>
                      </div>
                    ) : (
                      <div className={styles.unlocked}>
                        <Check size={14} /> Unlocked
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`${styles.bubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                    <p className={styles.bubbleText}>{msg.text}</p>
                  </div>
                )}
                <span className={`${styles.time} ${isCreator ? styles.timeRight : styles.timeLeft}`}>{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <button type="button" className={styles.inputIcon}><ImageIcon size={20} /></button>
        <input
          type="text"
          placeholder="Reply..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={styles.input}
        />
        <button type="button" className={styles.inputIcon}><Smile size={20} /></button>
        <button type="submit" className={styles.sendBtn}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
