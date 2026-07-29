import { useApp } from '../../../context/AppContext';
import { Settings } from 'lucide-react';

export const CreatorSettingsPage = () => {
  const { darkMode } = useApp();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '2rem',
      color: darkMode ? '#ffffff' : '#1a1625',
    }}>
      <Settings size={48} style={{ color: '#e10075', marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Settings</h1>
      <p style={{ fontSize: '0.9rem', color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(26,22,37,0.5)', textAlign: 'center', maxWidth: '400px' }}>
        Configure your account, notifications, and creator preferences.
      </p>
    </div>
  );
};
