import { useState, useEffect } from 'react';
import { getTeamMembers } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function TeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await getTeamMembers();
        setTeamMembers(response);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch team members.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Team Members</h1>
        {isLoading ? (
          <p>Loading team members...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member._id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col items-center text-center">
                <AccountCircleIcon style={{ fontSize: 100 }} className="text-emerald-400" />
                <h2 className="text-2xl font-bold mt-4">{member.name}</h2>
                <p className="text-lg text-gray-400">{member.email}</p>
                <span className="inline-block bg-emerald-600 text-white text-sm font-semibold px-3 py-1 rounded-full mt-2">
                  {member.userType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamMembersPage;
