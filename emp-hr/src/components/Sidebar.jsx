import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import useLogout from '../pages/Logout';
import Modal from './Modal';
import useUser from '../hooks/useUser';

const Sidebar = () => {
  const logout = useLogout();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsModalOpen(false);
  };

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
      
      <div className="fixed top-0 left-0 h-full w-24 bg-gray-100 flex flex-col py-4 space-y-6 z-40 overflow-y-auto">
        <nav className="flex flex-col space-y-4 px-4 mt-20">
          
          {/* Common Employee Navigation */}
          <Link to="/" className="flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <HomeOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Home</p>
          </Link>
          
          <Link to="/applyLeave" className="flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <EditCalendarOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Apply Leave</p>
          </Link>
          
          <Link to="/my-attendance" className="flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <CalendarViewMonthOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Attendance</p>
          </Link>
          
          <Link to="/past-leaves" className="flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <HistoryOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Past Leaves</p>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <AccountCircleOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Profile</p>
          </Link>

          {/* Team Leader Section - Only for Team Leaders (not admins) */}
          {user?.userType === 'teamleader' && (
            <>
              <div className="border-t border-gray-300 my-4"></div>
              <div className="text-xs text-gray-500 font-semibold text-center mb-2">TEAM MANAGEMENT</div>
              
              <Link to="/team-members" className="flex flex-col items-center hover:bg-blue-100 p-2 rounded-lg transition-colors">
                <SupervisedUserCircleOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>My Team</p>
              </Link>
              
              <Link to="/pending-leaves" className="flex flex-col items-center hover:bg-orange-100 p-2 rounded-lg transition-colors">
                <AssignmentLateOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>Pending Leaves</p>
              </Link>
              
              <Link to="/team-attendance" className="flex flex-col items-center hover:bg-green-100 p-2 rounded-lg transition-colors">
                <BarChartOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>Team Attendance</p>
              </Link>
            </>
          )}

          {/* Admin Section - Enhanced with All Pending Leaves Access */}
          {user?.userType === 'admin' && (
            <>
              <div className="border-t border-gray-300 my-4"></div>
              <div className="text-xs text-gray-500 font-semibold text-center mb-2">ADMIN PANEL</div>
              
              <Link to="/admin" className="flex flex-col items-center hover:bg-purple-100 p-2 rounded-lg transition-colors">
                <AdminPanelSettingsOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>Dashboard</p>
              </Link>
              
              <Link to="/manage-employees" className="flex flex-col items-center hover:bg-purple-100 p-2 rounded-lg transition-colors">
                <PeopleOutlineOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>All Users</p>
              </Link>
              
              <Link to="/add-employee" className="flex flex-col items-center hover:bg-purple-100 p-2 rounded-lg transition-colors">
                <PersonAddAltOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>Add User</p>
              </Link>
              
              {/* Admin can see ALL pending leaves */}
 <Link to="/all-leaves" className="flex flex-col items-center hover:bg-red-100 p-2 rounded-lg transition-colors">
  <AssignmentLateOutlinedIcon className='text-[#051b56]'/>
  <p className='text-[#051b56] text-xs text-center'>All Leaves</p>
</Link>

              
              <Link to="/manage-app" className="flex flex-col items-center hover:bg-purple-100 p-2 rounded-lg transition-colors">
                <SettingsOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56] text-xs text-center'>Manage App</p>
              </Link>
            </>
          )}

          {/* Logout Button */}
          <div className="border-t border-gray-300 my-4"></div>
          <button 
            onClick={handleLogoutClick} 
            className="flex flex-col items-center hover:bg-red-100 p-2 rounded-lg transition-colors"
          >
            <LogoutOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56] text-xs text-center'>Logout</p>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
