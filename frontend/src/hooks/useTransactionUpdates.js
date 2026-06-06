import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import { useAuth } from '../context/AuthContext';

/**
 * Calls onUpdate when a transaction is created/updated/deleted (via Socket.io).
 * Skips events from other users unless the current user is admin.
 */
export function useTransactionUpdates(onUpdate) {
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handler = (payload) => {
      const isOwner = payload.ownerId === user._id?.toString();
      const isAdmin = user.role === 'admin';
      if (isOwner || isAdmin) onUpdate(payload);
    };

    socket.on('transaction:changed', handler);
    return () => socket.off('transaction:changed', handler);
  }, [user, onUpdate]);
}
