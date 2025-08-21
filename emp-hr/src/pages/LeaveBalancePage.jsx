import { useState, useEffect } from 'react';
import { getLeaveBalance } from '../components/Api'; // Assuming you create this API function
import { toast, ToastContainer } from 'react-toastify';

function LeaveBalancePage() {
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await getLeaveBalance();
        setLeaveBalance(response);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch leave balance.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveBalance();
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Leave Balance</h1>
      {isLoading ? (
        <p>Loading leave balance...</p>
      ) : leaveBalance ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-semibold">Remaining Paid Leave</h2>
            <p className="text-5xl font-bold text-emerald-400 mt-4">{leaveBalance.remainingPaidLeave}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-semibold">Paid Leaves Taken</h2>
            <p className="text-5xl font-bold text-emerald-400 mt-4">{leaveBalance.paidLeavesTaken}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-semibold">Unpaid Leaves Taken</h2>
            <p className="text-5xl font-bold text-emerald-400 mt-4">{leaveBalance.unpaidLeavesTaken}</p>
          </div>
        </div>
      ) : (
        <p>Could not load leave balance.</p>
      )}
    </div>
  );
}

export default LeaveBalancePage;
