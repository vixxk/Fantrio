import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socket';

const GLOBAL_ROOM = 'live_streams_global';

/**
 * Subscribes a component to real-time live stream events over Socket.io.
 *
 * - Joins per-stream rooms (`live_stream_{id}`) so `live_viewer_update` events for
 *   the given stream ids are received and viewer counts update live.
 * - Optionally joins the global room to receive `stream_started` / `stream_ended`
 *   events so browse pages can refresh their lists.
 *
 * Callbacks are kept in refs (synced via an effect) so re-renders never
 * resubscribe the socket.
 *
 * @param {string[]} streamIds - stream ids whose rooms to join
 * @param {Function} onViewerUpdate - ({ streamId, viewerCount, isLive }) => void
 * @param {Function} onStreamEvent - ({ streamId, isLive }) => void (started/ended)
 * @param {boolean} joinGlobal - whether to join the global lifecycle room
 */
export const useLiveStreamSocket = ({ streamIds = [], onViewerUpdate, onStreamEvent, joinGlobal = true }) => {
  const streamIdsRef = useRef(streamIds);
  const onViewerUpdateRef = useRef(onViewerUpdate);
  const onStreamEventRef = useRef(onStreamEvent);
  const joinGlobalRef = useRef(joinGlobal);

  // Keep refs in sync with the latest props after every render.
  useEffect(() => {
    streamIdsRef.current = streamIds;
    onViewerUpdateRef.current = onViewerUpdate;
    onStreamEventRef.current = onStreamEvent;
    joinGlobalRef.current = joinGlobal;
  });

  // Subscribe to socket events once (handlers read the latest callbacks via refs).
  useEffect(() => {
    const socket = connectSocket();

    const handleViewerUpdate = (payload) => {
      if (onViewerUpdateRef.current) onViewerUpdateRef.current(payload);
    };
    const handleStreamEvent = (payload) => {
      if (onStreamEventRef.current) onStreamEventRef.current(payload);
    };

    socket.on('live_viewer_update', handleViewerUpdate);
    socket.on('stream_started', handleStreamEvent);
    socket.on('stream_ended', handleStreamEvent);

    // Join rooms for the initially visible streams
    const joinIds = [...new Set((streamIdsRef.current || []).filter(Boolean))].map(String);
    joinIds.forEach((id) => socket.emit('join_stream_room', id));
    if (joinGlobalRef.current) socket.emit('join_stream_room', GLOBAL_ROOM);

    return () => {
      joinIds.forEach((id) => socket.emit('leave_stream_room', id));
      if (joinGlobalRef.current) socket.emit('leave_stream_room', GLOBAL_ROOM);
      socket.off('live_viewer_update', handleViewerUpdate);
      socket.off('stream_started', handleStreamEvent);
      socket.off('stream_ended', handleStreamEvent);
    };
  }, []);

  // Re-join/leave rooms whenever the visible stream list changes
  // (e.g. pagination, filter changes, or a stream going live).
  const prevIdsRef = useRef([]);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const currentIds = [...new Set((streamIds || []).filter(Boolean))].map(String);
    const prevIds = prevIdsRef.current;
    const prevSet = new Set(prevIds);
    const currentSet = new Set(currentIds);

    currentIds.forEach((id) => {
      if (!prevSet.has(id)) socket.emit('join_stream_room', id);
    });
    prevIds.forEach((id) => {
      if (!currentSet.has(id)) socket.emit('leave_stream_room', id);
    });

    prevIdsRef.current = currentIds;
  }, [streamIds]);
};
