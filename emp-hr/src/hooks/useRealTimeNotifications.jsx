import { useState, useEffect } from 'react';
import { useSocket } from './useSocket.jsx';
import { toast } from 'react-toastify';
import useUser from './useUser';
import { getUserNotifications, markNotificationAsRead } from '../components/Api';

const useRealTimeNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id]);

  const fetchNotifications = async () => {
    try {
      const response = await getUserNotifications(user._id);
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // ✅ FIXED: Real-time notification listener with duplicate prevention
  useEffect(() => {
    if (!socket || !user || !isConnected) return;

    console.log('🔧 Setting up notification listener for user:', user._id);

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications list (prevent duplicates)
      setNotifications(prev => {
        const exists = prev.some(n => n._id === notification._id);
        if (exists) {
          console.log('🔧 Duplicate notification detected, skipping');
          return prev;
        }
        return [notification, ...prev];
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);

      // ✅ FIXED: Show toast with unique ID to prevent duplicates
      const getToastIcon = (type) => {
        switch (type) {
          case 'approval': return '✅';
          case 'announcement': return '📢';
          case 'reminder': return '⏰';
          case 'update': return '📋';
          case 'welcome': return '👋';
          case 'system': return '🔧';
          default: return '🔔';
        }
      };

      toast.info(
        <div>
          <strong>{getToastIcon(notification.type)} {notification.title}</strong>
          <p className="text-sm mt-1">{notification.message.substring(0, 100)}...</p>
        </div>,
        {
          toastId: notification._id, // ✅ CRITICAL: Prevent duplicate toasts
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    };

    // ✅ FIXED: Single listener registration with proper cleanup
    socket.on('new_notification', handleNewNotification);
    console.log('✅ Notification listener registered');

    return () => {
      console.log('🔧 Cleaning up notification listener');
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user, isConnected]); // Only re-run when these dependencies change

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    setNotifications,
    setUnreadCount,
    isConnected
  };
};

export default useRealTimeNotifications;
