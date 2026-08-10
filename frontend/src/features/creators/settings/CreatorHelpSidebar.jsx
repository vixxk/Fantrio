import { ChevronRight, HelpCircle, Phone, AlertTriangle } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorHelpSidebar = ({ helpLinks, onOpenModal }) => {
  const getHelpIcon = (iconType) => {
    switch (iconType) {
      case 'help': return <HelpCircle size={18} />;
      case 'support': return <Phone size={18} />;
      case 'report': return <AlertTriangle size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  return (
    <div className={styles.sidebarCard}>
      <h3 className={styles.sidebarCardTitle}>Need Help & Support?</h3>
      <div className={styles.helpList}>
        {helpLinks.map((link) => (
          <button
            key={link.id}
            className={styles.helpItem}
            onClick={() => {
              if (link.id === 'helpCenter') onOpenModal('help');
              else if (link.id === 'contactSupport') onOpenModal('contact');
              else if (link.id === 'reportIssue') onOpenModal('report');
            }}
          >
            <div className={styles.helpIcon}>
              {getHelpIcon(link.icon)}
            </div>
            <div className={styles.helpInfo}>
              <span className={styles.helpLabel}>{link.label}</span>
              <span className={styles.helpDescription}>{link.description}</span>
            </div>
            <ChevronRight size={16} className={styles.helpArrow} />
          </button>
        ))}
      </div>
    </div>
  );
};
