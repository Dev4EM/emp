import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for toast styling
import './App.css';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      {/* ToastContainer will render all the toast notifications */}
 
      {/* Your existing layout */}
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
      
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App;
