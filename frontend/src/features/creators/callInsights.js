export const buildCallInsights = (ctx) => {
  const {
    type,
    peakTime,
    boostPercentage,
    completionRate,
    completedCount = 0,
    missedCount = 0,
    todayChangePct = 0,
    isOnline = true,
    rate = 0,
  } = ctx;

  const pct = (n) => `${Math.max(0, Math.round(n || 0))}%`;
  const typeLower = type.toLowerCase();
  const insights = [];

  if (peakTime) {
    insights.push({
      id: 'peak',
      tone: 'positive',
      title: 'Peak hours detected',
      detail: `${type}s peak around ${peakTime} — you earn ${boostPercentage || '0%'} more then. Plan your availability for this window.`,
    });
  } else {
    insights.push({
      id: 'peak',
      tone: 'action',
      title: 'Find your peak hour',
      detail: 'Not enough completed calls to detect a peak yet — go online at different times to build a clear pattern.',
    });
  }

  if (completionRate >= 70) {
    insights.push({
      id: 'completion',
      tone: 'positive',
      title: `${pct(completionRate)} completion rate`,
      detail: `You completed ${completedCount} ${typeLower}s this period — answering fast keeps fans coming back.`,
    });
  } else if (completedCount > 0) {
    insights.push({
      id: 'completion',
      tone: 'action',
      title: `${pct(completionRate)} completion rate`,
      detail: 'Answer requests faster and start calls on time to turn more fans into completed calls.',
    });
  }

  if (missedCount > 0) {
    insights.push({
      id: 'missed',
      tone: 'warning',
      title: `${missedCount} missed call${missedCount === 1 ? '' : 's'}`,
      detail: 'Turn on notifications and stay online so you never miss a paid call again.',
    });
  }

  if (!isOnline) {
    insights.push({
      id: 'online',
      tone: 'action',
      title: 'You’re offline',
      detail: 'Fans can’t request calls while you’re away — flip your status online to keep earning.',
    });
  }

  if (!rate || Number(rate) <= 0) {
    insights.push({
      id: 'rate',
      tone: 'warning',
      title: 'Set a call rate',
      detail: `No ${typeLower} rate set — add one in your profile to receive paid requests.`,
    });
  }

  if (todayChangePct < 0) {
    insights.push({
      id: 'trend',
      tone: 'warning',
      title: `Earnings down ${Math.abs(todayChangePct)}% today`,
      detail: 'Go online during your peak window and post a quick preview to pull fans into calls.',
    });
  } else if (todayChangePct > 0) {
    insights.push({
      id: 'trend',
      tone: 'positive',
      title: `Earnings up ${todayChangePct}% today`,
      detail: 'Keep the momentum — reply fast and stay online for the rest of the day.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'grow',
      tone: 'action',
      title: 'Grow your call earnings',
      detail: 'Share your profile link, post exclusive previews, and set competitive rates to attract more fans.',
    });
  }

  return insights.slice(0, 4);
};
