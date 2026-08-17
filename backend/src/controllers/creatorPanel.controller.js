const mongoose = require('mongoose');
const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');
const Story = require('../models/Story');
const CallLog = require('../models/CallLog');
const LiveStream = require('../models/LiveStream');
const SystemSetting = require('../models/SystemSetting');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const startOfPeriod = (period) => {
  const now = new Date();
  if (period === 'week') return new Date(now.setDate(now.getDate() - 7));
  if (period === 'month') return new Date(now.setMonth(now.getMonth() - 1));
  if (period === 'quarter') return new Date(now.setMonth(now.getMonth() - 3));
  if (period === 'year') return new Date(now.setFullYear(now.getFullYear() - 1));
  return null; // all time
};

const fmtNum = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

const fmtCoin = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Sum a numeric field over a set of transactions
const sumTx = (txs, field = 'amountCoins') => txs.reduce((s, t) => s + (t[field] || 0), 0);

const COMMISSION_TYPES = ['subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry'];

// Net (after commission) share for a creator from a completed transaction
const netOfCommission = (amount, commRate) => Number((amount * (1 - commRate)).toFixed(2));

const formatCoin = (n) => `${fmtCoin(n)} coins`;

// ---------------------------------------------------------------------------
// ANALYTICS PAGE
// ---------------------------------------------------------------------------
exports.getAnalytics = catchAsync(async (req, res, next) => {
  const period = ['week', 'month', 'quarter', 'year', 'all'].includes(req.query.period) ? req.query.period : 'all';
  const allTime = period === 'all';
  const periodStart = startOfPeriod(period);
  const prevPeriodStart = periodStart ? startOfPeriod(period === 'week' ? 'week' : period) : null;
  // previous window is the one right before the current window
  const prevWindowStart = periodStart ? new Date(periodStart.getTime() - (Date.now() - periodStart.getTime())) : null;
  // Readable comparison label; '' for all time (no comparison shown)
  const PERIOD_CHANGE_LABEL = { week: 'vs last week', month: 'vs last month', quarter: 'vs last quarter', year: 'vs last year' };
  const changeLabel = allTime ? '' : (PERIOD_CHANGE_LABEL[period] || 'vs previous period');
  const changeVal = (pct) => (allTime ? '' : `${pct >= 0 ? '+' : ''}${pct}%`);

  const creatorId = req.user._id;
  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  const [systemSetting] = await Promise.all([SystemSetting.findOne()]);
  const commRate = systemSetting ? systemSetting.commissionRate : 0.20;

  // --- Transactions (earnings) ---
  const earningsMatch = {
    receiverId: creatorId,
    status: 'completed',
    type: { $in: COMMISSION_TYPES }
  };
  const [txCurrent, txPrev] = await Promise.all([
    periodStart
      ? Transaction.find({ ...earningsMatch, createdAt: { $gte: periodStart } })
      : Transaction.find(earningsMatch),
    prevWindowStart
      ? Transaction.find({ ...earningsMatch, createdAt: { $gte: prevWindowStart, $lt: periodStart } })
      : Promise.resolve([])
  ]);

  const netEarned = sumTx(txCurrent);
  const prevNetEarned = sumTx(txPrev);
  const earningsChange = pctChange(netEarned, prevNetEarned);

  // --- Subscribers ---
  const subMatch = { creatorId, status: { $in: ['active', 'expired', 'cancelled'] } };
  const [subsCurrent, subsPrev] = await Promise.all([
    periodStart ? Subscription.find({ ...subMatch, createdAt: { $gte: periodStart } }) : Promise.resolve([]),
    prevWindowStart ? Subscription.find({ ...subMatch, createdAt: { $gte: prevWindowStart, $lt: periodStart } }) : Promise.resolve([])
  ]);
  const newSubs = subsCurrent.length;
  const prevNewSubs = subsPrev.length;
  const subChange = pctChange(newSubs, prevNewSubs);

  // --- PPV sales ---
  const ppvMatch = { receiverId: creatorId, type: 'ppv_unlock', status: 'completed' };
  const [ppvCurrent, ppvPrev] = await Promise.all([
    periodStart ? Transaction.find({ ...ppvMatch, createdAt: { $gte: periodStart } }) : Transaction.find(ppvMatch),
    prevWindowStart ? Transaction.find({ ...ppvMatch, createdAt: { $gte: prevWindowStart, $lt: periodStart } }) : Promise.resolve([])
  ]);
  const ppvCount = ppvCurrent.length;
  const ppvChange = pctChange(ppvCount, ppvPrev.length);

  // --- Tips & Gifts ---
  const tipMatch = { receiverId: creatorId, type: { $in: ['tip', 'gift'] }, status: 'completed' };
  const [tipCurrent, tipPrev] = await Promise.all([
    periodStart ? Transaction.find({ ...tipMatch, createdAt: { $gte: periodStart } }) : Transaction.find(tipMatch),
    prevWindowStart ? Transaction.find({ ...tipMatch, createdAt: { $gte: prevWindowStart, $lt: periodStart } }) : Promise.resolve([])
  ]);
  const tipCoins = sumTx(tipCurrent);
  const tipChange = pctChange(tipCoins, sumTx(tipPrev));

  // --- Engagement (likes + comments across posts) — real period-scoped ---
  const posts = await Post.find({ creatorId });

  const viewsFor = (list) => list.reduce((s, p) => s + (p.viewsCount || 0), 0);
  const engagementFor = (list) => {
    const v = viewsFor(list);
    const lc = list.reduce((s, p) => s + (p.likes ? p.likes.length : 0) + (p.commentCount || 0), 0);
    return v > 0 ? Number(((lc / v) * 100).toFixed(1)) : 0;
  };

  // Selected window's content (value) and the immediately-preceding window
  // (change baseline). For 'all time' there is no preceding window, so the
  // change compares the trailing week vs the week before it (meaningful, real).
  const periodPosts = periodStart ? posts.filter((p) => p.createdAt >= periodStart) : posts;
  const prevWindowPosts = prevWindowStart
    ? posts.filter((p) => p.createdAt >= prevWindowStart && p.createdAt < periodStart)
    : [];
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
  const baselineCur = periodStart ? periodPosts : posts.filter((p) => p.createdAt >= weekAgo);
  const baselinePrev = prevWindowStart
    ? prevWindowPosts
    : posts.filter((p) => p.createdAt >= twoWeeksAgo && p.createdAt < weekAgo);

  const viewsChange = pctChange(viewsFor(baselineCur), viewsFor(baselinePrev));
  const periodEngagementRate = engagementFor(periodPosts);
  const engagementChange = pctChange(engagementFor(baselineCur), engagementFor(baselinePrev));

  const statsCards = [
    {
      id: 'subscribers',
      label: 'Total Subscribers',
      value: fmtNum(profile.subscriberCount || 0),
      change: changeVal(subChange),
      changeType: subChange >= 0 ? 'positive' : 'negative',
      period: changeLabel,
      icon: 'subscribers'
    },
    {
      id: 'views',
      label: 'Profile Views',
      value: fmtNum(profile.profileViews || 0),
      change: changeVal(viewsChange),
      changeType: viewsChange >= 0 ? 'positive' : 'negative',
      period: changeLabel,
      icon: 'views'
    },
    {
      id: 'ppv',
      label: 'PPV Sales',
      value: fmtNum(ppvCount),
      change: changeVal(ppvChange),
      changeType: ppvChange >= 0 ? 'positive' : 'negative',
      period: changeLabel,
      icon: 'ppv'
    },
    {
      id: 'tips',
      label: 'Tips Received',
      value: formatCoin(tipCoins),
      change: changeVal(tipChange),
      changeType: tipChange >= 0 ? 'positive' : 'negative',
      period: changeLabel,
      icon: 'tips'
    },
    {
      id: 'engagement',
      label: 'Engagement Rate',
      value: `${periodEngagementRate}%`,
      change: changeVal(engagementChange),
      changeType: engagementChange >= 0 ? 'positive' : 'negative',
      period: changeLabel,
      icon: 'engagement'
    }
  ];

  // --- Subscriber growth chart (last 7 weeks) ---
  const growthLabels = [];
  const growthTotal = [];
  const growthNew = [];
  const allSubs = await Subscription.find(subMatch).sort({ createdAt: 1 });
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    growthLabels.push(weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    growthNew.push(allSubs.filter((s) => s.createdAt >= weekStart && s.createdAt < weekEnd).length);
    growthTotal.push(allSubs.filter((s) => s.createdAt < weekEnd).length);
  }

  // --- Earnings overview chart (last 7 weeks) ---
  const earnLabels = [];
  const earnTotal = [];
  const earnNet = [];
  const allEarnTxs = await Transaction.find(earningsMatch).sort({ createdAt: 1 });
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekTxs = allEarnTxs.filter((t) => t.createdAt >= weekStart && t.createdAt < weekEnd);
    earnLabels.push(weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const gross = sumTx(weekTxs);
    earnTotal.push(Number(gross.toFixed(2)));
    earnNet.push(Number(weekTxs.reduce((s, t) => s + netOfCommission(t.amountCoins || 0, commRate), 0).toFixed(2)));
  }

  // --- Insights ---
  // For 'all time' there is no previous window, so the change-driven insights
  // show absolute all-time figures instead of comparisons.
  const insights = [
    {
      id: 'growth',
      icon: 'growth',
      text: allTime ? 'You have' : 'Your subscriber growth is',
      highlight: allTime ? `${fmtNum(profile.subscriberCount || 0)} subscribers` : `${subChange >= 0 ? '+' : ''}${subChange}%`,
      suffix: allTime ? 'in total.' : 'vs the previous period.'
    },
    {
      id: 'views',
      icon: 'views',
      text: `You earned ${formatCoin(netEarned)} in`,
      highlight: allTime ? 'total.' : 'the selected period.',
      suffix: allTime ? 'Keep it up!' : (earningsChange >= 0 ? 'Keep it up!' : 'Try posting more exclusive content.')
    },
    {
      id: 'ppv',
      icon: 'ppv',
      text: `PPV content was unlocked`,
      highlight: `${ppvCount} times`,
      suffix: 'Keep creating exclusive content!'
    },
    {
      id: 'tips',
      icon: 'tips',
      text: allTime ? 'You have received' : 'Tips received are',
      highlight: allTime ? formatCoin(tipCoins) : `${tipChange >= 0 ? '+' : ''}${tipChange}%`,
      suffix: allTime ? 'in tips.' : 'vs the previous period.'
    },
    {
      id: 'engagement',
      icon: 'engagement',
      text: 'Your engagement rate is',
      highlight: `${periodEngagementRate}%`,
      suffix: allTime ? '' : 'in the selected period.'
    }
  ];

  // --- Content performance (top posts by engagement) ---
  const ppvTxByPost = {};
  const ppvTxs = await Transaction.find({ receiverId: creatorId, type: 'ppv_unlock', status: 'completed' });
  ppvTxs.forEach((t) => {
    const key = t.referenceId ? t.referenceId.toString() : '';
    if (key) ppvTxByPost[key] = (ppvTxByPost[key] || 0) + 1;
  });

  const contentPerformance = [...posts]
    .map((p) => {
      const views = p.viewsCount || 0;
      const likes = p.likes ? p.likes.length : 0;
      const comments = p.commentCount || 0;
      const unlocks = ppvTxByPost[p._id.toString()] || 0;
      const revenue = p.postType === 'ppv' ? (unlocks * p.coinPrice) : 0;
      return {
        id: p._id,
        title: p.content ? p.content.slice(0, 40) || '(No caption)' : '(No caption)',
        date: p.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        type: p.postType === 'ppv' ? 'PPV' : p.media && p.media[0] ? (p.media[0].type === 'video' ? 'Stream' : 'Post') : 'Post',
        status: p.postType === 'ppv' ? 'LOCKED' : 'OPEN',
        thumbnail: p.media && p.media[0] ? p.media[0].thumbnailUrl || p.media[0].url : '',
        views: fmtNum(views),
        likes,
        comments,
        revenue: `${revenue} coins`,
        conversion: p.postType === 'ppv' && views > 0 ? `${((unlocks / views) * 100).toFixed(1)}%` : '-'
      };
    })
    .sort((a, b) => (Number(a.likes) + Number(a.views.replace(/K$/, '')) * 1000) - (Number(b.likes) + Number(b.views.replace(/K$/, '')) * 1000))
    .reverse()
    .slice(0, 5);

  // --- Traffic sources (real derived distribution across channels) ---
  const liveViews = await LiveStream.aggregate([
    { $match: { creatorId } },
    { $group: { _id: null, views: { $sum: { $ifNull: ['$totalViews', 0] } } } }
  ]);
  const storyViews = await Story.aggregate([
    { $match: { creatorId } },
    { $group: { _id: null, views: { $sum: { $size: { $ifNull: ['$views', []] } } } } }
  ]);
  const postViewsTotal = posts.reduce((s, p) => s + (p.viewsCount || 0), 0);
  const profileViewsTotal = profile.profileViews || 0;
  const liveViewsTotal = liveViews[0] ? liveViews[0].views : 0;
  const storyViewsTotal = storyViews[0] ? storyViews[0].views : 0;

  const trafficRows = [
    { key: 'posts', source: 'Content Feed', views: postViewsTotal },
    { key: 'live', source: 'Live Streams', views: liveViewsTotal },
    { key: 'stories', source: 'Stories', views: storyViewsTotal },
    { key: 'profile', source: 'Profile', views: profileViewsTotal }
  ];
  const trafficTotal = trafficRows.reduce((s, r) => s + r.views, 0) || 1;
  const trafficColors = { posts: '#e10075', live: '#7e00f3', stories: '#00d4ff', profile: '#6b7280' };
  const trafficSources = trafficRows
    .filter((r) => r.views > 0 || trafficTotal === 1)
    .map((r) => ({
      source: r.source,
      views: fmtNum(r.views),
      percentage: Math.round((r.views / trafficTotal) * 100),
      color: trafficColors[r.key]
    }));

  res.status(200).json({
    status: 'success',
    period,
    statsCards,
    subscriberGrowthData: {
      labels: growthLabels,
      total: growthTotal,
      new: growthNew,
      tooltip: {
        date: growthLabels[growthLabels.length - 1],
        total: `${fmtNum(growthTotal[growthTotal.length - 1] || 0)} Total`,
        new: `+${growthNew[growthNew.length - 1] || 0} New`
      }
    },
    earningsOverviewData: {
      labels: earnLabels,
      total: earnTotal,
      net: earnNet,
      tooltip: {
        date: earnLabels[earnLabels.length - 1],
        total: `${fmtCoin(earnTotal[earnTotal.length - 1] || 0)} Total`,
        net: `${fmtCoin(earnNet[earnNet.length - 1] || 0)} Net`
      }
    },
    insights,
    contentPerformance,
    trafficSources,
    creatorProfile: {
      name: profile.displayName || profile.username,
      handle: `@${profile.username}`,
      isVerified: !!profile.isVerifiedBadge,
      isOnline: !!profile.isOnline,
      avatar: profile.avatarUrl || ''
    }
  });
});

// ---------------------------------------------------------------------------
// EARNINGS PAGE
// ---------------------------------------------------------------------------
exports.getEarnings = catchAsync(async (req, res, next) => {
  const { tab = 'All Transactions' } = req.query;
  const creatorId = req.user._id;

  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) return next(new ApiError(404, 'Creator profile not found'));

  const { period = 'All Time' } = req.query;
  const { getPeriodStart } = require('../utils/periodRange');
  const periodStart = getPeriodStart(period);

  const [systemSetting] = await Promise.all([SystemSetting.findOne()]);
  const commRate = systemSetting ? systemSetting.commissionRate : 0.20;

  // All completed income + withdrawals (optionally scoped to the selected period)
  const incomeMatch = { receiverId: creatorId, status: 'completed', type: { $in: COMMISSION_TYPES } };
  if (periodStart) incomeMatch.createdAt = { $gte: periodStart };
  const txFilter = (t) => !periodStart || !t.createdAt || t.createdAt >= periodStart;
  const [income, withdrawals, allTx] = await Promise.all([
    Transaction.find(incomeMatch),
    Transaction.find({ senderId: creatorId, type: 'withdrawal' }),
    Transaction.find({
      $or: [{ receiverId: creatorId, status: 'completed', type: { $in: COMMISSION_TYPES } }, { senderId: creatorId, type: 'withdrawal' }]
    }).sort({ createdAt: -1 }).then((txs) => txs.filter(txFilter))
  ]);

  const grossTotal = sumTx(income);
  const netTotal = income.reduce((s, t) => s + netOfCommission(t.amountCoins || 0, commRate), 0);
  const pendingPayout = sumTx(withdrawals.filter((w) => w.status === 'pending'));
  const paidOut = sumTx(withdrawals.filter((w) => w.status === 'completed'));

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonth = income.filter((t) => t.createdAt >= monthStart);
  const thisMonthNet = thisMonth.reduce((s, t) => s + netOfCommission(t.amountCoins || 0, commRate), 0);
  const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const lastMonthNet = income
    .filter((t) => t.createdAt >= lastMonthStart && t.createdAt < monthStart)
    .reduce((s, t) => s + netOfCommission(t.amountCoins || 0, commRate), 0);
  const monthChange = pctChange(thisMonthNet, lastMonthNet);

  const earningsOverviewStats = [
    { label: 'Total Earnings', value: formatCoin(netTotal), change: 'Net of platform fee', changeType: 'info', icon: 'dollar', color: '#e10075' },
    { label: 'Pending Payout', value: formatCoin(pendingPayout), change: withdrawals.some((w) => w.status === 'pending') ? 'Processing' : 'No pending payouts', changeType: 'info', icon: 'clock', color: '#f59e0b' },
    { label: 'Paid Out', value: formatCoin(paidOut), change: 'Completed withdrawals', changeType: 'info', icon: 'check', color: '#10b981' },
    { label: 'This Month', value: formatCoin(thisMonthNet), change: `${monthChange >= 0 ? '+' : ''}${monthChange}% vs last month`, changeType: monthChange >= 0 ? 'positive' : 'negative', icon: 'trending', color: '#8b5cf6' }
  ];

  // Revenue breakdown by source, with a real % change vs the previous period
  const sourceDefs = [
    { key: 'subscription', source: 'Subscriptions', icon: 'users', color: '#e10075' },
    { key: 'gift', source: 'Tips & Gifts', icon: 'gift', color: '#f59e0b' },
    { key: 'ppv_unlock', source: 'PPV Content', icon: 'lock', color: '#3b82f6' },
    { key: 'video_calls', source: 'Video Calls', icon: 'video', color: '#10b981' },
    { key: 'audio_calls', source: 'Audio Calls', icon: 'phone', color: '#34d399' },
    { key: 'live_entry', source: 'Live Streams', icon: 'radio', color: '#ef4444' }
  ];

  // Previous period window (same length as the selected period, right before it)
  const prevWindowStart = periodStart
    ? new Date(periodStart.getTime() - (Date.now() - periodStart.getTime()))
    : null;
  const prevIncome = prevWindowStart
    ? await Transaction.find({ ...incomeMatch, createdAt: { $gte: prevWindowStart, $lt: periodStart } })
    : [];

  // Map call room IDs for gift transactions to attribute call gifts to Video or Audio calls
  const allCallRoomIds = [...new Set(
    [...income, ...prevIncome]
      .filter((t) => (t.type === 'gift' || t.type === 'tip') && t.metadata && t.metadata.callRoomId)
      .map((t) => t.metadata.callRoomId)
  )];
  let callRoomTypeMap = {};
  if (allCallRoomIds.length) {
    const logs = await CallLog.find({ roomId: { $in: allCallRoomIds } }).select('roomId type').lean();
    logs.forEach((l) => { callRoomTypeMap[l.roomId] = l.type; });
  }

  const sourceAmount = (txs, def) => {
    if (def.key === 'video_calls') {
      const billing = sumTx(txs.filter((t) => t.type === 'call_billing' && (!t.metadata || t.metadata.callType !== 'audio')));
      const gifts = sumTx(txs.filter((t) => (t.type === 'gift' || t.type === 'tip') && t.metadata?.callRoomId && callRoomTypeMap[t.metadata.callRoomId] === 'video'));
      return billing + gifts;
    }
    if (def.key === 'audio_calls') {
      const billing = sumTx(txs.filter((t) => t.type === 'call_billing' && t.metadata && t.metadata.callType === 'audio'));
      const gifts = sumTx(txs.filter((t) => (t.type === 'gift' || t.type === 'tip') && t.metadata?.callRoomId && callRoomTypeMap[t.metadata.callRoomId] === 'audio'));
      return billing + gifts;
    }
    if (def.key === 'gift') {
      return sumTx(txs.filter((t) => (t.type === 'gift' || t.type === 'tip') && (!t.metadata || !t.metadata.callRoomId || !callRoomTypeMap[t.metadata.callRoomId])));
    }
    return sumTx(txs.filter((t) => t.type === def.key));
  };

  const revenueBreakdown = sourceDefs.map((def) => {
    const amount = sourceAmount(income, def);
    const prevAmount = sourceAmount(prevIncome, def);
    const percentage = grossTotal > 0 ? Math.round((amount / grossTotal) * 100) : 0;
    const change = prevAmount > 0 ? Math.round(((amount - prevAmount) / prevAmount) * 100) : (amount > 0 ? 100 : 0);
    return {
      source: def.source,
      amount: `${amount} coins`,
      percentage,
      color: def.color,
      icon: def.icon,
      change: `${change >= 0 ? '+' : ''}${change}%`,
      // 0% stays green (positive) so a flat trend doesn't read as a warning
      changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'positive'
    };
  });

  const earningsTabs = ['All Transactions', 'Subscriptions', 'Gifts', 'PPV Unlocks', 'Video Calls', 'Audio Calls', 'Live Streams'];

  // Pre-lookup CallLog call types for all call_billing transactions to ensure accurate Audio vs Video filtering
  const unmappedCallBillingTxs = allTx.filter((t) => t.type === 'call_billing' && (!t.metadata || !t.metadata.callType));
  const callLogIds = [...new Set(unmappedCallBillingTxs.map((t) => t.referenceId).filter(Boolean))];
  const callLogs = callLogIds.length
    ? await CallLog.find({ _id: { $in: callLogIds } }).select('type')
    : [];
  const callTypeMap = {};
  callLogs.forEach((cl) => { callTypeMap[cl._id.toString()] = cl.type; });

  const getTxCallType = (t) => {
    if (t.metadata && t.metadata.callType) return t.metadata.callType;
    if (t.referenceId && callTypeMap[t.referenceId.toString()]) return callTypeMap[t.referenceId.toString()];
    return 'video';
  };

  // Transaction history filtered by tab
  const tabTypeMap = {
    'Subscriptions': 'subscription',
    'Gifts': 'gift',
    'PPV Unlocks': 'ppv_unlock',
    'Video Calls': 'call_billing',
    'Audio Calls': 'call_billing',
    'Live Streams': 'live_entry'
  };
  let historyTxs = allTx;
  if (tabTypeMap[tab]) {
    if (tab === 'Gifts') {
      historyTxs = allTx.filter((t) => t.type === 'gift' || t.type === 'tip');
    } else {
      historyTxs = allTx.filter((t) => t.type === tabTypeMap[tab]);
      if (tab === 'Audio Calls') {
        historyTxs = historyTxs.filter((t) => getTxCallType(t) === 'audio');
      } else if (tab === 'Video Calls') {
        historyTxs = historyTxs.filter((t) => getTxCallType(t) !== 'audio');
      }
    }
  }

  const sliceTxs = historyTxs.slice(0, 100);

  // Resolve sender (fan) display info for the transaction table
  const senderIds = [...new Set(sliceTxs.map((t) => t.senderId).filter(Boolean))];
  const senders = senderIds.length
    ? await User.find({ _id: { $in: senderIds } }).select('username displayName avatarUrl')
    : [];
  const senderMap = {};
  senders.forEach((s) => { senderMap[s._id.toString()] = s; });

  const transactionHistory = sliceTxs.map((t, idx) => {
    const sender = t.senderId ? senderMap[t.senderId.toString()] : null;
    const callType = t.type === 'call_billing' ? getTxCallType(t) : undefined;
    const resolvedSource = t.type === 'call_billing'
      ? (callType === 'audio' ? 'Audio Calls' : 'Video Calls')
      : t.type === 'withdrawal' ? 'Withdrawal' : 'Creator earnings';

    return {
      id: idx + 1,
      type: t.type,
      callType: callType || (t.type === 'call_billing' ? 'video' : undefined),
      description: t.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      source: resolvedSource,
      user: sender ? (sender.displayName || sender.username) : 'Platform',
      avatar: sender ? (sender.avatarUrl || '') : '',
      date: t.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: t.createdAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      amount: `${t.type === 'withdrawal' ? '-' : '+'}${t.amountCoins || 0} coins`,
      amountType: t.type === 'withdrawal' ? 'negative' : 'positive',
      status: t.type === 'withdrawal' ? 'Withdrawal' : t.status === 'completed' ? 'Completed' : t.status,
      coins: t.amountCoins || 0,
      isWithdrawal: t.type === 'withdrawal'
    };
  });

  // Monthly earnings (last 6 months)
  const monthlyEarnings = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const net = income
      .filter((t) => t.createdAt >= start && t.createdAt < end)
      .reduce((s, t) => s + netOfCommission(t.amountCoins || 0, commRate), 0);
    monthlyEarnings.push({ month: label, amount: Number(net.toFixed(2)) });
  }

  // Top subscribers by total spend
  const fanAgg = await Transaction.aggregate([
    {
      $match: {
        receiverId: creatorId,
        senderId: { $exists: true, $ne: null },
        status: 'completed',
        type: { $in: COMMISSION_TYPES }
      }
    },
    { $group: { _id: '$senderId', totalSpent: { $sum: '$amountCoins' }, count: { $sum: 1 } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 }
  ]);
  const populatedFans = await User.populate(fanAgg, { path: '_id', select: 'username displayName avatarUrl' });
  const topSubscribers = populatedFans.map((f, idx) => ({
    rank: idx + 1,
    name: f._id ? (f._id.displayName || f._id.username) : 'Fan',
    username: f._id ? f._id.username : '',
    avatar: f._id ? (f._id.avatarUrl || '') : '',
    spent: `${f.totalSpent} coins`,
    spentCoins: f.totalSpent
  }));

  // Payout history
  const payoutHistory = withdrawals.slice(0, 20).map((w, idx) => ({
    id: idx + 1,
    date: w.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    method: w.metadata && w.metadata.method ? w.metadata.method : 'Internal',
    amount: `${w.amountCoins || 0} coins`,
    status: w.status === 'completed' ? 'Completed' : w.status === 'pending' ? 'Pending' : w.status === 'failed' ? 'Failed' : w.status
  }));

  // Next payout estimate: pending withdrawals, else first completed (for display)
  const nextPayout = withdrawals.find((w) => w.status === 'pending') || withdrawals[0] || null;

  // Real conversion rate: unique paying fans in the period ÷ profile followers (clamped to 100%)
  const uniquePayers = new Set(income.map((t) => t.senderId && t.senderId.toString()).filter(Boolean)).size;
  const conversionRate = profile.followerCount > 0
    ? `${Math.min(100, (uniquePayers / profile.followerCount) * 100).toFixed(1)}%`
    : '—';

  // Real refund rate: refunded earnings transactions ÷ all creator income transactions
  const refundedCount = await Transaction.countDocuments({
    receiverId: creatorId,
    status: 'refunded',
    type: { $in: COMMISSION_TYPES }
  });
  const allIncomeCount = await Transaction.countDocuments(incomeMatch);
  const refundRate = allIncomeCount > 0
    ? `${((refundedCount / allIncomeCount) * 100).toFixed(1)}%`
    : '0.0%';

  const averageRating = profile.ratingCount > 0
    ? `${Number(profile.rating || 0).toFixed(1)} / 5`
    : '—';

  const quickStats = {
    period: 'This Month',
    averageOrderValue: `${thisMonth.length ? Math.round(sumTx(thisMonth) / thisMonth.length) : 0} coins`,
    conversionRate,
    refundRate,
    averageRating
  };

  res.status(200).json({
    status: 'success',
    earningsOverviewStats,
    revenueBreakdown,
    earningsTabs,
    transactionHistory,
    monthlyEarnings,
    topSubscribers,
    payoutHistory,
    quickStats,
    nextPayout: nextPayout
      ? {
          amountCoins: nextPayout.amountCoins || 0,
          date: nextPayout.createdAt,
          method: nextPayout.metadata && nextPayout.metadata.method ? nextPayout.metadata.method : 'Bank Transfer',
          gateway: nextPayout.gateway || 'internal'
        }
      : null
  });
});

// ---------------------------------------------------------------------------
// CONTENT PAGE
// ---------------------------------------------------------------------------
exports.getMyContent = catchAsync(async (req, res, next) => {
  const { tab = 'All Content', type = 'All Types', sort = 'Newest First', page = 1, limit = 10, period = 'All Time' } = req.query;
  const creatorId = req.user._id;

  let periodStart = null;
  const now = new Date();
  if (period === 'Today') periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === 'Last 7 Days') periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (period === 'Last 30 Days') periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  else if (period === 'Last 90 Days') periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  else if (period === 'This Month') periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === 'Last Month') periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  else if (period === 'This Year') periodStart = new Date(now.getFullYear(), 0, 1);

  let posts = await Post.find({ creatorId }).sort({ createdAt: -1 });
  let stories = await Story.find({ creatorId }).sort({ createdAt: -1 });

  if (periodStart) {
    posts = posts.filter((p) => p.createdAt >= periodStart);
    stories = stories.filter((s) => s.createdAt >= periodStart);
  }

  const openCount = posts.filter((p) => p.postType !== 'ppv').length;
  const lockedCount = posts.filter((p) => p.postType === 'ppv').length;
  const storyCount = stories.length;

  // viewsCount is not a real field on Post — compute likes + comments as engagement proxy
  const ppvTx = await Transaction.find({ receiverId: creatorId, type: 'ppv_unlock', status: 'completed' });
  const unlocksByPost = {};
  ppvTx.forEach((t) => {
    if (t.referenceId) unlocksByPost[t.referenceId.toString()] = (unlocksByPost[t.referenceId.toString()] || 0) + 1;
  });

  const items = [
    ...posts.map((p) => ({
      _id: p._id,
      title: p.content ? (p.content.length > 40 ? `${p.content.slice(0, 40)}...` : p.content) : '(No caption)',
      type: p.postType === 'ppv' ? 'PPV' : p.media && p.media[0] ? (p.media[0].type === 'video' ? 'Video' : 'Image') : 'Post',
      status: p.postType === 'ppv' ? 'Locked' : 'Open',
      date: p.createdAt,
      views: unlocksByPost[p._id.toString()] || (p.likes ? p.likes.length : 0),
      likes: p.likes ? p.likes.length : 0,
      comments: p.commentCount || 0,
      thumbnail: p.media && p.media[0] ? p.media[0].thumbnailUrl || p.media[0].url : '',
      mediaType: p.media && p.media[0] ? p.media[0].type : '',
      priceCoins: p.coinPrice || 0,
      postType: p.postType,
      isStory: false
    })),
    ...stories.map((s) => ({
      _id: s._id,
      title: 'Story',
      type: 'Story',
      status: 'Open',
      date: s.createdAt,
      views: s.views ? s.views.length : 0,
      likes: 0,
      comments: 0,
      thumbnail: s.mediaUrl || '',
      mediaType: s.mediaType || '',
      priceCoins: 0,
      postType: 'story',
      isStory: true
    }))
  ];

  // Filtering
  let filtered = items;
  if (tab === 'Open Content') filtered = filtered.filter((i) => i.status === 'Open' && !i.isStory);
  if (tab === 'Locked Content') filtered = filtered.filter((i) => i.status === 'Locked');
  if (tab === 'Stories') filtered = filtered.filter((i) => i.isStory);
  if (type !== 'All Types') {
    filtered = filtered.filter((i) => i.type === type || (type === 'Story' && i.isStory) || (type === 'Image' && i.mediaType === 'image') || (type === 'Video' && i.mediaType === 'video'));
  }

  // Sorting
  if (sort === 'Oldest First') filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sort === 'Most Viewed') filtered.sort((a, b) => b.views - a.views);
  else if (sort === 'Most Liked') filtered.sort((a, b) => b.likes - a.likes);
  else filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  // Breakdown — percentages are relative to the categorized total so the donut
  // ring fills completely (posts without media are excluded from the ring).
  // Order is Stories → Images → Videos so pink sits between blue and purple on the ring.
  const imageCount = posts.filter((p) => p.media && p.media[0] && p.media[0].type === 'image').length;
  const videoCount = posts.filter((p) => p.media && p.media[0] && p.media[0].type === 'video').length;
  const categorizedTotal = imageCount + videoCount + storyCount || 1;
  const pctOf = (count) => Math.round((count / categorizedTotal) * 100);
  const categories = [
    { label: 'Stories', percentage: pctOf(storyCount), count: storyCount, color: '#3b82f6' },
    { label: 'Images', percentage: pctOf(imageCount), count: imageCount, color: '#e10075' },
    { label: 'Videos', percentage: pctOf(videoCount), count: videoCount, color: '#9b51e0' }
  ];

  const topPerformingContent = [...items]
    .filter((i) => !i.isStory)
    .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
    .slice(0, 3)
    .map((i) => ({
      id: i._id,
      title: i.title,
      type: i.type,
      thumbnail: i.thumbnail,
      views: fmtNum(i.views),
      likes: i.likes
    }));

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newThisMonth = posts.filter((p) => p.createdAt >= monthStart).length;

  res.status(200).json({
    status: 'success',
    contentOverview: {
      period: 'This Month',
      periodOptions: ['This Month', 'Last Month', 'This Year', 'All Time'],
      stats: [
        { label: 'Total Posts', value: String(posts.length + storyCount), change: 'All time', changeType: 'positive' },
        { label: 'Open Posts', value: String(openCount), change: 'Free + subscription', changeType: 'positive' },
        { label: 'Locked Posts', value: String(lockedCount), change: 'PPV content', changeType: 'positive' },
        { label: 'Stories', value: String(storyCount), change: `${newThisMonth} new this month`, changeType: 'info' }
      ]
    },
    contentBreakdown: { total: items.length, categories },
    topPerformingContent,
    recentContent: paged,
    pagination: { currentPage: page, totalPages, total }
  });
});

// ---------------------------------------------------------------------------
// PPV PAGE
// ---------------------------------------------------------------------------
exports.getMyPPV = catchAsync(async (req, res, next) => {
  const { tab = 'All Content', page = 1, limit = 10 } = req.query;
  const creatorId = req.user._id;

  const posts = await Post.find({ creatorId, postType: 'ppv' }).sort({ createdAt: -1 });
  const ppvTx = await Transaction.find({ receiverId: creatorId, type: 'ppv_unlock', status: 'completed' });

  const unlocksByPost = {};
  ppvTx.forEach((t) => {
    if (t.referenceId) unlocksByPost[t.referenceId.toString()] = (unlocksByPost[t.referenceId.toString()] || 0) + 1;
  });
  const totalUnlocks = ppvTx.length;
  const totalRevenue = sumTx(ppvTx);

  let topPerformer = null;
  let topPerformerRevenue = 0;
  posts.forEach((p) => {
    const rev = (unlocksByPost[p._id.toString()] || 0) * p.coinPrice;
    if (rev > topPerformerRevenue) {
      topPerformerRevenue = rev;
      topPerformer = p;
    }
  });

  const ppvStats = [
    { label: 'Total Locked Content', value: String(posts.length), change: `${posts.filter((p) => p.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} new this month`, changeType: 'info', icon: 'lock', color: '#e10075' },
    { label: 'Total Unlocks', value: fmtNum(totalUnlocks), change: 'All time', changeType: 'positive', icon: 'unlock', color: '#3b82f6' },
    { label: 'Total Revenue', value: formatCoin(totalRevenue), change: 'Gross PPV income', changeType: 'positive', icon: 'dollar', color: '#9b51e0' },
    { label: 'Top Performer', value: topPerformer ? (topPerformer.content ? topPerformer.content.slice(0, 20) : 'PPV item') : '—', change: `${topPerformerRevenue} coins earned`, changeType: 'earnings', icon: 'flame', color: '#f59e0b' }
  ];

  let filtered = posts.map((p) => ({
    _id: p._id,
    title: p.content ? (p.content.length > 40 ? `${p.content.slice(0, 40)}...` : p.content) : 'PPV Content',
    thumbnail: p.media && p.media[0] ? p.media[0].thumbnailUrl || p.media[0].url : '',
    type: p.media && p.media[0] ? (p.media[0].type === 'video' ? 'Video' : 'Image') : 'Image',
    priceCoins: p.coinPrice || 0,
    unlocks: unlocksByPost[p._id.toString()] || 0,
    revenue: (unlocksByPost[p._id.toString()] || 0) * p.coinPrice,
    date: p.createdAt,
    isHidden: !!p.isHidden,
    status: p.isHidden ? 'Hidden' : 'Active',
    postId: p._id
  }));

  if (tab === 'Images') filtered = filtered.filter((i) => i.type === 'Image');
  if (tab === 'Videos') filtered = filtered.filter((i) => i.type === 'Video');

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    status: 'success',
    ppvStats,
    recentPPV: paged,
    pagination: { currentPage: page, totalPages, total }
  });
});

// ---------------------------------------------------------------------------
// CALL STATS PAGE (audio / video)
// ---------------------------------------------------------------------------
exports.getCallStats = catchAsync(async (req, res, next) => {
  const { type } = req.params; // 'audio' | 'video'
  if (!['audio', 'video'].includes(type)) {
    return next(new ApiError(400, 'Invalid call type'));
  }
  const creatorId = req.user._id;
  const { period = 'All Time' } = req.query;
  const { getPeriodBounds } = require('../utils/periodRange');
  const { start: periodStart, prevStart, prevEnd, prevLabel, showChange } = getPeriodBounds(period);

  const systemSetting = await SystemSetting.findOne();
  const commRate = systemSetting ? systemSetting.commissionRate : 0.20;

  const callQuery = { receiverId: creatorId, type };
  if (periodStart) callQuery.createdAt = { $gte: periodStart };

  // Calls where the creator is the receiver (fan → creator), which is the billing direction
  const calls = await CallLog.find(callQuery).sort({ createdAt: -1 });

  // Previous equivalent-length window (same span right before the selected one).
  // For 'All Time' there is no earlier window, so no comparison is computed.
  let prevCalls = [];
  if (prevStart && prevEnd) {
    prevCalls = await CallLog.find({ receiverId: creatorId, type, createdAt: { $gte: prevStart, $lt: prevEnd } });
  }

  // Gifts per call room ID
  const roomIds = calls.map((c) => c.roomId).filter(Boolean);
  let giftsByRoom = {};
  if (roomIds.length) {
    const giftTxs = await Transaction.find({
      type: 'gift',
      status: 'completed',
      'metadata.callRoomId': { $in: roomIds }
    }).select('amountCoins metadata').lean();
    giftsByRoom = giftTxs.reduce((acc, g) => {
      const room = g.metadata && g.metadata.callRoomId;
      if (!room) return acc;
      acc[room] = (acc[room] || 0) + (Number(g.amountCoins) || 0);
      return acc;
    }, {});
  }

  // Previous window gifts per call room ID
  const prevRoomIds = prevCalls.map((c) => c.roomId).filter(Boolean);
  let prevGiftsByRoom = {};
  if (prevRoomIds.length) {
    const prevGiftTxs = await Transaction.find({
      type: 'gift',
      status: 'completed',
      'metadata.callRoomId': { $in: prevRoomIds }
    }).select('amountCoins metadata').lean();
    prevGiftsByRoom = prevGiftTxs.reduce((acc, g) => {
      const room = g.metadata && g.metadata.callRoomId;
      if (!room) return acc;
      acc[room] = (acc[room] || 0) + (Number(g.amountCoins) || 0);
      return acc;
    }, {});
  }

  const completedCalls = calls.filter((c) => c.status === 'completed');
  const missedCalls = calls.filter((c) => c.status === 'missed' || c.status === 'rejected');
  const pendingCalls = calls.filter((c) => c.status === 'initiated' || c.status === 'active');

  const totalMinutes = completedCalls.reduce((s, c) => s + (c.totalMinutesBilling || 0), 0);
  const totalEarned = completedCalls.reduce((s, c) => s + (c.totalCoinsBilled || 0) + (giftsByRoom[c.roomId] || 0), 0);

  // Change for the stat cards: same-length previous window vs the selected one
  const prevCompleted = prevCalls.filter((c) => c.status === 'completed');
  const prevEarned = prevCompleted.reduce((s, c) => s + (c.totalCoinsBilled || 0) + (prevGiftsByRoom[c.roomId] || 0), 0);
  const prevMinutes = prevCompleted.reduce((s, c) => s + (c.totalMinutesBilling || 0), 0);
  const prevMissed = prevCalls.filter((c) => c.status === 'missed' || c.status === 'rejected').length;
  const fmtPct = (cur, prev) => `${prev > 0 ? (cur >= prev ? '+' : '-') : cur > 0 ? '+' : ''}${prev > 0 ? Math.abs(Math.round(((cur - prev) / prev) * 100)) : cur > 0 ? 100 : 0}%`;
  const changeOf = (cur, prev) => (showChange ? fmtPct(cur, prev) : '');

  // Peak hours (calls grouped by hour, all time) — 24 data points for the chart
  const hourCounts = Array(24).fill(0);
  calls.forEach((c) => {
    const h = new Date(c.createdAt).getHours();
    hourCounts[h] += 1;
  });
  const peakHourIdx = hourCounts.indexOf(Math.max(...hourCounts));
  const peakTime = peakHourIdx >= 0 ? `${((peakHourIdx + 11) % 12) + 1}${peakHourIdx >= 12 ? 'PM' : 'AM'} - ${(((peakHourIdx + 12) % 12) + 1) || 12}${peakHourIdx + 1 >= 12 ? 'PM' : 'AM'}` : '—';
  const hoursChart = [];
  const hourLabels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM', '12AM'];
  for (let h = 0; h < 24; h += 2) {
    hoursChart.push({ label: hourLabels[h / 2] || '', value: hourCounts[h] + hourCounts[h + 1] });
  }
  const maxHourCalls = Math.max(1, ...hoursChart.map((x) => x.value));
  const peakHourCount = Math.max(...hourCounts);
  const boostPercentage = peakHourCount && totalMinutes ? Math.round((peakHourCount / Math.max(1, calls.length)) * 100) : 0;

  // Daily minutes this week
  const dailyMinutes = [];
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let maxDaily = 1;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    const mins = completedCalls
      .filter((c) => c.createdAt >= start && c.createdAt <= end)
      .reduce((s, c) => s + (c.totalMinutesBilling || 0), 0);
    maxDaily = Math.max(maxDaily, mins);
    dailyMinutes.push({ day: weekLabels[d.getDay()], minutes: mins });
  }

  const completionRate = calls.length ? Math.round((completedCalls.length / calls.length) * 100) : 0;

  const missedChange = changeOf(missedCalls.length, prevMissed);
  const callStats = [
    { id: 'totalCalls', label: 'Total Calls', value: String(calls.length), change: changeOf(calls.length, prevCalls.length), changeType: 'positive', period: prevLabel, icon: 'phone', color: '#3b82f6' },
    { id: 'totalMinutes', label: 'Total Minutes', value: fmtNum(totalMinutes), change: changeOf(totalMinutes, prevMinutes), changeType: 'positive', period: prevLabel, icon: 'clock', color: '#8b5cf6' },
    { id: 'earnings', label: 'Earnings', value: formatCoin(totalEarned), change: changeOf(totalEarned, prevEarned), changeType: 'positive', period: prevLabel, icon: 'dollar', color: '#10b981' },
    { id: 'missedCalls', label: 'Missed Calls', value: String(missedCalls.length), change: missedChange, changeType: missedChange.startsWith('-') ? 'positive' : 'negative', period: prevLabel, icon: 'phoneMissed', color: '#ef4444' }
  ];

  // Recent calls
  const fanIds = [...new Set(calls.map((c) => c.callerId ? c.callerId.toString() : '').filter(Boolean))];
  const fans = fanIds.length ? await User.find({ _id: { $in: fanIds } }).select('username displayName avatarUrl') : [];
  const fanMap = {};
  fans.forEach((f) => { fanMap[f._id.toString()] = f; });

  const recentCalls = calls.slice(0, 30).map((c, idx) => {
    const fan = c.callerId ? fanMap[c.callerId.toString()] : null;
    const date = c.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = c.createdAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    let durSecs = 0;
    if (c.startedAt && c.endedAt) {
      durSecs = Math.max(0, Math.floor((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000));
    } else if (c.startedAt && c.status === 'active') {
      durSecs = Math.max(0, Math.floor((Date.now() - new Date(c.startedAt).getTime()) / 1000));
    } else if (c.totalMinutesBilling) {
      durSecs = c.totalMinutesBilling * 60;
    }
    const mins = Math.floor(durSecs / 60);
    const secs = durSecs % 60;
    const exactDurationStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const giftsEarned = giftsByRoom[c.roomId] || 0;
    const totalCallEarned = (c.totalCoinsBilled || 0) + giftsEarned;

    return {
      id: idx + 1,
      createdAt: c.createdAt,
      fan: {
        name: fan ? (fan.displayName || fan.username) : 'Fan',
        avatar: fan ? (fan.avatarUrl || '') : '',
        isVerified: false
      },
      dateTime: `${date}\n${time}`,
      date,
      time,
      duration: exactDurationStr,
      gifts: giftsEarned > 0 ? `${giftsEarned} coins` : '0 coins',
      earned: `${totalCallEarned} coins`,
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
      type: c.type === 'video' ? 'Video Call' : 'Audio Call',
      typeIcon: c.type === 'video' ? 'video' : 'phone',
      coins: totalCallEarned
    };
  });

  const profile = await CreatorProfile.findOne({ userId: creatorId }).select('rates audioAvailable videoAvailable isOnline');

  res.status(200).json({
    status: 'success',
    type,
    audioRate: profile && profile.rates ? profile.rates.audioCallPerMin || 0 : 0,
    videoRate: profile && profile.rates ? profile.rates.videoCallPerMin || 0 : 0,
    audioAvailable: profile ? profile.audioAvailable : true,
    videoAvailable: profile ? profile.videoAvailable : true,
    isOnline: profile ? !!profile.isOnline : false,
    callStats,
    // Period-scoped earnings for the sidebar "Call Earnings" card — mirrors the
    // mid-section Earnings stat card (selected period's totals, week-over-week change).
    earnings: {
      amount: `${totalEarned} coins`,
      change: changeOf(totalEarned, prevEarned),
      changeLabel: prevLabel,
      totalMinutes,
      completedCalls: completedCalls.length,
      missedCalls: missedCalls.length,
      estimatedPayout: `${netOfCommission(totalEarned, commRate)} coins`,
      totalEarnedRaw: totalEarned,
      prevEarnedRaw: prevEarned,
      estimatedPayoutRaw: netOfCommission(totalEarned, commRate)
    },
    performanceData: {
      totalMinutes,
      completed: {
        minutes: completedCalls.reduce((s, c) => s + (c.totalMinutesBilling || 0), 0),
        count: completedCalls.length,
        percentage: completionRate,
        color: type === 'audio' ? '#10b981' : '#3b82f6'
      },
      missed: {
        count: missedCalls.length,
        percentage: calls.length ? Math.round((missedCalls.length / calls.length) * 100) : 0,
        color: '#f43f5e'
      },
      pending: {
        count: pendingCalls.length,
        percentage: calls.length ? Math.round((pendingCalls.length / calls.length) * 100) : 0,
        color: '#eab308'
      }
    },
    dailyMinutes: { period: 'This Week', days: dailyMinutes, maxY: maxDaily },
    peakHours: {
      period: 'All Time',
      peakTime,
      boostPercentage: `${boostPercentage}%`,
      hours: hoursChart,
      maxY: maxHourCalls
    },
    rawTotals: {
      totalCalls: calls.length,
      totalMinutes,
      totalEarned,
      missedCalls: missedCalls.length,
      pendingCalls: pendingCalls.length,
      prevTotalCalls: prevCalls.length,
      prevTotalMinutes: prevMinutes,
      prevEarned,
      prevMissed: prevMissed
    },
    recentCalls,
    callTabs: ['All', 'Completed', 'Missed', 'Pending']
  });
});

// ---------------------------------------------------------------------------
// MY PROFILE PAGE (view + edit data)
// ---------------------------------------------------------------------------
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) return next(new ApiError(404, 'Creator profile not found'));

  const user = await User.findById(req.user._id);

  // Fan spotlight: top spender
  const fanAgg = await Transaction.aggregate([
    {
      $match: {
        receiverId: req.user._id,
        senderId: { $exists: true, $ne: null, $ne: req.user._id },
        status: 'completed',
        type: { $in: COMMISSION_TYPES }
      }
    },
    { $group: { _id: '$senderId', totalSpent: { $sum: '$amountCoins' }, count: { $sum: 1 } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 1 }
  ]);
  const topFan = fanAgg.length ? (await User.populate(fanAgg, { path: '_id', select: 'username displayName avatarUrl' }))[0] : null;

  // Recent content
  const posts = await Post.find({ creatorId: req.user._id }).sort({ createdAt: -1 }).limit(6);
  const recentContentItems = posts.map((p) => ({
    id: p._id,
    title: p.content ? (p.content.length > 40 ? `${p.content.slice(0, 40)}...` : p.content) : 'New post',
    timestamp: p.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    thumbnail: p.media && p.media[0] ? p.media[0].thumbnailUrl || p.media[0].url : '',
    badge: p.postType === 'ppv' ? 'LOCKED' : p.media && p.media[0] && p.media[0].type === 'video' ? 'VIDEO' : 'NEW',
    badgeColor: p.postType === 'ppv' ? '#e10075' : p.media && p.media[0] && p.media[0].type === 'video' ? '#8b5cf6' : '#10b981',
    stats: { comments: p.commentCount || 0, likes: p.likes ? p.likes.length : 0 }
  }));

  const tips = await Transaction.find({ receiverId: req.user._id, type: 'tip', status: 'completed' });
  const tipTotal = sumTx(tips);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newSubsThisMonth = await Subscription.countDocuments({ creatorId: req.user._id, createdAt: { $gte: monthStart } });

  const planTiers = (profile.subscriptionPlans && profile.subscriptionPlans.length
    ? profile.subscriptionPlans.filter((p) => p.isActive !== false)
    : [{ name: 'Monthly Plan', priceCoins: profile.rates.subscriptionMonthly || 0, features: ['Exclusive posts & videos', 'Member-only stories', 'Priority messages', 'Cancel anytime'] }]);

  res.status(200).json({
    status: 'success',
    creatorProfile: {
      name: profile.displayName || profile.username,
      handle: `@${profile.username}`,
      avatar: profile.avatarUrl || '',
      coverImage: profile.coverBannerUrl || '',
      isVerified: !!profile.isVerifiedBadge,
      verificationStatus: profile.verificationStatus,
      isOnline: !!profile.isOnline,
      role: 'Creator',
      bio: profile.bio || '',
      location: profile.country || '',
      languages: profile.language || 'English',
      memberSince: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '',
      responseTime: 'Within a few hours',
      categories: profile.categories || [],
      audioAvailable: profile.audioAvailable,
      videoAvailable: profile.videoAvailable
    },
    profileStats: [
      { label: 'Subscribers', value: fmtNum(profile.subscriberCount || 0), icon: 'subscribers' },
      { label: 'Followers', value: fmtNum(profile.followerCount || 0), icon: 'followers' },
      { label: 'Profile Views', value: fmtNum(profile.profileViews || 0), icon: 'views' },
      { label: 'Tips Received', value: formatCoin(tipTotal), icon: 'tips' },
      { label: 'Content', value: String(posts.length), icon: 'content' }
    ],
    actionButtons: [
      { label: 'Subscribe', sublabel: `${profile.rates.subscriptionMonthly || 0} coins / month`, icon: 'star', variant: 'primary' },
      { label: 'Message', sublabel: '', icon: 'message', variant: 'secondary' },
      { label: 'Audio Call', sublabel: `${profile.rates.audioCallPerMin || 0} coins / min`, icon: 'phone', variant: 'outline' },
      { label: 'Video Call', sublabel: `${profile.rates.videoCallPerMin || 0} coins / min`, icon: 'video', variant: 'outline' },
      { label: 'Send Tip', sublabel: '', icon: 'gift', variant: 'outline' }
    ],
    subscriptionPlans: {
      title: 'Subscription Plans',
      subtitle: 'Choose the perfect plan to unlock exclusive content and connect with me.',
      plans: planTiers.map((p) => ({
        name: p.name,
        price: `${p.priceCoins} coins`,
        period: '/ month',
        features: p.features || []
      }))
    },
    callRates: {
      title: 'Call Rates',
      subtitle: '1:1 private calls with me',
      rates: [
        { type: 'Audio Call', rate: `${profile.rates.audioCallPerMin || 0}`, unit: 'coins / min', description: 'Talk one-on-one with me', color: '#3b82f6' },
        { type: 'Video Call', rate: `${profile.rates.videoCallPerMin || 0}`, unit: 'coins / min', description: 'Face-to-face connection', color: '#8b5cf6' }
      ]
    },
    profileInsights: {
      title: 'Profile Insights',
      period: 'This Month',
      stats: [
        { label: 'Profile Views', value: fmtNum(profile.profileViews || 0), change: 'All time', changeType: 'positive' },
        { label: 'New Subscribers', value: String(newSubsThisMonth), change: 'This month', changeType: 'positive' },
        { label: 'Tips Received', value: formatCoin(tipTotal), change: 'All time', changeType: 'positive' }
      ]
    },
    fanSpotlight: {
      title: 'Fan Spotlight',
      fan: topFan && topFan._id ? {
        name: topFan._id.displayName || topFan._id.username,
        avatar: topFan._id.avatarUrl || '',
        isVerified: false,
        label: 'Top Fan',
        spent: `${topFan.totalSpent} coins`,
        message: 'Your biggest supporter this month!'
      } : null
    },
    recentContent: {
      title: 'Recent Content',
      tabs: ['All', 'Photos', 'Videos', 'Stories'],
      items: recentContentItems
    },
    subscribeSave: {
      title: 'Subscribe & Save',
      subtitle: 'Subscribe for exclusive content, special offers, and more!',
      price: `${profile.rates.subscriptionMonthly || 0} coins / month`
    }
  });
});

// ---------------------------------------------------------------------------
// CREATOR SETTINGS PAGE (view + save)
// ---------------------------------------------------------------------------
exports.getMySettings = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError(404, 'User not found'));

  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) return next(new ApiError(404, 'Creator profile not found'));

  const wallet = await mongoose.model('Wallet').findOne({ userId: req.user._id });
  const blockedCount = user.blockedUsers ? user.blockedUsers.length : 0;
  const prefs = user.notificationPreferences || {};
  const twoFactorEnabled = !!user.twoFactorEnabled;
  const isEmailVerified = !!user.isVerified;
  const isProfileVerified = profile.verificationStatus === 'approved';

  // Simple security score derived from real account state
  let score = 40;
  if (isEmailVerified) score += 20;
  if (twoFactorEnabled) score += 20;
  if (isProfileVerified) score += 10;
  if (user.password) score += 10;
  score = Math.min(100, score + (user.loginActivity && user.loginActivity.length > 0 ? 10 : 0));
  const scoreStrength = score >= 80 ? 'Strong' : score >= 50 ? 'Good' : 'Weak';

  const payoutMethod = wallet && wallet.payoutMethod
    ? wallet.payoutMethod
    : { accountHolder: user.displayName || user.username, bankName: 'Bank Transfer', accountNumber: '•••• 0000', verified: isProfileVerified };

  res.status(200).json({
    status: 'success',
    profileData: {
      displayName: user.displayName || profile.displayName || user.username,
      username: profile.username || user.username,
      email: user.email,
      bio: profile.bio || user.bio || '',
      bioMaxLength: 500,
      avatar: profile.avatarUrl || user.avatarUrl || '',
      verified: isProfileVerified,
      creatorSince: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—',
      rateAudio: profile.rates.audioCallPerMin || 0,
      rateVideo: profile.rates.videoCallPerMin || 0,
      subscriptionPrice: profile.rates.subscriptionMonthly || 0
    },
    accountStatus: {
      status: user.isSuspended ? 'Suspended' : 'Active',
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
      accountType: 'Creator'
    },
    verificationProgress: {
      verified: isProfileVerified,
      emailVerified: isEmailVerified,
      idVerified: isProfileVerified,
      profileVerified: isProfileVerified,
      verificationStatus: profile.verificationStatus
    },
    securityScore: {
      score,
      strength: scoreStrength,
      description: score >= 80 ? 'Your account is well protected.' : 'Strengthen your account security to reach a higher score.',
      passwordStrength: 'Good',
      twoFactorAuth: twoFactorEnabled ? 'Enabled' : 'Disabled',
      emailVerified: isEmailVerified ? 'Verified' : 'Unverified',
      activeSessions: `${(user.loginActivity && user.loginActivity.length) || 0} Recent`
    },
    payoutSettings: {
      accountHolder: payoutMethod.accountHolder || '',
      bankName: payoutMethod.bankName || 'Bank Transfer',
      routingNumber: payoutMethod.routingNumber ? String(payoutMethod.routingNumber).replace(/\d(?=\d{4})/g, '*') : '•••• 0000',
      accountNumber: payoutMethod.accountNumber ? String(payoutMethod.accountNumber).replace(/\d(?=\d{4})/g, '*') : '•••• 0000',
      verified: !!payoutMethod.verified,
      payoutSchedule: payoutMethod.payoutSchedule || 'weekly',
      minimumPayout: payoutMethod.minimumPayout || 100,
      currency: payoutMethod.currency ? { usd: 'USD — US Dollar', eur: 'EUR — Euro', gbp: 'GBP — British Pound' }[payoutMethod.currency] : 'USD — US Dollar'
    },
    notifications: [
      { id: 'newMessages', label: 'New Messages', enabled: prefs.newMessages !== false },
      { id: 'newSubscribers', label: 'New Subscribers', enabled: prefs.newSubscribers !== false },
      { id: 'tipsPayments', label: 'Tips & Payments', enabled: prefs.tipsAndPayments !== false },
      { id: 'streamReminders', label: 'Stream Reminders', enabled: prefs.liveStreamReminders !== false },
      { id: 'productPurchases', label: 'Product Purchases', enabled: prefs.productPurchases !== false }
    ],
    privacySettings: [
      { id: 'profileVisibility', label: 'Profile Visibility', type: 'select', value: profile.profileVisibility || 'Public', options: ['Public', 'Private', 'Subscribers Only'] },
      { id: 'showOnlineStatus', label: 'Show Online Status', type: 'toggle', enabled: profile.showOnlineStatus !== false },
      { id: 'allowDirectMessages', label: 'Allow Direct Messages', type: 'toggle', enabled: profile.allowDirectMessages !== false },
      { id: 'blockedUsers', label: 'Blocked Users', type: 'link', value: String(blockedCount), highlight: false },
      { id: 'twoFactorAuth', label: 'Two-Factor Authentication', type: 'link', value: twoFactorEnabled ? 'Enabled' : 'Disabled', highlight: twoFactorEnabled }
    ],
    creatorPreferences: [
      { id: 'defaultStreamType', label: 'Default Stream Type', type: 'select', value: profile.defaultStreamType || 'Live Video', options: ['Live Video', 'Audio Only'] },
      { id: 'defaultCallType', label: 'Default Call Type', type: 'select', value: profile.defaultCallType || 'Audio Call', options: ['Audio Call', 'Video Call'] },
      { id: 'contentLanguage', label: 'Content Language', type: 'select', value: profile.language || 'English', options: ['English', 'Spanish', 'French', 'German'] },
      { id: 'timezone', label: 'Timezone', type: 'select', value: profile.timezone || '(GMT-05:00) Eastern Time', options: ['(GMT-05:00) Eastern Time', '(GMT-06:00) Central Time', '(GMT-07:00) Pacific Time'] },
      { id: 'contentMaturity', label: 'Content Maturity', type: 'select', value: profile.contentMaturity || 'General Audience', options: ['General Audience', 'Mature Audience'] }
    ],
    helpLinks: [
      { id: 'helpCenter', label: 'Help Center', description: 'Get answers to common questions', icon: 'help' },
      { id: 'contactSupport', label: 'Contact Support', description: "We're here to help you", icon: 'support' },
      { id: 'reportIssue', label: 'Report an Issue', description: 'Let us know about a problem', icon: 'report' }
    ]
  });
});

// Save settings (profile fields, notification toggles, preferences)
exports.updateMySettings = catchAsync(async (req, res, next) => {
  const {
    displayName,
    username,
    bio,
    avatarUrl,
    rateAudio,
    rateVideo,
    subscriptionPrice,
    notifications,
    showOnlineStatus,
    allowDirectMessages,
    profileVisibility,
    contentLanguage,
    defaultStreamType,
    defaultCallType,
    timezone,
    contentMaturity
  } = req.body;

  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) return next(new ApiError(404, 'Creator profile not found'));
  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError(404, 'User not found'));

  // Profile fields
  if (username && username.toLowerCase() !== profile.username) {
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return next(new ApiError(400, 'Username can only contain letters, numbers, and underscores.'));
    }
    const [takenProfile, takenUser] = await Promise.all([
      CreatorProfile.findOne({ username: cleanUsername, _id: { $ne: profile._id } }),
      User.findOne({ username: cleanUsername, _id: { $ne: user._id } })
    ]);
    if (takenProfile || takenUser) {
      return next(new ApiError(400, 'Username is already taken.'));
    }
    profile.username = cleanUsername;
    user.username = cleanUsername;
  }
  if (displayName !== undefined) { profile.displayName = displayName; user.displayName = displayName; }
  if (bio !== undefined) { profile.bio = bio; user.bio = bio; }
  if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
  if (rateAudio !== undefined) profile.rates.audioCallPerMin = Number(rateAudio) || 0;
  if (rateVideo !== undefined) profile.rates.videoCallPerMin = Number(rateVideo) || 0;
  if (subscriptionPrice !== undefined) profile.rates.subscriptionMonthly = Number(subscriptionPrice) || 0;

  // Notification toggles
  if (Array.isArray(notifications)) {
    const prefs = user.notificationPreferences || {};
    notifications.forEach((n) => {
      if (n.id === 'newMessages') prefs.newMessages = !!n.enabled;
      if (n.id === 'newSubscribers') prefs.newSubscribers = !!n.enabled;
      if (n.id === 'tipsPayments') prefs.tipsAndPayments = !!n.enabled;
      if (n.id === 'streamReminders') prefs.liveStreamReminders = !!n.enabled;
      if (n.id === 'productPurchases') prefs.productPurchases = !!n.enabled;
    });
    user.notificationPreferences = prefs;
  }

  // Privacy toggles (separate preference fields — never touch the real
  // presence flag `isOnline` or the `newMessages` notification pref)
  if (showOnlineStatus !== undefined) profile.showOnlineStatus = !!showOnlineStatus;
  if (allowDirectMessages !== undefined) profile.allowDirectMessages = !!allowDirectMessages;
  if (profileVisibility !== undefined && ['Public', 'Private', 'Subscribers Only'].includes(profileVisibility)) {
    profile.profileVisibility = profileVisibility;
  }

  // Creator preferences
  if (contentLanguage !== undefined) profile.language = contentLanguage;
  if (defaultStreamType !== undefined && ['Live Video', 'Audio Only'].includes(defaultStreamType)) profile.defaultStreamType = defaultStreamType;
  if (defaultCallType !== undefined && ['Audio Call', 'Video Call'].includes(defaultCallType)) profile.defaultCallType = defaultCallType;
  if (timezone !== undefined) profile.timezone = timezone;
  if (contentMaturity !== undefined && ['General Audience', 'Mature Audience'].includes(contentMaturity)) profile.contentMaturity = contentMaturity;

  // Payout details (if any payout field provided). Ensure the wallet exists so
  // payout saves never silently no-op.
  const { payoutMethod } = req.body;
  if (payoutMethod) {
    let wallet = await mongoose.model('Wallet').findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await mongoose.model('Wallet').create({ userId: req.user._id, balanceCoins: 0 });
    }
    if (payoutMethod.accountHolder !== undefined) wallet.payoutMethod.accountHolder = payoutMethod.accountHolder;
    if (payoutMethod.bankName !== undefined) wallet.payoutMethod.bankName = payoutMethod.bankName;
    if (payoutMethod.routingNumber !== undefined) wallet.payoutMethod.routingNumber = payoutMethod.routingNumber;
    if (payoutMethod.accountNumber !== undefined) wallet.payoutMethod.accountNumber = payoutMethod.accountNumber;
    if (payoutMethod.verified !== undefined) wallet.payoutMethod.verified = !!payoutMethod.verified;
    if (payoutMethod.payoutSchedule !== undefined) wallet.payoutMethod.payoutSchedule = payoutMethod.payoutSchedule;
    if (payoutMethod.currency !== undefined) wallet.payoutMethod.currency = payoutMethod.currency;
    if (payoutMethod.minimumPayout !== undefined) wallet.payoutMethod.minimumPayout = Number(payoutMethod.minimumPayout) || 100;
    await wallet.save({ validateBeforeSave: false });
  }

  await Promise.all([profile.save({ validateBeforeSave: false }), user.save({ validateBeforeSave: false })]);

  res.status(200).json({
    status: 'success',
    message: 'Settings saved successfully'
  });
});
