import { useState, useEffect } from 'react';
import { getTeamMembers } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';

function TeamMembersPage() {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'bg-purple-600';
      case 'teamleader':
        return 'bg-blue-600';
      case 'employee':
        return 'bg-emerald-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">My Team Members</h1>
          <p className="text-gray-400">Manage and view your team members</p>
          
          {/* Team Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <PeopleIcon className="text-emerald-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Team Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <WorkIcon className="text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Active Employees</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => m["Employment status"] === "Active" || m["Employment status"] === "Confirmed").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <BusinessIcon className="text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Departments</p>
                  <p className="text-2xl font-bold">
                    {new Set(teamMembers.map(m => m.Department).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <PeopleIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Team Members Found</h3>
            <p className="text-gray-500">You don't have any team members reporting to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div 
                key={member._id} 
                className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-emerald-400 transition-colors duration-300"
              >
                {/* Profile Section */}
                <div className="flex flex-col items-center text-center mb-4">
                  <AccountCircleIcon style={{ fontSize: 80 }} className="text-emerald-400 mb-3" />
                  <h2 className="text-xl font-bold">
                    {`${member.Prefix || ''} ${member["First name"] || ''} ${member["Last name"] || ''}`.trim()}
                  </h2>
                  <p className="text-sm text-gray-400 mb-2">{member["Employee Code"] || 'N/A'}</p>
                  
                  {/* Role Badge */}
                  <span className={`inline-block ${getRoleBadgeColor(member.userType)} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                    {member.userType || 'employee'}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <EmailIcon className="text-blue-400 w-4 h-4" />
                    <span className="text-sm text-gray-300 truncate">
                      {member["Work email"] || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="text-green-400 w-4 h-4" />
                    <span className="text-sm text-gray-300">
                      {member["Mobile number"] || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <WorkIcon className="text-orange-400 w-4 h-4" />
                    <span className="text-sm text-gray-300">
                      {member.Designation || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <BusinessIcon className="text-purple-400 w-4 h-4" />
                    <span className="text-sm text-gray-300">
                      {member.Department || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CalendarTodayIcon className="text-yellow-400 w-4 h-4" />
                    <span className="text-sm text-gray-300">
                      Joined: {formatDate(member["Date of joining"])}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className="text-white font-medium">{member["Employment status"] || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Branch:</span>
                      <p className="text-white font-medium">{member.Branch || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Shift:</span>
                      <p className="text-white font-medium">{member.Shift || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Leave Balance:</span>
                      <p className="text-emerald-400 font-medium">{member.paidLeaveBalance || 0} days</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => window.location.href = `mailto:${member["Work email"]}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
                  >
                    Email
                  </button>
                  <button 
                    onClick={() => window.location.href = `tel:${member["Mobile number"]}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
                  >
                    Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamMembersPage;
