import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import CalendarViewMonthOutlinedIcon from '@mui/icons-material/CalendarViewMonthOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import useLogout from '../pages/Logout';
import Modal from './Modal';
import useUser from '../hooks/useUser';
import { UpdateRounded,WorkHistorySharp } from '@mui/icons-material';

const Sidebar = ({ isSidebarOpen, onCloseSidebar }) => {
  const logout = useLogout();
  const location = useLocation();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
      return () => (document.body.style.overflow = 'unset');
    }
  }, [isSidebarOpen]);

  const handleLogoutClick = () => setIsModalOpen(true);
  const handleConfirmLogout = () => {
    logout();
    setIsModalOpen(false);
  };
  const handleLinkClick = () => {
    if (onCloseSidebar && window.innerWidth < 768) onCloseSidebar();
  };
  const isActive = (path) => location.pathname === path;

  const Item = ({ to, icon: Icon, text, hover = 'hover:bg-gray-200' }) => (
    <Link
      to={to}
      onClick={handleLinkClick}
      className={`
        group relative flex flex-col items-center p-3 rounded-lg transition-colors
        ${hover}
        ${isActive(to) ? 'bg-blue-100 text-[#051b56]' : 'text-gray-700'}
      `}
      aria-current={isActive(to) ? 'page' : undefined}
    >
      <Icon className={`w-6 h-6 ${isActive(to) ? 'text-[#051b56]' : 'text-[#051b56]'}`} />
      <span
        className={`
          text-xs mt-1 text-center leading-tight
          block md:hidden lg:block
          ${isActive(to) ? 'text-[#051b56] font-medium' : 'text-[#051b56]'}
        `}
      >
        {text}
      </span>

      {/* Tooltip for compact (md) */}
      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded text-xs text-white bg-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition hidden md:block lg:hidden whitespace-nowrap z-50">
        {text}
      </span>
    </Link>
  );

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
      >
        Are you sure you want to logout?
      </Modal>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-full bg-gray-100 border-r border-gray-200
          z-50 md:z-30 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-64 md:w-20 lg:w-36
        `}
        role="navigation"
        aria-label="Sidebar"
      >
        {/* Header + Close for mobile */}
        <div className="flex items-center justify-between p-4 md:justify-center">
          <h2 className="text-lg font-bold text-[#051b56] md:hidden lg:block"><span className='text-[#e96101]'> EM</span> People</h2>
          <button
            onClick={onCloseSidebar}
            className="p-2 rounded hover:bg-gray-200 md:hidden"
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="px-3 pb-6 space-y-2">
          {/* Common */}
          <div className="space-y-1 mt-2">
            <Item to="/" icon={HomeOutlinedIcon} text="Home" />
            <Item to="/applyLeave" icon={EditCalendarOutlinedIcon} text="Apply Leave" />
            <Item to="/my-attendance" icon={CalendarViewMonthOutlinedIcon} text="Attendance" />
            <Item to="/past-leaves" icon={HistoryOutlinedIcon} text="Past Leaves" />
            <Item to="/profile" icon={AccountCircleOutlinedIcon} text="Profile" />
             <Item to="/workshop" icon={WorkHistorySharp} text="Workshop" />
          </div>

          {/* Team leader */}
          {user?.userType === 'teamleader' && (
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-[10px] tracking-wide text-gray-500 font-semibold mb-2 px-2 md:hidden lg:block">
                TEAM MANAGEMENT
              </h3>
              <div className="space-y-1">
                <Item to="/team-members" icon={SupervisedUserCircleOutlinedIcon} text="My Team" hover="hover:bg-blue-100" />
                <Item to="/pending-leaves" icon={AssignmentLateOutlinedIcon} text="Pending Leaves" hover="hover:bg-orange-100" />
                                <Item to="/all-leaves" icon={AssignmentLateOutlinedIcon} text="All Leaves" hover="hover:bg-red-100" />

                <Item to="/team-attendance" icon={BarChartOutlinedIcon} text="Team Attendance" hover="hover:bg-green-100" />
              </div>
            </div>
          )}

          {/* Admin */}
          {user?.userType === 'admin' && (
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-[10px] tracking-wide text-gray-500 font-semibold mb-2 px-2 md:hidden lg:block">
                ADMIN PANEL
              </h3>
              <div className="space-y-1">
                <Item to="/admin" icon={AdminPanelSettingsOutlinedIcon} text="Dashboard" hover="hover:bg-purple-100" />
                <Item to="/update-attendance" icon={UpdateRounded} text="Update Attendance" hover="hover:bg-purple-100" />
                <Item to="/manage-employees" icon={PeopleOutlineOutlinedIcon} text="All Users" hover="hover:bg-purple-100" />
                <Item to="/add-employee" icon={PersonAddAltOutlinedIcon} text="Add User" hover="hover:bg-purple-100" />
                <Item to="/all-leaves" icon={AssignmentLateOutlinedIcon} text="All Leaves" hover="hover:bg-red-100" />
                <Item to="/manage-app" icon={SettingsOutlinedIcon} text="Manage App" hover="hover:bg-purple-100" />
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={handleLogoutClick}
              className="group relative w-full flex flex-col items-center p-3 rounded-lg hover:bg-red-100 transition-colors text-[#051b56]"
            >
              <LogoutOutlinedIcon className="w-6 h-6" />
              <span className="text-xs mt-1 text-center leading-tight block md:hidden lg:block">
                Logout
              </span>
              {/* Tooltip for md */}
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded text-xs text-white bg-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition hidden md:block lg:hidden whitespace-nowrap z-50">
                Logout
              </span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
