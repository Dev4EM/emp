import { useState, useEffect } from 'react';
import { getAllUsers } from '../components/Api';
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

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      console.log('Users response:', response);

      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        console.error("getAllUsers response is not in the expected format:", response);
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

  const handleUserClick = (user) => {
    console.log('User clicked:', user);
    setSelectedUser(user);
  };

  const handleCloseSidePanel = () => {
    console.log('Closing side panel');
    setSelectedUser(null);
  };

  const departments = ['All', ...new Set(users.map(user => user.Department || user.department).filter(Boolean))];
  const userTypes = ['All', 'admin', 'teamleader', 'employee'];

  const filteredUsers = users
    .filter(user =>
      (selectedDepartment === 'All' || user.Department === selectedDepartment || user.department === selectedDepartment)
    )
    .filter(user =>
      (selectedUserType === 'All' || user.userType === selectedUserType)
    )
    .filter(user =>
      (user['First name'] && user['First name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user['Last name'] && user['Last name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user['Work email'] && user['Work email'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user['Employee Code'] && user['Employee Code'].toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
      case 'admin':
        return <AdminPanelSettingsIcon className="w-5 h-5 text-purple-400" />;
      case 'teamleader':
        return <SupervisorAccountIcon className="w-5 h-5 text-blue-400" />;
      default:
        return <PersonIcon className="w-5 h-5 text-emerald-400" />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <ToastContainer theme="dark" position="top-right" />

      <div className={`transition-all duration-300 ${selectedUser ? 'mr-[50%]' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Manage and monitor all users in your organization
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <PeopleIcon className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <AdminPanelSettingsIcon className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.admins}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <SupervisorAccountIcon className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Team Leaders</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.teamleaders}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <PersonIcon className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Employees</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.employees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <FilterListIcon className="text-emerald-400" />
                <h3 className="text-lg font-semibold">Filters & Search</h3>
              </div>
              <Link to="/add-user" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded">
                Add User
              </Link>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Department Filter */}
                <select
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  value={selectedDepartment}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* User Type Filter */}
                <select
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setSelectedUserType(e.target.value)}
                  value={selectedUserType}
                >
                  {userTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All Roles' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => window.open(downloadAllAttendanceCSV(), '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Download All Attendance CSV
            </button>

            {selectedUser && (
              <button
                onClick={() => window.open(downloadEmployeeAttendanceCSV(selectedUser._id), '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Download {selectedUser['First name']}'s Attendance CSV
              </button>
            )}
          </div>

          {/* Users Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${selectedUser?._id === user._id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700/50 hover:border-emerald-400/50'
                    }`}
                  onClick={() => handleUserClick(user)}
                >

                  <div className="flex items-center space-x-3 mb-4">

                    {getUserTypeIcon(user.userType)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold truncate">
                        {user['First name']} {user['Last name']}
                      </h3>
                      <p className="text-sm text-gray-400">{user['Employee Code']}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 truncate">{user['Work email']}</p>
                    <p className="text-sm text-gray-400">{user.Department || user.department}</p>
                    <p className="text-sm text-gray-400">{user.Designation}</p>

                    <div className="flex justify-between items-center mt-3">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getUserTypeBadge(user.userType)}`}>
                        {user.userType || 'employee'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Click to view details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <PeopleIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Users Found</h3>
              <p className="text-gray-500">No users match your current search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <UserDetailsSidePanel
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={handleCloseSidePanel}
      />
    </div>
  );
}

export default AdminDashboardPage;
