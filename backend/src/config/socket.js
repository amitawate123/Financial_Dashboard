const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('Invalid user'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);
    if (socket.user.role === 'admin') socket.join('admins');
  });

  return io;
};

const emitTransactionChange = (action, transaction) => {
  if (!io || !transaction) return;

  const ownerId = (transaction.createdBy?._id || transaction.createdBy)?.toString();
  const payload = {
    action,
    transactionId: transaction._id?.toString(),
    ownerId,
  };

  if (ownerId) io.to(`user:${ownerId}`).emit('transaction:changed', payload);
};

module.exports = { initSocket, emitTransactionChange };
