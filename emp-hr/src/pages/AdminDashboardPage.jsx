import { useState, useEffect } from 'react';
import { getAllUsers, assignReportingManager } from '../components/Api'; // Assuming you create these API functions
import { toast, ToastContainer } from 'react-toastify';

function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedManager) {
      toast.error('Please select an employee and a manager.');
      return;
    }

    try {
      await assignReportingManager({ employeeId: selectedEmployee, managerId: selectedManager });
      toast.success('Reporting manager assigned successfully!');
      fetchUsers(); // Refresh the list
      setSelectedEmployee(null);
      setSelectedManager('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign manager.');
    }
  };

  const teamLeaders = users.filter(user => user.userType === 'teamleader');

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: All Users */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">All Users</h2>
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Reporting Manager</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-4">{user.name}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.reportingManager ? user.reportingManager.name : 'N/A'}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedEmployee(user._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Assign Manager
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Assign Manager Form */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Assign Reporting Manager</h2>
          {selectedEmployee ? (
            <form onSubmit={handleAssignManager} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Selected Employee</label>
                <input 
                  type="text" 
                  value={users.find(u => u._id === selectedEmployee)?.name || ''} 
                  readOnly 
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Select Manager (Team Leader)</label>
                <select 
                  value={selectedManager} 
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select a manager</option>
                  {teamLeaders.map(leader => (
                    <option key={leader._id} value={leader._id}>{leader.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 font-semibold bg-emerald-600 rounded-md hover:bg-emerald-700 transition-transform transform hover:scale-105"
              >
                Assign Manager
              </button>
            </form>
          ) : (
            <p>Select an employee from the list to assign a reporting manager.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
