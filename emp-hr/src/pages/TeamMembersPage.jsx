import { useState, useEffect } from 'react';
import { getTeamMembers } from '../components/Api'; // Assuming you create this API function
import { toast, ToastContainer } from 'react-toastify';

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
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Team Members</h1>
      {isLoading ? (
        <p>Loading team members...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">User Type</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">{member.name}</td>
                  <td className="p-4">{member.email}</td>
                  <td className="p-4">{member.userType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeamMembersPage;
