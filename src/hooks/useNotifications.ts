import { useState, useEffect } from 'react';
import socket from '../services/socket.ts';

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const handleNotification = (data: any) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [userId]);

  const markAsRead = () => setUnreadCount(0);
  const clearAll = () => setNotifications([]);

  return { notifications, unreadCount, markAsRead, clearAll };
};
