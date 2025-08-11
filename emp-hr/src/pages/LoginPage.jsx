import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import the api service

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    setError(''); // Clear previous errors

    try {
      const data = await api.loginUser({ email, password });
      
      // On successful login, save the token and redirect to the homepage
      localStorage.setItem('token', data.token);
      navigate('/');

    } catch (err) {
      // Handle login error
      console.error('Login failed:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>
        {error && <p className="mb-4 text-sm text-center text-red-600">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
