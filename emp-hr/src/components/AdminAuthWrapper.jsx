import { Navigate, Outlet } from 'react-router-dom';
import useUser from '../hooks/useUser';

const AdminAuthWrapper = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminAuthWrapper;
