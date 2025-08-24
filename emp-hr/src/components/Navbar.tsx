import React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useUser from '../hooks/useUser';

const Navbar = ({ toggleSidebar, fixed = false }) => {
  const { user } = useUser();

  return (
    <header
      className={[
        'bg-white border-b border-gray-200',
        fixed ? 'fixed top-0 left-0 right-0 z-40' : 'relative z-10'
      ].join(' ')}
    >
      <div className="h-16 flex items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-6 h-6 text-gray-700" />
          </button>

          <h1 className="text-base md:text-lg font-bold text-[#051b56]">
            EMP System
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100"
            aria-label="Notifications"
          >
            <NotificationsIcon className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2">
            <AccountCircleIcon className="w-8 h-8 text-gray-600" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                {user ? `${user['First name'] || ''} ${user['Last name'] || ''}`.trim() : 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.userType || 'employee'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
