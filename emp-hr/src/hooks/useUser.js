import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getUser } from '../components/Api';

const useUser = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user', err);

        // ✅ If token expired (401), clear and redirect
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token'); 
          navigate('/login'); 
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  return { user, isLoading };
};

export default useUser;
