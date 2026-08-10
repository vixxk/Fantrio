import { Check } from 'lucide-react';
import styles from './ProfilePage.module.css';

export const SubscriptionPlans = ({ isDark, subscriptionPlans }) => {
  const plans = subscriptionPlans || { title: 'Subscription Plans', subtitle: '', plans: [] };
  return (
    <div className={`${styles.plansCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.plansHeader}>
        <h3 className={styles.sectionTitle}>{plans.title}</h3>
        <p className={styles.sectionSubtitle}>{plans.subtitle}</p>
      </div>
      <div className={styles.plansGrid}>
        {plans.plans.map((plan, index) => (
          <div key={index} className={styles.planCard}>
            <div className={styles.planHeader}>
              <h4 className={styles.planName}>{plan.name}</h4>
              <div className={styles.planPrice}>
                <span className={styles.priceValue}>{plan.price}</span>
                <span className={styles.pricePeriod}>{plan.period}</span>
              </div>
            </div>
            <ul className={styles.planFeatures}>
              {(plan.features || []).map((feature, i) => (
                <li key={i} className={styles.planFeature}>
                  <Check size={16} className={styles.checkIcon} />
                  {feature}
                </li>
              ))}
            </ul>
            <button className={styles.subscribeBtn}>Subscribe</button>
          </div>
        ))}
      </div>
    </div>
  );
};
