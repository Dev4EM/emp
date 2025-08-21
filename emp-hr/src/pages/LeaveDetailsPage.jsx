import { useState, useEffect } from 'react';
import { getUser } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';

function LeaveDetailsPage() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const userData = await getUser();
        setLeaves(userData.leaves || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch leave details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Leave Applications</h1>
      {isLoading ? (
        <p>Loading leave details...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Duration</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">{new Date(leave.date).toLocaleDateString()}</td>
                  <td className="p-4">{leave.type}</td>
                  <td className="p-4">{leave.duration === 1 ? 'Full Day' : 'Half Day'}</td>
                  <td className="p-4">{leave.status}</td>
                  <td className="p-4">{leave.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaveDetailsPage;
