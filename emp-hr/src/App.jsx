import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token exists, redirect to the login page
      navigate('/login');
    }
    // The dependency array [navigate] ensures this effect runs only when navigate function changes
  }, [navigate]);

  const handleLogout = () => {
    // Remove the token from local storage
    localStorage.removeItem('token');
    // Redirect to the login page
    navigate('/login');
  };

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <div>
          <a href="/" className="mr-4 font-bold hover:text-gray-300">HR Platform</a>
          <a href="/apply-leave" className="hover:text-gray-300">Apply for Leave</a>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </nav>
      
      {/* This renders the child routes (HomePage, ApplyLeavePage) if the user is authenticated */}
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App;
