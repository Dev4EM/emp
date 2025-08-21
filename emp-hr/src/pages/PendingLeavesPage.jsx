import { useState, useEffect } from 'react';
import { getPendingLeaves, approveLeave, rejectLeave } from '../components/Api'; // Assuming you create these API functions
import { toast, ToastContainer } from 'react-toastify';

function PendingLeavesPage() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingLeaves = async () => {
    try {
      const response = await getPendingLeaves();
      setPendingLeaves(response);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch pending leaves.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const handleApprove = async (employeeId, leaveId) => {
    try {
      await approveLeave({ employeeId, leaveId });
      toast.success('Leave approved successfully!');
      fetchPendingLeaves(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve leave.');
    }
  };

  const handleReject = async (employeeId, leaveId) => {
    try {
      await rejectLeave({ employeeId, leaveId });
      toast.success('Leave rejected successfully!');
      fetchPendingLeaves(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject leave.');
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">Pending Leave Requests</h1>
      {isLoading ? (
        <p>Loading pending leaves...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4 text-left">Employee Name</th>
                <th className="p-4 text-left">Leave Date</th>
                <th className="p-4 text-left">Leave Type</th>
                <th className="p-4 text-left">Duration</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map((leave) => (
                <tr key={leave.leaveId} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">{leave.employeeName}</td>
                  <td className="p-4">{new Date(leave.date).toLocaleDateString()}</td>
                  <td className="p-4">{leave.type}</td>
                  <td className="p-4">{leave.duration === 1 ? 'Full Day' : 'Half Day'}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleApprove(leave.employeeId, leave.leaveId)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(leave.employeeId, leave.leaveId)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PendingLeavesPage;
