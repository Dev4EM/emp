import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useUser from '../hooks/useUser';
import useRealTimeNotifications from '../hooks/useRealTimeNotifications.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import NotificationSidebar from './NotificationSidebar';

const Navbar = ({ toggleSidebar, fixed = false }:any) => {
  const { user }:any = useUser();
  const { unreadCount } = useRealTimeNotifications();
  const { isConnected } = useSocket();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const closeNotifications = () => {
    setIsNotificationOpen(false);
  };

  return (
    <>
      <header
        className={[
          'bg-white border-b border-gray-200 shadow-sm',
          fixed ? 'fixed top-0 left-0 right-0 z-40' : 'relative z-10'
        ].join(' ')}
      >
        <div className="h-16 flex items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden transition-colors duration-200"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-base md:text-lg font-bold text-[#051b56]">
              <span className='text-[#e96101]'>EM</span> People
            </h1>

            {/* Connection Status */}
            <div className={`hidden sm:flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isConnected 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Animated Notification Bell */}
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open notifications"
            >
              <NotificationsIcon className="w-6 h-6 text-gray-700" />
              
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                  
                  {/* Pulsing Ring Effect */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                </>
              )}
            </button>

            {/* User Profile Section */}
            <div className="flex items-center gap-2">
              <AccountCircleIcon className="w-8 h-8 text-gray-600" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                  {user ? `${user['First name'] || ''} ${user['Last name'] || ''}`.trim() : 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.userType || 'employee'}
                  </p>
                  {isConnected && (
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Sidebar */}
      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={closeNotifications}
      />
    </>
  );
};

export default Navbar;
