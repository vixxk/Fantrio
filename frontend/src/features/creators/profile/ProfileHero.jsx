import React from 'react';
import { BadgeCheck, Users, Heart, Eye, DollarSign, FileText, Star, MessageSquare, Phone, Video, Gift } from 'lucide-react';
import { creatorProfile, profileStats, actionButtons } from './mockData';
import styles from './ProfilePage.module.css';

const statIcons = {
  subscribers: Users,
  followers: Heart,
  views: Eye,
  tips: DollarSign,
  content: FileText,
};

const buttonIcons = {
  star: Star,
  message: MessageSquare,
  phone: Phone,
  video: Video,
  gift: Gift,
};

export const ProfileHero = ({ isDark }) => {
  return (
    <div className={`${styles.heroCard} ${!isDark ? styles.light : ''}`}>
      {/* Cover Image */}
      <div className={styles.coverImage}>
        <img src={creatorProfile.coverImage} alt="Cover" className={styles.coverImg} />
        <div className={styles.coverOverlay} />
      </div>

      {/* Profile Content */}
      <div className={styles.heroContent}>
        {/* Profile Picture */}
        <div className={styles.profilePicWrap}>
          <img
            src={creatorProfile.avatar}
            alt={creatorProfile.name}
            className={styles.profilePic}
          />
          {creatorProfile.isOnline && <span className={styles.onlineIndicator} />}
        </div>

        {/* Profile Info */}
        <div className={styles.profileInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.profileName}>{creatorProfile.name}</h1>
            {creatorProfile.isVerified && (
              <BadgeCheck size={22} className={styles.verifiedBadge} />
            )}
          </div>
          <div className={styles.handleRow}>
            <span className={styles.handle}>{creatorProfile.handle}</span>
            {creatorProfile.isOnline && (
              <span className={styles.onlineStatus}>
                <span className={styles.onlineDot} /> Online
              </span>
            )}
          </div>
          <span className={styles.role}>{creatorProfile.role}</span>
          <p className={styles.bio}>{creatorProfile.bio}</p>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          {profileStats.map((stat, index) => {
            const Icon = statIcons[stat.icon];
            return (
              <div key={index} className={styles.statItem}>
                <Icon size={18} className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {actionButtons.map((btn, index) => {
            const Icon = buttonIcons[btn.icon];
            return (
              <button
                key={index}
                className={`${styles.actionBtn} ${styles[btn.variant]}`}
              >
                <Icon size={18} />
                <div className={styles.btnContent}>
                  <span className={styles.btnLabel}>{btn.label}</span>
                  {btn.sublabel && <span className={styles.btnSublabel}>{btn.sublabel}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
