import React from 'react';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
const Sidebar = () => {
  return (
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
        <a href="#" className="flex fixed bottom-0 flex-col  items-center  ">
          <LogoutOutlinedIcon className='text-[#051b56]'/>
        <p className='text-[#051b56]'>Logout</p>
        </a>
        
      </nav>
    </div>
  );
};

export default Sidebar;
