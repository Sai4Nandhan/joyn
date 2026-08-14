import { createContext, useCallback, useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';
import {
  listNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  deleteNotificationRequest,
} from '../services/notificationService.js';
import { listDirectConversationsRequest } from '../services/dmService.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [unreadDMsCount, setUnreadDMsCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch notifications
      const notifData = await listNotificationsRequest();
      setNotifications(notifData.notifications || []);
      
      const unreadNotifs = (notifData.notifications || []).filter((n) => n.unread).length;
      setUnreadCount(unreadNotifs);

      // 2. Fetch conversations
      const convs = await listDirectConversationsRequest();
      setConversations(convs || []);
      
      const totalUnreadDMs = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadDMsCount(totalUnreadDMs);
    } catch (err) {
      console.error('Failed to sync notifications or direct messages', err);
    }
  }, [user]);

  // Initial and periodic sync + Socket listener
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setConversations([]);
      setUnreadDMsCount(0);
      disconnectSocket();
      return;
    }

    fetchAll();
    const interval = setInterval(fetchAll, 10000); // sync every 10s

    // Connect socket globally
    const socket = connectSocket();

    function handleNewNotification(notification) {
      setNotifications((prev) => {
        const id = notification._id || notification.id;
        if (prev.some((n) => (n._id || n.id) === id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      setUnreadCount((c) => c + 1);
    }

    function handleNewDM(message) {
      fetchAll();
    }

    socket.on('notification:new', handleNewNotification);
    socket.on('dm:new', handleNewDM);

    return () => {
      clearInterval(interval);
      socket.off('notification:new', handleNewNotification);
      socket.off('dm:new', handleNewDM);
    };
  }, [user, fetchAll]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsReadRequest();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationReadRequest(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, unread: false } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      await deleteNotificationRequest(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id || n._id === id);
        const wasUnread = target?.unread;
        if (wasUnread) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id && n._id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        conversations,
        unreadDMsCount,
        sync: fetchAll,
        markAllRead,
        markRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
