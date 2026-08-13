import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

let socket = null;
let activeUserId = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
      if (activeUserId) {
        socket.emit('join_room', activeUserId);
      }
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const joinSocketRoom = (userId) => {
  if (!userId) return;
  const uid = String(userId);
  activeUserId = uid;
  const s = connectSocket();
  
  if (s.connected) {
    s.emit('join_room', uid);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeUserId = null;
};

export default getSocket;
