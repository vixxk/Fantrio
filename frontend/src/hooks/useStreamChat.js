import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';

// Keep the on-screen list bounded; older messages scroll out naturally.
const MAX_MESSAGES = 80;

/**
 * Live chat for a stream watch/host view.
 *
 * - Joins the stream's socket room (`live_stream_{id}`) while enabled so
 *   `stream_chat` broadcasts are received, and leaves it when disabled.
 * - Loads recent history on mount and appends incoming messages in arrival
 *   order (deduped by message _id — the sender gets both the API response and
 *   the socket echo).
 *
 * @param {Object} opts
 * @param {string|null} opts.streamId - live stream id
 * @param {boolean} opts.enabled      - connect + subscribe only while true
 */
export const useStreamChat = ({ streamId = null, enabled = false } = {}) => {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const idsRef = useRef(new Set());
  const streamIdRef = useRef(streamId);

  useEffect(() => {
    streamIdRef.current = streamId;
  }, [streamId]);

  // Dedup + append a message. Ref bookkeeping happens OUTSIDE the state
  // updater so StrictMode's double-invocation never drops a message.
  const appendMessage = useCallback((msg) => {
    if (!msg || !msg._id) return;
    if (idsRef.current.has(msg._id)) return;
    idsRef.current.add(msg._id);
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !streamId) return undefined;
    const socket = connectSocket();
    socket.emit('join_stream_room', String(streamId));

    const handleChat = (payload) => {
      if (!payload || !payload._id) return;
      if (String(payload.streamId) !== String(streamId)) return;
      appendMessage(payload);
    };
    socket.on('stream_chat', handleChat);

    // Load recent history. Merge with anything already received over the
    // socket and sort by createdAt so live messages never appear before older
    // history (messages must show one after another, in arrival order).
    api
      .get(`/creators/live/${streamId}/chat?limit=50`)
      .then((res) => {
        const list = res.messages || [];
        const fresh = list.filter((m) => m && m._id && !idsRef.current.has(m._id));
        fresh.forEach((m) => idsRef.current.add(m._id));
        if (fresh.length === 0) return;
        setMessages((prev) => {
          const merged = [...prev, ...fresh];
          merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return merged.length > MAX_MESSAGES ? merged.slice(merged.length - MAX_MESSAGES) : merged;
        });
      })
      .catch(() => {});

    return () => {
      socket.emit('leave_stream_room', String(streamId));
      socket.off('stream_chat', handleChat);
    };
  }, [enabled, streamId, appendMessage]);

  const sendMessage = useCallback(
    async (text) => {
      const sid = streamIdRef.current;
      const clean = String(text || '').trim().slice(0, 500);
      if (!clean || !sid) return null;
      setSending(true);
      try {
        const res = await api.post(`/creators/live/${sid}/chat`, { text: clean });
        if (res.status === 'success') {
          appendMessage(res.message);
          return res.message;
        }
        return null;
      } finally {
        setSending(false);
      }
    },
    [appendMessage]
  );

  return { messages, sendMessage, sending };
};
