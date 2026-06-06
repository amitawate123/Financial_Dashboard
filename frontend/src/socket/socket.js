import { io } from 'socket.io-client';

const socketBase =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/api\/v1\/?$/, '');

let socket = null;

export const connectSocket = (token) => {
  if (!token) return null;

  if (socket?.connected) {
    if (socket.auth?.token !== token) {
      socket.auth = { token };
      socket.disconnect().connect();
    }
    return socket;
  }

  socket = io(socketBase, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
