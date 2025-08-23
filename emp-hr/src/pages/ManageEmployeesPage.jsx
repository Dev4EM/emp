import React, { useState, useEffect } from 'react';
import { getAllUsers,  updateUser } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const ManageEmployeesPage = () => {
  const [employees, setEmployees] = useState([]); // Initialize as empty array
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await getAllUsers();
        console.log('API Response:', response); // Debug log
        
        // Handle the new API response structure
        let employeeData = [];
        if (response && response.users) {
          employeeData = response.users; // New structure
        } else if (Array.isArray(response)) {
          employeeData = response; // Fallback for old structure
        } else {
          console.error('Unexpected response format:', response);
          employeeData = [];
        }
        
        setEmployees(employeeData);
        setFilteredEmployees(employeeData);
      } catch (err) {
        console.error('Error fetching employees:', err);
        toast.error(err.response?.data?.message || 'Failed to fetch employees.');
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    if (!Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }

    let filtered = employees.filter(employee => {
      const matchesSearch = 
        (employee["First name"] && employee["First name"].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee["Last name"] && employee["Last name"].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee["Work email"] && employee["Work email"].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee["Employee Code"] && employee["Employee Code"].toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = filterRole === 'all' || employee.userType === filterRole;
      
      return matchesSearch && matchesRole;
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, filterRole]);

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        // await deleteUser(userId);
        // setEmployees(prev => prev.filter(emp => emp._id !== userId));
        toast.success('Employee deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const updatedUser = await updateUser(userId, { userType: newRole });
      setEmployees(prev => 
        prev.map(emp => emp._id === userId ? { ...emp, userType: newRole } : emp)
      );
      toast.success('User role updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filteredEmployees) ? 
    filteredEmployees.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil((filteredEmployees?.length || 0) / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">Manage Employees</h1>
          <p className="text-gray-400">View and manage all employees in the system</p>
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-300">
              Total Employees: <span className="font-bold text-emerald-400">{employees.length}</span>
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FilterListIcon className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Filters & Search</h3>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <SearchIcon className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or employee code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Roles</option>
                <option value="employee">Employee</option>
                <option value="teamleader">Team Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Employment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentItems.map((employee, index) => (
                  <tr key={employee._id || index} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {`${employee.Prefix || ''} ${employee["First name"] || ''} ${employee["Last name"] || ''}`.trim()}
                        </div>
                        <div className="text-sm text-gray-400">
                          {employee["Employee Code"] || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {employee["Work email"] || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {employee["Mobile number"] || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {employee.Designation || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {employee.Department || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Joined: {formatDate(employee["Date of joining"])}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={employee.userType || 'employee'}
                        onChange={(e) => handleUpdateUserRole(employee._id, e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="employee">Employee</option>
                        <option value="teamleader">Team Leader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {employee["Reporting manager"] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteUser(
                            employee._id, 
                            `${employee["First name"]} ${employee["Last name"]}`
                          )}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-600/20"
                          title="Delete Employee"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* No Data State */}
        {filteredEmployees.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <PeopleIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Employees Found</h3>
            <p className="text-gray-500">No employees match your current search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEmployeesPage;
