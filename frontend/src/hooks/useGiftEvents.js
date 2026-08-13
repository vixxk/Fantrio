import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';
import { GIFT_TIERS } from '../features/gifts/giftCatalog';
import { playGiftChime } from '../utils/sound';

// Gifts play strictly one after another (classic live-gift rail): each
// animation runs for its full tier duration before the next queued gift
// starts. The cap is only a safety valve against pathological spam — a burst
// of gifts still plays through in arrival order, just never more than the
// newest MAX_QUEUE are kept waiting.
const MAX_QUEUE = 20;

/**
 * Manages live gift interactions for a call or stream context.
 *
 * - `sendGift(gift, recipientId)` charges coins via the backend and enqueues
 *   the animation locally (deduped against the socket echo by eventId).
 * - Listens for `gift_received` socket events and queues animations for gifts
 *   sent by anyone in the same context (call room or stream), so both parties
 *   — and every viewer — see the same animation in real time.
 * - Animations are strictly sequential: one gift plays at a time; the next one
 *   starts only after the current tier's duration elapses.
 *
 * @param {Object} opts
 * @param {string|null} opts.streamId   - live stream id (for stream contexts)
 * @param {string|null} opts.callRoomId - call room id (for 1:1 call contexts)
 * @param {boolean} opts.enabled        - subscribe to socket events only when true
 * @param {string|null} opts.receiverId - default gift recipient
 */
export const useGiftEvents = ({ streamId = null, callRoomId = null, enabled = true, receiverId = null } = {}) => {
  const { refreshBalance, user } = useApp();
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  // Per-context (call/stream) gift totals from the current user's perspective:
  // how many gifts they sent vs received, plus the coin values. Reset whenever
  // the stream/call context changes.
  const [summary, setSummary] = useState({ sentCount: 0, sentCoins: 0, receivedCount: 0, receivedCoins: 0 });

  // Keep the viewer's id reachable from event handlers without recreating
  // the callbacks (used to split sent vs received in the summary).
  const myUserIdRef = useRef(user?.id || user?._id || null);
  useEffect(() => {
    myUserIdRef.current = user?.id || user?._id || null;
  }, [user?.id, user?._id]);
  const queueRef = useRef([]);
  const activeRef = useRef(null); // eventId currently animating
  const recentRef = useRef(new Map()); // eventId -> timestamp (played recently)
  const timerRef = useRef(null);
  const contextRef = useRef({ streamId, callRoomId });

  // Keep the latest context available to sendGift without recreating the
  // callback (the ref is only read inside event handlers, never during render).
  useEffect(() => {
    contextRef.current = { streamId, callRoomId };
  }, [streamId, callRoomId]);

  // Advance the rail: play the next queued gift, then schedule the next
  // advancement after its tier duration. Safe to call on every enqueue — the
  // activeRef guard means only one timer is ever pending.
  const playNextRef = useRef(null);
  const playNext = useCallback(() => {
    if (activeRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setEvents([]);
      return;
    }
    activeRef.current = next.eventId;
    setEvents([next]);
    timerRef.current = setTimeout(() => {
      activeRef.current = null;
      // Read through a ref so the timeout never captures a stale callback.
      if (playNextRef.current) playNextRef.current();
    }, GIFT_TIERS[next.tier].duration);
  }, []);

  // Keep the latest playNext reachable from the rail timer.
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // Credit a sender's running total (used for the pinned gift leaderboard).
  // Pure updater — safe under StrictMode double-invocation.
  const applyGiftToLeaderboard = useCallback((evt) => {
    const sender = evt && evt.sender;
    if (!sender || !sender.id) return;
    const senderId = String(sender.id);
    const coins = Number(evt.coins) || 0;
    if (coins <= 0) return;
    setLeaderboard((prev) => {
      const existing = prev.find((e) => String(e.userId) === senderId);
      const next = existing
        ? prev.map((e) =>
            String(e.userId) === senderId
              ? { ...e, totalCoins: e.totalCoins + coins, count: e.count + 1 }
              : e
          )
        : [
            ...prev,
            {
              userId: sender.id,
              displayName: sender.displayName || 'Fan',
              avatarUrl: sender.avatarUrl || '',
              totalCoins: coins,
              count: 1
            }
          ];
      return next.sort((a, b) => b.totalCoins - a.totalCoins).slice(0, 10);
    });
  }, []);

  const addEvent = useCallback(
    (evt) => {
      const tier = GIFT_TIERS[evt.tier] ? evt.tier : 1;
      // Dedup: the sender's optimistic event and the socket echo share an
      // eventId (the backend transaction id). Also remember recently played
      // eventIds so a late-arriving echo can't replay a gift whose animation
      // already finished (which would also double-count the leaderboard).
      if (activeRef.current === evt.eventId || queueRef.current.some((e) => e.eventId === evt.eventId)) return;
      const now = Date.now();
      if (recentRef.current.has(evt.eventId)) {
        if (now - recentRef.current.get(evt.eventId) < 15000) return;
      }
      recentRef.current.set(evt.eventId, now);
      if (recentRef.current.size > 60) {
        for (const [id, ts] of recentRef.current) {
          if (now - ts > 30000) recentRef.current.delete(id);
        }
      }
      queueRef.current.push({ ...evt, tier });
      if (queueRef.current.length > MAX_QUEUE) {
        queueRef.current.splice(0, queueRef.current.length - MAX_QUEUE);
      }
      // Soft chime + haptic tap when a gift lands in a 1:1 call or live
      // stream. Played once per gift (the optimistic event and socket echo
      // share an eventId and are deduped above) and throttled inside
      // playGiftChime so gift bursts on busy streams don't stack chimes.
      const ctx = contextRef.current;
      if (ctx.callRoomId || ctx.streamId) {
        playGiftChime(tier);
      }
      // Tally the per-call/stream summary. Each accepted event is counted
      // exactly once (the sender's optimistic event and the socket echo are
      // deduped by eventId above).
      const isMine = evt.sender && String(evt.sender.id) === String(myUserIdRef.current);
      const coins = Number(evt.coins) || 0;
      setSummary((prev) =>
        isMine
          ? { ...prev, sentCount: prev.sentCount + 1, sentCoins: prev.sentCoins + coins }
          : { ...prev, receivedCount: prev.receivedCount + 1, receivedCoins: prev.receivedCoins + coins }
      );
      applyGiftToLeaderboard(evt);
      playNext();
    },
    [playNext, applyGiftToLeaderboard]
  );

  // Socket subscription for gifts arriving from other users.
  useEffect(() => {
    if (!enabled) return undefined;
    const socket = connectSocket();

    const handleGift = (payload) => {
      if (!payload || !payload.eventId) return;
      const ctx = payload.context || {};
      // Only render gifts that belong to this call/stream context. When the
      // current view has no context id (no active call/stream), reject events
      // so gifts from other contexts can't leak into an unrelated overlay.
      if (ctx.type === 'stream') {
        if (streamId && String(ctx.streamId) !== String(streamId)) return;
      } else if (ctx.type === 'call' || callRoomId) {
        if (callRoomId && ctx.callRoomId && String(ctx.callRoomId) !== String(callRoomId)) return;
      }
      addEvent(payload);
    };

    socket.on('gift_received', handleGift);
    return () => {
      socket.off('gift_received', handleGift);
    };
  }, [enabled, streamId, callRoomId, addEvent]);

  // Reset the leaderboard whenever the context (stream/call) changes. Done at
  // render time (React's recommended "adjust state when props change" pattern)
  // so the previous context's totals never leak into a new stream/call.
  const contextKey = `${streamId || ''}|${callRoomId || ''}`;
  const [prevContextKey, setPrevContextKey] = useState(contextKey);
  if (contextKey !== prevContextKey) {
    setPrevContextKey(contextKey);
    setLeaderboard([]);
    setSummary({ sentCount: 0, sentCoins: 0, receivedCount: 0, receivedCoins: 0 });
  }

  // Seed the leaderboard from the backend ledger when a stream context turns
  // on, so a viewer who joins mid-stream sees the full stream totals (merged
  // per sender with max() so gifts already counted live are never doubled).
  useEffect(() => {
    if (!enabled || !streamId || callRoomId) return undefined;
    let cancelled = false;
    api
      .get(`/creators/live/${streamId}/leaderboard?limit=10`)
      .then((res) => {
        if (cancelled) return;
        const list = res.leaderboard || [];
        if (list.length === 0) return;
        setLeaderboard((prev) => {
          const map = new Map(prev.map((e) => [String(e.userId), e]));
          list.forEach((b) => {
            const key = String(b.userId);
            const live = map.get(key);
            if (!live || Number(b.totalCoins) >= live.totalCoins) {
              map.set(key, { ...b, totalCoins: Number(b.totalCoins) || 0, count: Number(b.count) || 0 });
            }
          });
          return [...map.values()].sort((a, b) => b.totalCoins - a.totalCoins).slice(0, 10);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, streamId, callRoomId]);

  // Clear the pending rail timer + queue on unmount.
  useEffect(() => {
    // Capture the stable ref values so the cleanup never touches a replaced
    // ref (recentRef.current is only ever mutated, never reassigned).
    const recent = recentRef.current;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      queueRef.current = [];
      activeRef.current = null;
      recent.clear();
      playNextRef.current = null;
    };
  }, []);

  const sendGift = useCallback(
    async (gift, recipientId) => {
      let targetId = recipientId || receiverId;
      if (targetId && typeof targetId === 'object') {
        targetId = targetId._id || targetId.id || targetId;
      }
      targetId = targetId ? String(targetId) : null;
      if (!targetId || targetId === '[object Object]') {
        throw new Error('No valid gift recipient');
      }
      const ctx = contextRef.current;
      const res = await api.post(`/monetization/gift/${targetId}`, {
        giftId: gift.id,
        streamId: ctx.streamId || null,
        callRoomId: ctx.callRoomId || null
      });
      if (res.status === 'success') {
        addEvent({
          eventId: res.eventId,
          giftId: gift.id,
          name: gift.name,
          emoji: gift.emoji,
          coins: gift.coins,
          tier: gift.tier,
          sender: res.sender
        });
        refreshBalance();
      }
      return res;
    },
    [receiverId, addEvent, refreshBalance]
  );

  return { events, sendGift, leaderboard, summary };
};
