import { useState, useEffect } from 'react';
import { getMyAttendance } from '../components/Api'; // Assuming you create this API function
import { toast, ToastContainer } from 'react-toastify';

function MyAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await getMyAttendance();
        setAttendance(response);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch attendance.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Attendance</h1>
      {isLoading ? (
        <p>Loading attendance...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Check In</th>
                <th className="p-4 text-left">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.date} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(record.checkIn).toLocaleTimeString()}</td>
                  <td className="p-4">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyAttendancePage;
