import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { ChevronLeft, MoreVertical, Heart, Send, Smile, Image as ImageIcon, Lock, Check, Phone, Video } from 'lucide-react';
import styles from './MobileChatPage.module.css';

const USERS = {
  conv1: {
    displayName: 'Molly Jane',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    isOnline: true,
  },
  conv2: {
    displayName: 'Khushi',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    isOnline: false,
  },
  conv3: {
    displayName: 'Angelina',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    isVerified: false,
    isOnline: true,
  },
};

const MESSAGES = [
  { id: 'm1', sender: 'creator', text: 'Hey! How are you?', time: '9:40 AM' },
  { id: 'm2', sender: 'user', text: 'I\'m great, thanks! How about you?', time: '9:41 AM' },
  { id: 'm3', sender: 'creator', text: 'Doing amazing! Did you see my new content?', time: '9:42 AM' },
  { id: 'm4', sender: 'user', text: 'Not yet, send me the link!', time: '9:43 AM' },
  { id: 'm5', sender: 'creator', isPaywall: true, isLocked: true, coinPrice: 34, title: 'Molly sent you an image', mediaType: 'Exclusive Image', textSub: 'This image is locked 🔒', previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80', time: '9:44 AM' },
  { id: 'm6', sender: 'user', text: 'Can\'t wait to check it out!', time: '9:45 AM' },
  { id: 'm7', sender: 'creator', text: 'Let me know what you think when you see it', time: '9:46 AM' },
  { id: 'm8', sender: 'creator', isPaywall: true, isLocked: false, coinPrice: 20, title: 'Molly sent you a video', mediaType: 'Premium Video', textSub: 'You already unlocked this', previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80', time: '9:47 AM' },
  { id: 'm9', sender: 'user', text: 'Will do! Talk later 😊', time: '9:48 AM' },
  { id: 'm10', sender: 'creator', text: 'Talk later! 💕', time: '9:49 AM' },
];

export const MobileChatPage = () => {
  const { darkMode, currentPath, navigateTo } = useApp();
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const convId = currentPath.split('/').filter(Boolean).pop();
  const user = USERS[convId] || USERS.conv1;

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
    navigateTo('/messages');
  };

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} type="button">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.userBlock} onClick={() => setShowMenu(false)}>
          <div className={styles.avatarWrap}>
            <img src={user.avatarUrl} alt={user.displayName} className={styles.avatar} />
            {user.isOnline && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.displayName}>
              {user.displayName}
              {user.isVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="vBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e10075" />
                      <stop offset="100%" stopColor="#7e00f3" />
                    </linearGradient>
                  </defs>
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" fill="url(#vBadge)" />
                  <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={styles.status}>{user.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} type="button">
            <Heart size={20} fill="#ff003b" color="#ff003b" />
          </button>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)} type="button">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={styles.dropdown}>
                <button className={`${styles.dropdownItem} ${styles.callItem}`} type="button">
                  <div className={styles.callItemInner}>
                    <Phone size={14} className={styles.audioIcon} />
                    <div className={styles.callTextCol}>
                      <span className={styles.callLabelAudio}>Audio Call</span>
                      <span className={styles.callCost}>10 coins/min</span>
                    </div>
                  </div>
                </button>
                <button className={`${styles.dropdownItem} ${styles.callItem}`} type="button">
                  <div className={styles.callItemInner}>
                    <Video size={14} className={styles.videoIcon} />
                    <div className={styles.callTextCol}>
                      <span className={styles.callLabelVideo}>Video Call</span>
                      <span className={styles.callCost}>10 coins/min</span>
                    </div>
                  </div>
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
          const isMe = msg.sender === 'user';
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRight : styles.msgLeft}`}>
              {!isMe && (
                <img src={user.avatarUrl} alt="" className={styles.msgAvatar} />
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
                  <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                    <p className={styles.bubbleText}>{msg.text}</p>
                  </div>
                )}
                <span className={`${styles.time} ${isMe ? styles.timeRight : styles.timeLeft}`}>{msg.time}</span>
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
          placeholder="Type a message..."
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
