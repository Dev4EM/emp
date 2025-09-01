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

  // Real-time notification listener
  useEffect(() => {
    if (!socket || !user || !isConnected) return;

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Show toast notification
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
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user, isConnected]);

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
