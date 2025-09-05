import { useState, useEffect } from 'react';
import { getMyAttendance } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function MyAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // ✅ Updated naming
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // ✅ Updated naming

  // ✅ Updated useEffect to fetch from new API with month/year params
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        const response = await getMyAttendance(selectedMonth, selectedYear);
        
        if (response.success) {
          setAttendance(response.attendance || []);
        } else {
          setAttendance([]);
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error(err.message || 'Failed to fetch attendance.');
        setAttendance([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedMonth, selectedYear]); // ✅ Updated dependencies

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

  // ✅ Updated to use totalHours from backend or calculate if needed
  const calculateWorkDuration = (checkIn, checkOut, totalHours) => {
    // Use backend calculated totalHours if available
    if (totalHours) {
      const hours = Math.floor(totalHours);
      const minutes = Math.floor((totalHours % 1) * 60);
      return `${hours}h ${minutes}m`;
    }
    
    // Fallback to manual calculation
    if (!checkIn || !checkOut) return 'N/A';
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime - checkInTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // ✅ Updated stats calculation for new data structure
  const getAttendanceStats = () => {
    const totalDays = attendance.length;
    const completeDays = attendance.filter(record => record.status === 'Present').length;
    const halfDays = attendance.filter(record => record.status === 'Half Day').length;
    const absentDays = attendance.filter(record => record.status === 'Absent').length;
    
    const totalHours = attendance.reduce((total, record) => {
      return total + (record.totalHours || 0);
    }, 0);
    
    const avgWorkHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;
    
    return { totalDays, completeDays, halfDays, absentDays, avgWorkHours };
  };

  // ✅ Updated status badge to use backend status
  const getStatusBadge = (record) => {
    const status = record.status;
    
    switch (status) {
      case 'Present':
        return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Present</span>;
      case 'Half Day':
        return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Half Day</span>;
      case 'Absent':
        return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Absent</span>;
      default:
        return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">Unknown</span>;
    }
  };

  const stats = getAttendanceStats();

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-4">My Attendance</h1>
          
          {/* ✅ Updated Month/Year Filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(2024, i).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* ✅ Updated Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <CalendarTodayIcon className="text-blue-400" />
                <p className="text-sm text-gray-400">Total Days</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalDays}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <WorkIcon className="text-green-400" />
                <p className="text-sm text-gray-400">Present Days</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.completeDays}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AccessTimeIcon className="text-yellow-400" />
                <p className="text-sm text-gray-400">Half Days</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats.halfDays}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUpIcon className="text-purple-400" />
                <p className="text-sm text-gray-400">Avg. Hours</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.avgWorkHours}h</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
          </div>
        ) : attendance.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Check In</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Check Out</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Duration</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Location</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {attendance.map((record, index) => (
                      <tr key={record._id || index} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
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
                            {/* ✅ Use backend totalHours or calculate */}
                            {calculateWorkDuration(record.checkIn, record.checkOut, record.totalHours)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <LocationOnIcon className="w-4 h-4 mr-2 text-purple-400" />
                            <span className="text-sm text-gray-400 truncate max-w-xs">
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
              {attendance.map((record, index) => (
                <div key={record._id || index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
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
                        {calculateWorkDuration(record.checkIn, record.checkOut, record.totalHours)}
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
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Attendance Records Found</h3>
            <p className="text-gray-500">No attendance records found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAttendancePage;
