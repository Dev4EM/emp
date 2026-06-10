import { useState, useEffect } from 'react';
import { getAllUsersDash } from '../components/Api';
import { downloadAllAttendanceCSV, downloadEmployeeAttendanceCSV } from '../components/Api';

import { toast, ToastContainer } from 'react-toastify';
import UserDetailsSidePanel from '../components/UserDetailsSidePanel.jsx';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { Link } from 'react-router-dom';

function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedUserType, setSelectedUserType] = useState('All');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsersDash();
      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        toast.error('Unexpected response format while fetching users');
        setUsers([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = (user) => setSelectedUser(user);
  const handleCloseSidePanel = () => setSelectedUser(null);
  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
    setSelectedUser(updatedUser);
  };

  const departments = ['All', ...new Set(users.map(user => user.Department || user.department).filter(Boolean))];
  const userTypes = ['All', 'admin', 'teamleader', 'employee'];

  const filteredUsers = users
  .filter(user =>
    (selectedDepartment === 'All' || user.department === selectedDepartment)
  )
  .filter(user =>
    (selectedUserType === 'All' || user.userType === selectedUserType)
  )
  .filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.workEmail && user.workEmail.toLowerCase().includes(searchLower)) ||
      (user.employeeCode && user.employeeCode.toLowerCase().includes(searchLower))
    );
  });


  const getStats = () => {
    const total = users.length;
    const admins = users.filter(u => u.userType === 'admin').length;
    const teamleaders = users.filter(u => u.userType === 'teamleader').length;
    const employees = users.filter(u => u.userType === 'employee').length;
    return { total, admins, teamleaders, employees };
  };

  const stats = getStats();

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin': return <AdminPanelSettingsIcon className="text-purple-400" />;
      case 'teamleader': return <SupervisorAccountIcon className="text-blue-400" />;
      default: return <PersonIcon className="text-emerald-400" />;
    }
  };

  const getUserTypeBadge = (userType) => {
    const colors = {
      admin: 'bg-purple-600',
      teamleader: 'bg-blue-600',
      employee: 'bg-emerald-600'
    };
    return colors[userType] || colors.employee;
  };

  return (
  <div className="min-h-screen bg-gray-100 text-gray-900">
    <ToastContainer theme="light" position="top-right" />

    <div className={`transition-all duration-300 ${selectedUser ? 'mr-[50%]' : ''}`}>
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">Manage and monitor all users and attendance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[{ label: "Total Users", value: stats.total, icon: <PeopleIcon className="text-blue-600" /> },
            { label: "Admins", value: stats.admins, icon: <AdminPanelSettingsIcon className="text-purple-600" /> },
            { label: "Team Leaders", value: stats.teamleaders, icon: <SupervisorAccountIcon className="text-blue-600" /> },
            { label: "Employees", value: stats.employees, icon: <PersonIcon className="text-emerald-600" /> }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-opacity-20 rounded-lg">{item.icon}</div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 lg:mb-0">
              <FilterListIcon className="text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
            </div>

            <Link to="/add-employee" className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-white font-bold">
              Add User
            </Link>

            <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-300 px-4 py-2 rounded text-gray-900"
              />
              <select
                onChange={(e) => setSelectedDepartment(e.target.value)}
                value={selectedDepartment}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
              >
                {departments.map(dept => <option key={dept}>{dept}</option>)}
              </select>
              <select
                onChange={(e) => setSelectedUserType(e.target.value)}
                value={selectedUserType}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
              >
                {userTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
         <button
  onClick={async () => {
    try {
      setIsDownloadingAll(true);
      toast.info('Preparing download...');
      await downloadAllAttendanceCSV();
      toast.success('All attendance downloaded!');
    } catch (error) {
      toast.error('Failed to download CSV');
    } finally {
      setIsDownloadingAll(false);
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
  disabled={isDownloadingAll}
>
  {isDownloadingAll ? (
    <>
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      Downloading...
    </>
  ) : 'Download All Attendance CSV'}
</button>

          {selectedUser && (
            <button
              onClick={() => window.open(downloadEmployeeAttendanceCSV(selectedUser._id), '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Download {selectedUser['First name']}'s Attendance
            </button>
          )}
        </div>

        {/* User Cards */}
        {isLoading ? (
          <div className="text-center text-gray-700">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user)}
                className="bg-white p-5 rounded-xl border border-gray-300 shadow-sm hover:border-emerald-600 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-3 text-gray-900">
                  {getUserTypeIcon(user.userType)}
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.employeeCode}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-1">{user.workEmail}</p>
                <p className="text-sm text-gray-500 mb-1">{user.department || user.Department}</p>

                <div className="mt-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getUserTypeBadge(user.userType)}`}>
                    {user.userType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Side Panel */}
    <UserDetailsSidePanel
      user={selectedUser}
      isOpen={!!selectedUser}
      onClose={handleCloseSidePanel}
      onUserUpdate={handleUserUpdate}
    />
  </div>
);

}

export default AdminDashboardPage;
