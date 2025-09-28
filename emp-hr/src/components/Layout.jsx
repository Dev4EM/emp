import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen font-josefin bg-gray-50">
      {/* Mobile fixed navbar */}
      <div className="md:hidden">
        <Navbar toggleSidebar={toggleSidebar} fixed />
      </div>

      <div className="md:grid md:grid-cols-[auto,1fr] md:h-screen">
        {/* Sidebar column */}
        <Sidebar isSidebarOpen={isSidebarOpen} onCloseSidebar={closeSidebar} />

        {/* Main column */}
        <div className="flex flex-col md:overflow-hidden">
          {/* Desktop navbar (not fixed) */}
          <div className="hidden md:block">
            <Navbar toggleSidebar={toggleSidebar} />
          </div>

          {/* Main content; top padding only for mobile fixed navbar */}
          <main className="flex-1 overflow-auto pt-16 md:pt-0 px-4 md:px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
