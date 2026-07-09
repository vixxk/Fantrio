import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  Coins, 
  AlertTriangle, 
  PhoneCall, 
  TrendingUp, 
  CheckCircle,
  Save,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminOverview = () => {
  const { toast } = useAdminUI();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(20);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, settingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/settings')
      ]);

      if (statsRes.status === 'success') {
        setStats(statsRes.stats);
      }
      if (settingsRes.status === 'success' && settingsRes.settings) {
        setSettings(settingsRes.settings);
        setCommissionRate(settingsRes.settings.commissionRate * 100);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const updated = {
        commissionRate: commissionRate / 100,
        coinPackages: settings ? settings.coinPackages : []
      };
      const res = await api.put('/admin/settings', updated);
      if (res.status === 'success') {
        toast.success('System settings updated successfully.');
      }
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Loading dashboard overview…</span>
      </div>
    );
  }

  const usersCount = stats?.users?.totalUsers || 0;
  const creatorsCount = stats?.users?.totalCreators || 0;
  const coinsCirculating = stats?.wallet?.totalCoinsCirculating || 0;
  const reportsCount = stats?.moderation?.totalReportedPosts || 0;
  const activeCalls = stats?.calls?.activeCallsCount || 0;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Dashboard Overview</h2>
          <p className={styles.pageSub}>Platform health and configuration at a glance.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.dashboardMetrics}>
        <div className={styles.metricCard}>
          <div className={styles.iconContainer}>
            <Users size={24} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Total Users</span>
            <span className={styles.metricValue}>{usersCount}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconContainer} style={{ background: 'var(--brand-soft-2)', color: 'var(--brand-2)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Creators</span>
            <span className={styles.metricValue}>{creatorsCount}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconContainer} style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
            <Coins size={24} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Coin Ledger</span>
            <span className={styles.metricValue}>{coinsCirculating}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconContainer} style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Reports</span>
            <span className={styles.metricValue}>{reportsCount}</span>
          </div>
        </div>
      </div>

      <div className={styles.glassPanel}>
        <h3 className={styles.panelTitle}>System Platform Configuration</h3>

        <div className={styles.formGrid}>
          <div className={styles.configForm}>
            <div className={styles.formControlItem} style={{ maxWidth: 280 }}>
              <label className={styles.inputLabel}>Global Commission Cut (%)</label>
              <input
                type="number"
                className={styles.inputField}
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>

            <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.saveConfigBtn}`} onClick={handleSaveSettings}>
              <Save size={16} />
              Save Configuration
            </button>
          </div>

          <span className={styles.fieldHint}>
            Platform fees applied to calls, unlockable content, and creator renewals.
          </span>

          <hr className={styles.sectionDivider} />

          <div>
            <h4 className={styles.inputLabel} style={{ marginBottom: 12 }}>External Integrations</h4>
            <div className={styles.integrationGrid}>
              <div className={styles.integrationItem}>
                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                Zego Video SDK — Active
              </div>
              <div className={styles.integrationItem}>
                <Zap size={16} style={{ color: 'var(--brand)' }} />
                Push Notifications — Connected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
