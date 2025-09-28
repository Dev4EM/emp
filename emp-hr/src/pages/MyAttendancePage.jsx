import { useState, useEffect } from 'react';
import { getMonthlyAttendance } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function MyAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

 useEffect(() => {
  const fetchAttendance = async () => {
    setIsLoading(true);

    // Build valid ISO strings for 1st day and last day of selected month
   const formatDate = (date) => {
  // Format a Date object to 'YYYY-MM-DD'
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startDateObj = new Date(currentYear, currentMonth, 1); // 1st day of month
const endDateObj = new Date(currentYear, currentMonth + 1, 0); // last day of month

const startDate = formatDate(startDateObj); 
const endDate = formatDate(endDateObj);    


    try {
      const response = await getMonthlyAttendance(startDate, endDate);
      setAttendance(response);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchAttendance();
}, [currentMonth, currentYear]);


  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateWorkDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime - checkInTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getAttendanceStats = () => {
    const totalDays = attendance.length;
    const completeDays = attendance.filter(record => record.checkIn && record.checkOut).length;
    const incompleteDays = totalDays - completeDays;
    
    const totalWorkMinutes = attendance
      .filter(record => record.checkIn && record.checkOut)
      .reduce((total, record) => {
        const checkIn = new Date(record.checkIn);
        const checkOut = new Date(record.checkOut);
        const diffMs = checkOut - checkIn;
        return total + (diffMs / (1000 * 60));
      }, 0);
    
    const avgWorkHours = totalWorkMinutes > 0 ? (totalWorkMinutes / completeDays / 60).toFixed(1) : 0;
    
    return { totalDays, completeDays, incompleteDays, avgWorkHours };
  };

  const getStatusBadge = (record) => {
    if (!record.checkIn) return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Absent</span>;
    if (!record.checkOut) return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Incomplete</span>;
    return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Complete</span>;
  };

  const filteredAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const stats = getAttendanceStats();

  return (
    <div className="p-8 bg-gray-100 text-black min-h-screen">
      <ToastContainer theme="colored" />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-800 mb-4">My Attendance</h1>
          
          {/* Month/Year Filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="bg-white border border-gray-600 rounded-lg px-4 py-2 text-black"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="bg-white border border-gray-600 rounded-lg px-4 py-2 text-black"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <CalendarTodayIcon className="text-blue-400" />
                <p className="text-sm text-gray-900">Total Days</p>
              </div>
              <p className="text-2xl text-black font-bold">{stats.totalDays}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <WorkIcon className="text-green-400" />
                <p className="text-sm text-gray-800">Complete Days</p>
              </div>
              <p className="text-2xl font-bold text-black">{stats.completeDays}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AccessTimeIcon className="text-yellow-400" />
                <p className="text-sm text-gray-400">Incomplete Days</p>
              </div>
              <p className="text-2xl font-bold text-black">{stats.incompleteDays}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUpIcon className="text-purple-400" />
                <p className="text-sm text-gray-400">Avg. Hours</p>
              </div>
              <p className="text-2xl font-bold text-black">{stats.avgWorkHours}h</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
          </div>
        ) : filteredAttendance.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-700 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Check In</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Check Out</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Duration</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Location</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white">
                    {filteredAttendance.map((record, index) => (
                      <tr key={record.date || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <CalendarTodayIcon className="w-4 h-4 mr-2 text-emerald-400" />
                            <div>
                              <span className="font-medium">{formatDate(record.date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <AccessTimeIcon className="w-4 h-4 mr-2 text-green-400" />
                            <span>{formatTime(record.checkIn)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <AccessTimeIcon className="w-4 h-4 mr-2 text-orange-400" />
                            <span>{formatTime(record.checkOut)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-blue-400">
                            {calculateWorkDuration(record.checkIn, record.checkOut)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <LocationOnIcon className="w-4 h-4 mr-2 text-purple-400" />
                            <span className="text-sm text-gray-900 truncate max-w-xs">
                              {record.checkInLocation?.address || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(record)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredAttendance.map((record, index) => (
                <div key={record.date || index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <CalendarTodayIcon className="w-5 h-5 mr-2 text-emerald-400" />
                      <h3 className="font-semibold">{formatDate(record.date)}</h3>
                    </div>
                    {getStatusBadge(record)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <AccessTimeIcon className="w-4 h-4 mr-2 text-green-400" />
                        <span className="text-sm text-gray-400">Check In:</span>
                      </div>
                      <span className="font-medium">{formatTime(record.checkIn)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <AccessTimeIcon className="w-4 h-4 mr-2 text-orange-400" />
                        <span className="text-sm text-gray-400">Check Out:</span>
                      </div>
                      <span className="font-medium">{formatTime(record.checkOut)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Duration:</span>
                      <span className="font-semibold text-blue-400">
                        {calculateWorkDuration(record.checkIn, record.checkOut)}
                      </span>
                    </div>
                    
                    {record.checkInLocation?.address && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-start">
                          <LocationOnIcon className="w-4 h-4 mr-2 text-purple-400 mt-0.5" />
                          <span className="text-sm text-gray-400">
                            {record.checkInLocation.address}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <CalendarTodayIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Attendance Records Found</h3>
            <p className="text-gray-500">No attendance records found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAttendancePage;
