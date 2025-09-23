import React from 'react'
import { useState, useEffect } from 'react';
import { getTeamMembers } from '../components/Api';
const TutorDashboard = () => {
  const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const fetchTeamMembers = async () => {
        try {
          const response = await getTeamMembers();
          console.log('Team members response:', response); // Debug log
          setTeamMembers(response);
          
        } catch (err) {
          console.error('Error fetching team members:', err);
          toast.error(err.response?.data?.message || 'Failed to fetch team members.');
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchTeamMembers();
    }, []);
  return (
    <div>
      {teamMembers.length}
    </div>
  )
}

export default TutorDashboard