import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
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
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side Panel - 50% width */}
      <div 
        className={`fixed top-0 right-0 h-full w-1/2 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-2xl font-bold text-white">Employee Details</h2>
            <div className="flex items-center gap-3">
              {/* Download Button */}
              <button
                onClick={handleDownloadCSV}
                disabled={downloadLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  downloadLoading 
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <DownloadIcon className="w-4 h-4" />
                {downloadLoading ? 'Downloading...' : 'Download CSV'}
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <CloseIcon className="text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* User Profile */}
              <div className="text-center bg-gray-700/30 rounded-xl p-6">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getUserTypeIcon(user.userType)}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {`${user.Prefix || ''} ${user["First name"] || ''} ${user["Last name"] || ''}`.trim()}
                </h3>
                <span className={`px-3 py-1 text-sm font-medium text-white rounded-full ${getUserTypeBadge(user.userType)}`}>
                  {user.userType || 'employee'}
                </span>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/20 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="text-2xl font-bold text-emerald-400">{user.paidLeaveBalance || 0}</p>
                    <button onClick={openLeaveBalanceModal} className="text-emerald-400 hover:text-emerald-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Leave Balance</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{user.attendance?.length || 0}</p>
                  <p className="text-xs text-gray-400">Attendance Days</p>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{user.leaves?.length || 0}</p>
                  <p className="text-xs text-gray-400">Leave Requests</p>
                </div>
              </div>

              {/* Attendance Calendar */}
              <div className="bg-gray-700/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CalendarTodayIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Attendance Calendar
                </h4>
                
                {/* Custom Calendar Styles */}
                <style jsx>{`
                  .attendance-calendar .rdp {
                    --rdp-cell-size: 35px;
                    --rdp-accent-color: #10b981;
                    --rdp-background-color: #374151;
                    margin: 0;
                    color: white;
                  }
                  
                  .attendance-calendar .rdp-months {
                    justify-content: center;
                  }
                  
                  .attendance-calendar .rdp-month {
                    background: #1f2937;
                    border-radius: 12px;
                    padding: 16px;
                    margin: 8px;
                  }
                  
                  .attendance-calendar .rdp-caption {
                    color: #10b981;
                    font-weight: 600;
                    margin-bottom: 16px;
                  }
                  
                  .attendance-calendar .rdp-head_cell {
                    color: #9ca3af;
                    font-weight: 500;
                    font-size: 0.75rem;
                  }
                  
                  .attendance-calendar .rdp-day {
                    width: 35px;
                    height: 35px;
                    border-radius: 8px;
                    color: #e5e7eb;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    border: none;
                    background: transparent;
                  }
                  
                  .attendance-calendar .rdp-day:hover {
                    background: #4b5563;
                    transform: scale(1.05);
                  }
                  
                  .attendance-calendar .rdp-day_selected {
                    background: #3b82f6 !important;
                    color: white;
                    font-weight: bold;
                    transform: scale(1.1);
                  }
                  
                  .attendance-calendar .rdp-day_attended {
                    background: #10b981;
                    color: white;
                  }
                  
                  .attendance-calendar .rdp-day_weekend {
                    color: #fbbf24;
                    background: #451a03;
                  }
                  
                  .attendance-calendar .rdp-day_today {
                    background: #1e40af;
                    color: white;
                    font-weight: bold;
                  }
                `}</style>
                
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
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span className="text-gray-300">Attended</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-300">Weekend</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-gray-300">Selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-800 rounded"></div>
                    <span className="text-gray-300">Today</span>
                  </div>
                </div>
              </div>

              {/* Selected Date Details */}
              {selectedDate && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <EventAvailableIcon className="w-5 h-5 mr-2 text-blue-400" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      {isWeekend(selectedDate) && <WeekendIcon className="w-4 h-4 ml-2 text-yellow-400" />}
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Edit
                    </button>
                  </h4>
                  
                  {attendanceForSelectedDate ? (
                    <div className="space-y-3">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-gray-400">Check In</span>
                            </div>
                            <p className="text-lg font-semibold text-emerald-400">
                              {formatTime(attendanceForSelectedDate.checkIn)}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <EventBusyIcon className="w-4 h-4 text-orange-400" />
                              <span className="text-sm text-gray-400">Check Out</span>
                            </div>
                            <p className="text-lg font-semibold text-orange-400">
                              {attendanceForSelectedDate.checkOut ? formatTime(attendanceForSelectedDate.checkOut) : 'Not checked out'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AccessTimeIcon className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-400">Hours Worked</span>
                            </div>
                            <p className="text-lg font-semibold text-purple-400">
                              {calculateWorkHours(attendanceForSelectedDate.checkIn, attendanceForSelectedDate.checkOut)}
                            </p>
                          </div>
                        </div>

                        {/* Location Info */}
                        {attendanceForSelectedDate.checkInLocation?.address && (
                          <div className="mt-4 pt-4 border-t border-gray-600">
                            <div className="flex items-start space-x-2">
                              <LocationOnIcon className="w-4 h-4 text-blue-400 mt-1" />
                              <div>
                                <span className="text-sm text-gray-400">Check-in Location</span>
                                <p className="text-sm text-gray-300 mt-1">
                                  {attendanceForSelectedDate.checkInLocation.address}
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
                          <WeekendIcon className="w-12 h-12 text-yellow-400 mx-auto" />
                          <p className="text-yellow-400 font-medium">Weekend Day</p>
                          <p className="text-sm text-gray-400">No attendance expected</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <EventBusyIcon className="w-12 h-12 text-red-400 mx-auto" />
                          <p className="text-red-400 font-medium">No Attendance</p>
                          <p className="text-sm text-gray-400">Employee was absent on this day</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <PersonIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Employee Code</p>
                      <p className="text-white font-medium">{user["Employee Code"] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Department</p>
                      <p className="text-white font-medium">{user.Department || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-white font-medium text-sm">{user["Work email"] || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Mobile</p>
                      <p className="text-white font-medium">{user["Mobile number"] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Designation</p>
                      <p className="text-white font-medium">{user.Designation || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Attendance Summary with Updated Formatting */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <AccessTimeIcon className="w-5 h-5 mr-2 text-yellow-400" />
                  Recent Attendance (Last 5 Days)
                </h4>
                <div className="space-y-2">
                  {user.attendance?.slice(-5).reverse().map((att, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-600/30 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{formatDate(att.date)}</p>
                        <p className="text-xs text-gray-400">
                          {att.checkIn ? `${formatTime(att.checkIn)}` : 'No check-in'} - {att.checkOut ? `${formatTime(att.checkOut)}` : 'No check-out'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">
                          {calculateWorkHours(att.checkIn, att.checkOut)}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center py-4">No attendance records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <AttendanceModal
          user={user}
          date={selectedDate}
          attendance={attendanceForSelectedDate}
          onClose={() => setIsModalOpen(false)}
          onUserUpdate={onUserUpdate}
        />
      )}
      {isLeaveBalanceModalOpen && (
        <LeaveBalanceModal
          user={user}
          onClose={closeLeaveBalanceModal}
          onUserUpdate={onUserUpdate}
        />
      )}
    </>
  );
}

export default UserDetailsSidePanel;
