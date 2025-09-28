import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { shifts, getAttendanceStatus } from './shifts';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { downloadEmployeeAttendanceCSV } from '../components/Api';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WeekendIcon from '@mui/icons-material/Weekend';
import { format, isSameDay, isWeekend, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { toast } from 'react-toastify';
import AttendanceModal from './AttendanceModal';
import LeaveBalanceModal from './LeaveBalanceModal';

function UserDetailsSidePanel({ user, isOpen, onClose, onUserUpdate }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceForSelectedDate, setAttendanceForSelectedDate] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveBalanceModalOpen, setIsLeaveBalanceModalOpen] = useState(false);
  

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedDate && user?.attendance) {
      const dayAttendance = user.attendance.find(att => 
        isSameDay(new Date(att.date), selectedDate)
      );
      setAttendanceForSelectedDate(dayAttendance || null);
    } else {
      setAttendanceForSelectedDate(null);
    }
  }, [selectedDate, user?.attendance]);

  if (!isOpen || !user) return null;

  // 📅 Updated format functions for dd-mm-yyyy hh:mm format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Time formatting error:', error);
      return timeString;
    }
  };

  // Format with both date and time for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return dateTimeString;
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin':
        return <AdminPanelSettingsIcon className="w-6 h-6 text-purple-400" />;
      case 'teamleader':
        return <SupervisorAccountIcon className="w-6 h-6 text-blue-400" />;
      default:
        return <PersonIcon className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getUserTypeBadge = (userType) => {
    const colors = {
      admin: 'bg-purple-600',
      teamleader: 'bg-blue-600',
      employee: 'bg-emerald-600'
    };
    return colors[userType] || colors.employee;
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    
    const hours = differenceInHours(checkOutTime, checkInTime);
    const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Handle CSV download
 // Update the handleDownloadCSV function
const handleDownloadCSV = async () => {
  try {
    setDownloadLoading(true);
    toast.info(`Preparing ${user['First name']}'s attendance CSV...`);
    
    // Call the API function directly (don't use window.open)
    await downloadEmployeeAttendanceCSV(user._id);
    
    toast.success(`${user['First name']}'s attendance CSV downloaded successfully!`);
  } catch (error) {
    console.error('Download failed:', error);
    toast.error(error.message || 'Failed to download CSV');
  } finally {
    setDownloadLoading(false);
  }
};


  // Get attendance dates for calendar modifiers
  const getAttendanceDates = () => {
    if (!user?.attendance) return { attendedDates: [], weekendDates: [] };
    
    const attendedDates = user.attendance.map(att => new Date(att.date));
    const weekendDates = [];
    
    // Generate weekend dates for the current year
    const currentYear = new Date().getFullYear();
    for (let month = 0; month < 12; month++) {
      for (let day = 1; day <= 31; day++) {
        const date = new Date(currentYear, month, day);
        if (date.getMonth() === month && isWeekend(date)) {
          weekendDates.push(date);
        }
      }
    }
    
    return { attendedDates, weekendDates };
  };

  const { attendedDates, weekendDates } = getAttendanceDates();

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const openLeaveBalanceModal = () => {
    setIsLeaveBalanceModalOpen(true);
  };

  const closeLeaveBalanceModal = () => {
    setIsLeaveBalanceModalOpen(false);
  };

  

  return (
   <div>
    {/* Backdrop */}
    <div 
      className={`fixed inset-0 bg-gray-100 transition-opacity duration-300 z-40 ${
        isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    />
    
    {/* Side Panel - 50% width */}
    <div 
      className={`fixed top-0 right-0 h-full w-1/2 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
          <div className="flex items-center gap-3">
            {/* Download Button */}
            <button
              onClick={handleDownloadCSV}
              disabled={downloadLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                downloadLoading 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <DownloadIcon className="w-4 h-4" />
              {downloadLoading ? 'Downloading...' : 'Download CSV'}
            </button>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <CloseIcon className="text-gray-500 hover:text-gray-900" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 space-y-6">
            {/* User Profile */}
            <div className="text-center bg-white rounded-xl p-6 shadow">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                {getUserTypeIcon(user.userType)}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {`${user.Prefix || ''} ${user.name}`.trim()}
              </h3>
              <span className={`px-3 py-1 text-sm font-medium text-black rounded-full ${getUserTypeBadge(user.userType)}`}>
                {user.userType || 'employee'}
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-500/20 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-2xl font-bold text-emerald-400">{user.paidLeaveBalance || 0}</p>
                  <button onClick={openLeaveBalanceModal} className="text-emerald-400 hover:text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500">Leave Balance</p>
              </div>
              <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{user.attendance?.length || 0}</p>
                <p className="text-xs text-gray-500">Attendance Days</p>
              </div>
              <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{user.leaves?.length || 0}</p>
                <p className="text-xs text-gray-500">Leave Requests</p>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div className="bg-white text-black rounded-xl p-6 shadow">
              <h4 className="text-lg font-semibold text-black mb-4 flex items-center">
                <CalendarTodayIcon className="w-5 h-5 mr-2 text-emerald-600" />
                Attendance Calendar
              </h4>
              {/* Your calendar styling stays the same */}
              <div className="attendance-calendar">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateClick}
                  modifiers={{
                    attended: attendedDates,
                    weekend: weekendDates,
                  }}
                  numberOfMonths={1}
                  showOutsideDays={false}
                />
              </div>
              {/* Calendar Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                  <span className="text-gray-600">Attended</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">Weekend</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-800 rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <EventAvailableIcon className="w-5 h-5 mr-2 text-blue-600" />
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    {isWeekend(selectedDate) && <WeekendIcon className="w-4 h-4 ml-2 text-yellow-500" />}
                  </div>
                </h4>
                
                {attendanceForSelectedDate ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 shadow">
                      {/* ... keep inner content colors mostly the same but change text to darker colors */}
                      {/* Check In */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-600">Check In</span>
                          </div>
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatTime(attendanceForSelectedDate.checkIn)}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <EventBusyIcon className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-gray-600">Check Out</span>
                          </div>
                          <p className="text-lg font-semibold text-orange-600">
                            {attendanceForSelectedDate.checkOut ? formatTime(attendanceForSelectedDate.checkOut) : 'Not checked out'}
                          </p>
                        </div>
                        <div>
                            {user ? (
  <div>
    {/* existing details */}
    <p className="mt-2 text-sm font-semibold text-gray-800">
      Shift: {user.userShift} {/* Or pick dynamically */}
    </p>
    <p className="mt-1 text-sm text-gray-700">
      Status: {getAttendanceStatus(shifts.general, new Date(attendanceForSelectedDate.checkIn), new Date(attendanceForSelectedDate.checkOut))}
    </p>
  </div>
) : null}</div>
                      </div>
                    

                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AccessTimeIcon className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-600">Hours Worked</span>
                          </div>
                          <p className="text-lg font-semibold text-purple-600">
                            {calculateWorkHours(attendanceForSelectedDate.checkIn, attendanceForSelectedDate.checkOut)}
                          </p>
                        </div>
                      </div>

                      {/* Location Info */}
                      {attendanceForSelectedDate.checkOutLocation && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="flex items-start space-x-2">
                            <LocationOnIcon className="w-4 h-4 text-blue-600 mt-1" />
                            <div>
                              <span className="text-sm text-gray-600">Check-out Location</span>
                              <p className="text-sm text-gray-800 mt-1">
                                {attendanceForSelectedDate.checkOutLocation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {attendanceForSelectedDate.checkInLocation && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="flex items-start space-x-2">
                            <LocationOnIcon className="w-4 h-4 text-blue-600 mt-1" />
                            <div>
                              <span className="text-sm text-gray-600">Check-in Location</span>
                              <p className="text-sm text-gray-800 mt-1">
                                {attendanceForSelectedDate.checkInLocation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {isWeekend(selectedDate) ? (
                      <div className="space-y-2">
                        <WeekendIcon className="w-12 h-12 text-yellow-500 mx-auto" />
                        <p className="text-yellow-600 font-medium">Weekend Day</p>
                        <p className="text-sm text-gray-500">No attendance expected</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <EventBusyIcon className="w-12 h-12 text-red-600 mx-auto" />
                        <p className="text-red-600 font-medium">No Attendance</p>
                        <p className="text-sm text-gray-500">Employee was absent on this day</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PersonIcon className="w-5 h-5 mr-2 text-emerald-600" />
                Basic Information
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Employee Code</p>
                    <p className="text-gray-900 font-medium">{user.employeeCode || 'N/A'}</p>
                  </div>  
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-gray-900 font-medium">{user.Department || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium text-sm">{user.workEmail || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="text-gray-900 font-medium">{user.userContact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Designation</p>
                    <p className="text-gray-900 font-medium">{user.userDesignation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attendance Summary with Updated Formatting */}
            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AccessTimeIcon className="w-5 h-5 mr-2 text-yellow-600" />
                Recent Attendance (Last 5 Days)
              </h4>
              <div className="space-y-2">
                {user.attendance?.slice(-5).reverse().map((att, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(att.date)}</p>
                      <p className="text-xs text-gray-500">
                        {att.checkIn ? `${formatTime(att.checkIn)}` : 'No check-in'} - {att.checkOut ? `${formatTime(att.checkOut)}` : 'No check-out'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        {calculateWorkHours(att.checkIn, att.checkOut)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No attendance records found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default UserDetailsSidePanel;
