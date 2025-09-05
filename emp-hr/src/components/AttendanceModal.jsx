import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { updateAttendance, getAllUsers } from './Api'; // This function needs to be created

function AttendanceModal({ user, date, attendance, onClose, onUserUpdate }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (attendance) {
      setCheckIn(attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
      setCheckOut(attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
    } else {
      setCheckIn('');
      setCheckOut('');
    }
  }, [attendance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateAttendance(user._id, date, { checkIn, checkOut });
      if (onUserUpdate) {
        // Refetch user to get all updated data
        const response = await getAllUsers();
        const updatedUser = response.users.find(u => u._id === user._id);
        onUserUpdate(updatedUser);
      }
      toast.success('Attendance updated successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Attendance</h2>
        <p className="text-gray-400 mb-2">User: {user['First name']} {user['Last name']}</p>
        <p className="text-gray-400 mb-6">Date: {new Date(date).toLocaleDateString()}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="checkIn" className="block text-sm font-medium text-gray-300 mb-2">Check-in Time</label>
            <input
              id="checkIn"
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="checkOut" className="block text-sm font-medium text-gray-300 mb-2">Check-out Time</label>
            <input
              id="checkOut"
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
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

export default AttendanceModal;
