import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { updateLeaveBalance } from './Api';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'; // ✅ and empty circle
import { useNavigate } from 'react-router-dom'; 
function LeaveBalanceModal({ user, onClose, onUserUpdate }) {
console.log("users data is:",user)
  const [localUser, setLocalUser] = useState(user || {});
  const [leaveBalance, setLeaveBalance] = useState(String(user?.paidLeaveBalance || '0'));
  const [isLeaveApplicable, setIsLeaveApplicable] = useState(user?.isLeaveApplicable || "false");
  const [isLoading, setIsLoading] = useState(false);
const navigate = useNavigate(); 
  // Sync local state when user changes (if modal reopened)
  useEffect(() => {
    if (user?._id) {
      setLocalUser(user);
      setLeaveBalance(String(user.paidLeaveBalance || '0'));
      setIsLeaveApplicable(user.isLeaveApplicable || "false");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localUser?._id) {
      toast.error('User data missing. Please reopen the modal.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        paidLeaveBalance: String(leaveBalance),
        isLeaveApplicable: isLeaveApplicable,
      };

      const updatedUser = await updateLeaveBalance(localUser._id, payload);
      updatedUser.isLeaveApplicable = isLeaveApplicable;
      updatedUser.paidLeaveBalance = String(leaveBalance);

      onUserUpdate(updatedUser);
      toast.success('Leave settings updated successfully!');
       navigate('/admin');
      onClose();
    } catch (error) {
      console.error('Error updating leave balance:', error);
      toast.error(error.message || 'Failed to update leave balance.');
       navigate('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  if (!localUser) return null;

  // Toggle function for icon click
  const toggleLeaveApplicable = () => {
    setIsLeaveApplicable(isLeaveApplicable === "true" ? "false" : "true");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Leave Settings</h2>
        <p className="text-gray-400 mb-2">
          User: {localUser['First name']} {localUser['Last name']}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Paid Leave Balance */}
          <div className="mb-4">
            <label htmlFor="leaveBalance" className="block text-sm font-medium text-gray-300 mb-2">
              Paid Leave Balance
            </label>
            <input
              id="leaveBalance"
              type="number"
              value={leaveBalance}
              onChange={(e) => setLeaveBalance(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Icon toggle for Leave Applicable */}
          <div className="mb-6 flex items-center cursor-pointer" onClick={toggleLeaveApplicable}>
            {isLeaveApplicable === "true" ? (
              <FaCheckCircle className="text-emerald-500 h-6 w-6" />
            ) : (
              <FaRegCircle className="text-gray-400 h-6 w-6" />
            )}
            <span className="ml-3 text-gray-300">Enable Paid Leaves</span>
          </div>

          {/* Buttons */}
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
