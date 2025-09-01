import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CircleIcon from '@mui/icons-material/Circle';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatDistanceToNow } from 'date-fns';
import useRealTimeNotifications from '../hooks/useRealTimeNotifications.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { toast } from 'react-toastify';
import { deleteNotification } from './Api.jsx';
import useUser from '../hooks/useUser.js';

const NotificationSidebar = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { isConnected } = useSocket();
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    setNotifications,
    setUnreadCount 
  } = useRealTimeNotifications();
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (user?.userType !== 'admin') {
      toast.error('Only administrators can delete notifications');
      return;
    }

    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (!notifications.find(n => n._id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length === 0) {
      toast.info('All notifications are already read');
      return;
    }
    
    try {
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notif => markAsRead(notif._id))
      );
      
      toast.success(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      welcome: 'border-l-blue-500 bg-blue-50',
      approval: 'border-l-green-500 bg-green-50',
      reminder: 'border-l-orange-500 bg-orange-50',
      update: 'border-l-purple-500 bg-purple-50',
      meeting: 'border-l-indigo-500 bg-indigo-50',
      system: 'border-l-gray-500 bg-gray-50',
      announcement: 'border-l-red-500 bg-red-50',
      default: 'border-l-gray-500 bg-gray-50'
    };
    return colors[type] || colors.default;
  };

  const getTypeIcon = (type) => {
    const icons = {
      welcome: '👋',
      approval: '✅',
      reminder: '⏰',
      update: '📋',
      meeting: '📅',
      system: '🔧',
      announcement: '📢',
      default: '🔔'
    };
    return icons[type] || icons.default;
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-all duration-300 ease-in-out z-40 ${
          isOpen 
            ? 'bg-opacity-50 backdrop-blur-sm' 
            : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notification Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-all duration-300 ease-in-out transform z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full max-w-md sm:w-96`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 id="notification-title" className="text-xl font-bold text-gray-900">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close notifications"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Connection Status & Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Real-time updates active
                </>
              ) : (
                <>
                  <WifiOffIcon className="w-3 h-3" />
                  Connection lost
                </>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200"
              >
                <MarkEmailReadIcon className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
        </header>

        {/* Notifications List */}
        <main className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-lg font-medium mb-2">All caught up!</p>
              <p className="text-sm text-center">
                No new notifications. We'll let you know when something important happens.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`group relative p-4 hover:bg-gray-50 transition-all duration-200 border-l-4 ${getTypeColor(notification.type)} ${
                    !notification.isRead ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-2xl" role="img" aria-hidden="true">
                        {getTypeIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        
                        {!notification.isRead && (
                          <CircleIcon className="w-2 h-2 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        
                        {notification.isRead && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircleIcon className="w-3 h-3" />
                            Read
                          </div>
                        )}
                      </div>

                      {notification.createdBy && (
                        <p className="mt-1 text-xs text-gray-400">
                          By {notification.createdBy['First name']} {notification.createdBy['Last name']}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Mark as read"
                      >
                        <MarkEmailReadIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    {user?.userType === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {notifications.length} total • {unreadCount} unread
            </span>
            <span className="font-medium text-blue-600">
              Real-time enabled
            </span>
          </div>
        </footer>
      </aside>
    </>
  );
};

export default NotificationSidebar;
