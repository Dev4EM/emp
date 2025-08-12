import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login'); // 👈 redirect if no token
    }
  }, [navigate]);

  return <div className='p-4'>{children}</div>;
};

export default AuthWrapper;
