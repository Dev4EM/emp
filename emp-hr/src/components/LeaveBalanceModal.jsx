import { useState } from 'react';
import { toast } from 'react-toastify';
import { updateLeaveBalance } from './Api'; // This function needs to be created

function LeaveBalanceModal({ user, onClose, onUserUpdate }) {
  const [leaveBalance, setLeaveBalance] = useState(user.paidLeaveBalance || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await updateLeaveBalance(user._id, leaveBalance);
      onUserUpdate(updatedUser);
      toast.success('Leave balance updated successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update leave balance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Leave Balance</h2>
        <p className="text-gray-400 mb-2">User: {user['First name']} {user['Last name']}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="leaveBalance" className="block text-sm font-medium text-gray-300 mb-2">Paid Leave Balance</label>
            <input
              id="leaveBalance"
              type="number"
              value={leaveBalance}
              onChange={(e) => setLeaveBalance(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveBalanceModal;
