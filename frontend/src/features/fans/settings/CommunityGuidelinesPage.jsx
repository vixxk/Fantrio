import { Heart, Shield, Lock, BookOpen, AlertOctagon, CheckCircle2 } from 'lucide-react';
import styles from './SettingsPage.module.css';

export const CommunityGuidelinesPage = () => {
  const guidelineSections = [
    {
      number: '01',
      title: 'Mutual Respect & Kindness',
      desc: 'Treat creators and fellow fans with respect. Harassment, hate speech, bullying, and discrimination of any form are strictly prohibited.',
      icon: Heart,
    },
    {
      number: '02',
      title: 'Safety & Consent First',
      desc: 'Sharing illegal, non-consensual material, or content exploiting individuals will result in immediate permanent account termination.',
      icon: Shield,
    },
    {
      number: '03',
      title: 'Privacy & Data Security',
      desc: 'Never share private contact info, bank details, or passwords in public chats or comments. Guard your account credentials.',
      icon: Lock,
    },
    {
      number: '04',
      title: 'Copyright & Intellectual Property',
      desc: 'Only stream or post media you own or hold distribution rights for. Respect third-party copyright and trademarks.',
      icon: BookOpen,
    },
    {
      number: '05',
      title: 'No Scams or Fraud',
      desc: 'Engaging in deceptive practices, unauthorized coin trades, or phishing will trigger automated fraud locks.',
      icon: AlertOctagon,
    },
    {
      number: '06',
      title: 'Community Moderation',
      desc: 'Our moderation team monitors reports 24/7. Use the "Report Problem" tool if you encounter any violations.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className={styles.subPageBody}>
      <div className={styles.guidelinesHero}>
        <Heart size={120} className={styles.guidelinesWatermarkIcon} aria-hidden="true" />
        <div className={styles.guidelinesHeroContent}>
          <h3>Fantrio Community Guidelines</h3>
          <p>Creating a vibrant, safe, and empowering space for creators and fans worldwide.</p>
        </div>
      </div>

      <div className={styles.guidelinesGrid}>
        {guidelineSections.map((g) => {
          const IconComponent = g.icon;
          return (
            <div key={g.number} className={styles.guidelineCard}>
              <div className={styles.guidelineCardHeader}>
                <div className={styles.guidelineIconWrap}>
                  <IconComponent size={20} />
                </div>
                <h4>{g.title}</h4>
                <span className={styles.guidelineNumber}>{g.number}</span>
              </div>
              <p>{g.desc}</p>
            </div>
          );
        })}
      </div>

      <div className={styles.guidelinesFooter}>
        <AlertOctagon size={20} className={styles.footerAlertIcon} />
        <span>Failure to comply with these rules may lead to warning strikes, muted accounts, or legal escalation.</span>
      </div>
    </div>
  );
};
