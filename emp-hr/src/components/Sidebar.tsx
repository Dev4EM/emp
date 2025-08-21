import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
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
      <div className="fixed top-0 left-0 h-full w-24 bg-gray-100 flex flex-col py-4 space-y-6 z-40">
        <nav className="flex flex-col space-y-4 px-4 mt-20">
          <a href="./" className="flex flex-col items-center ">
            <HomeOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56]'>Home</p>
          </a>
          <a href="./applyLeave" className="flex flex-col items-center  ">
            <EditCalendarOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56]'>Leave</p>
          </a>
          <a href="./profile" className="flex flex-col items-center  ">
            <AccountCircleOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56]'>Profile</p>
          </a>
          <a href="./past-leaves" className="flex flex-col items-center  ">
            <HistoryOutlinedIcon className='text-[#051b56]'/>
            <p className='text-[#051b56]'>Past Leaves</p>
          </a>
          {(user?.userType === 'teamleader' || user?.userType === 'admin') && (
            <>
              <a href="./team-members" className="flex flex-col items-center  ">
                <SupervisedUserCircleOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56]'>Team</p>
              </a>
              <a href="./pending-leaves" className="flex flex-col items-center  ">
                <AssignmentLateOutlinedIcon className='text-[#051b56]'/>
                <p className='text-[#051b56]'>Pending</p>
              </a>
            </>
          )}
          {user?.userType === 'admin' && (
            <a href="./admin" className="flex flex-col items-center  ">
              <AdminPanelSettingsOutlinedIcon className='text-[#051b56]'/>
              <p className='text-[#051b56]'>Admin</p>
            </a>
          )}
          <a onClick={handleLogoutClick} className="flex fixed bottom-0 flex-col  items-center  ">
            <LogoutOutlinedIcon className='text-[#051b56]'/>
            <p  className='text-[#051b56]'>Logout</p>
          </a>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
