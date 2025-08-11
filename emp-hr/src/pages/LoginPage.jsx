import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = await api.loginUser({ email, password });
      localStorage.setItem('token', data.token);
      setSuccess('Login Successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-emerald-900 to-gray-900 p-12 flex-col justify-between">
        <div className="text-2xl font-bold">
          <span className="text-emerald-400">emp</span> people
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-snug">
            Meet Your Everyday <br/> Task Companion
          </h1>
          <p className="text-lg mt-4 text-gray-300">
            Just Ask - chat or speak, AI Does it.
          </p>
        </div>
        <div className="text-yellow-400 font-bold text-3xl">
          <h2>HURRY UP! LOG IN</h2>
          <h2>& START USING NOW</h2>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo and Welcome Text */}
          <div className="text-center">
            <div className="inline-block p-3 bg-emerald-500 rounded-lg mb-4">
              {/* Placeholder for the square logo */}
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-3xl font-extrabold">Welcome!</h2>
            <p className="mt-2 text-gray-400">Sign in to continue</p>
          </div>

          {/* Notification Area */}
          <div className="min-h-[60px]">
            {error && (
              <div className="p-3 text-sm text-red-300 bg-red-900/50 border border-red-500/50 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-300 bg-green-900/50 border border-green-500/50 rounded-md">
                {success}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <a href="#" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                Forgot your password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 transition-transform transform hover:scale-105"
            >
              Login
            </button>
          </form>
          
         
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
