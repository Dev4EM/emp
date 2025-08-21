import { Navigate, Outlet } from 'react-router-dom';

const AuthWrapper = () => {
  const token = localStorage.getItem('token');

  // If token exists, render the nested routes (children)
  // Otherwise, redirect to the login page
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthWrapper;
