// UserDetailsSidePanel.js
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WeekendIcon from '@mui/icons-material/Weekend';

import { format, isSameDay, isWeekend, differenceInHours, differenceInMinutes } from 'date-fns';
import { toast } from 'react-toastify';

import AttendanceModal from './AttendanceModal';
import LeaveBalanceModal from './LeaveBalanceModal';
import { shifts, getAttendanceStatus } from './shifts';
import { downloadEmployeeAttendanceCSV } from '../components/Api';

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const hours = differenceInHours(checkOutTime, checkInTime);
    const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;
    return `${hours}h ${minutes}m`;
  };
function UserDetailsSidePanel({ user, isOpen, onClose, onUserUpdate }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceForSelectedDate, setAttendanceForSelectedDate] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [isLeaveBalanceModalOpen, setIsLeaveBalanceModalOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd-MM-yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return format(date, 'HH:mm');
    } catch {
      return timeString;
    }
  };



  
  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin': return <AdminPanelSettingsIcon className="w-6 h-6 text-purple-400" />;
      case 'teamleader': return <SupervisorAccountIcon className="w-6 h-6 text-blue-400" />;
      default: return <PersonIcon className="w-6 h-6 text-emerald-400" />;
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

  const handleDownloadCSV = async () => {
    try {
      setDownloadLoading(true);
      toast.info(`Preparing ${user['First name']}'s attendance CSV...`);
      await downloadEmployeeAttendanceCSV(user._id);
      toast.success(`${user['First name']}'s attendance CSV downloaded successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(error.message || 'Failed to download CSV');
    } finally {
      setDownloadLoading(false);
    }
  };

  const getAttendanceDates = () => {
    if (!user?.attendance) return { attendedDates: [], weekendDates: [] };

    const attendedDates = user.attendance.map(att => new Date(att.date));
    const weekendDates = [];
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

  const handleDateClick = (date) => setSelectedDate(date);
  const openLeaveBalanceModal = () => setIsLeaveBalanceModalOpen(true);
  const closeLeaveBalanceModal = () => setIsLeaveBalanceModalOpen(false);

  return (
    <div>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-100 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-1/2 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gray-50">
            <h2 className="text-2xl font-bold">Employee Details</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadCSV}
                disabled={downloadLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
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
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <CloseIcon className="text-gray-500 hover:text-gray-900" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6 space-y-6">

              {/* User Card */}
              <div className="text-center bg-white rounded-xl p-6 shadow">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getUserTypeIcon(user.userType)}
                </div>
                <h3 className="text-xl font-bold">
                  {`${user.Prefix || ''} ${user.name}`.trim()}
                </h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUserTypeBadge(user.userType)}`}>
                  {user.userType || 'employee'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/20 rounded-xl p-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <p className="text-2xl font-bold text-emerald-400">{user.paidLeaveBalance || 0}</p>
                    <button onClick={openLeaveBalanceModal} className="text-emerald-400 hover:text-emerald-600">
                      ✏️
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

              {/* Calendar */}
              <div className="bg-white text-black rounded-xl p-6 shadow">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <CalendarTodayIcon className="w-5 h-5 mr-2 text-emerald-600" />
                  Attendance Calendar
                </h4>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateClick}
                  modifiers={{ attended: attendedDates, weekend: weekendDates }}
                  numberOfMonths={1}
                  showOutsideDays={false}
                />
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Legend color="bg-emerald-600" label="Attended" />
                  <Legend color="bg-yellow-500" label="Weekend" />
                  <Legend color="bg-blue-600" label="Selected" />
                  <Legend color="bg-blue-800" label="Today" />
                </div>
              </div>

              {/* Selected Date Details */}
              {selectedDate && (
                <SelectedDateCard
  selectedDate={selectedDate}
  attendance={attendanceForSelectedDate}
  user={user}
  leaves={user.leaves}
/>
              )}

              {/* Basic Info */}
              <div className="bg-white rounded-xl p-4 shadow">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <PersonIcon className="w-5 h-5 mr-2 text-emerald-600" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <InfoRow label="Employee Code" value={user.employeeCode} />
                  <InfoRow label="Department" value={user.Department} />
                  <InfoRow label="Email" value={user.workEmail} />
                  <InfoRow label="Mobile" value={user.userContact} />
                  <InfoRow label="Designation" value={user.userDesignation} />
                </div>
              </div>

              {/* Recent Attendance */}
              <div className="bg-white rounded-xl p-4 shadow">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <AccessTimeIcon className="w-5 h-5 mr-2 text-yellow-600" />
                  Recent Attendance (Last 5 Days)
                </h4>
                <div className="space-y-2">
                  {(user.attendance?.slice(-5).reverse() || []).map((att, i) => (
                    <div key={i} className="flex justify-between bg-gray-100 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{formatDate(att.date)}</p>
                        <p className="text-xs text-gray-500">
                          {att.checkIn ? formatTime(att.checkIn) : 'No check-in'} - {att.checkOut ? formatTime(att.checkOut) : 'No check-out'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">
                        {calculateWorkHours(att.checkIn, att.checkOut)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {isLeaveBalanceModalOpen && (
                <LeaveBalanceModal user={user} onClose={closeLeaveBalanceModal} onUserUpdate={onUserUpdate} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Legend = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3 h-3 rounded ${color}`}></div>
    <span className="text-gray-600">{label}</span>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-gray-900 font-medium">{value || 'N/A'}</p>
  </div>
);

const SelectedDateCard = ({ selectedDate, attendance, user, leaves = [] }) => {
  const shift = shifts.general;

  // Check if there's a leave on the selected date
  const leaveForSelectedDate = leaves.find(l =>
    isSameDay(new Date(l.date), selectedDate)
  );

  const showWeekendNotice = isWeekend(selectedDate);
  const showAbsentNotice = !attendance && !leaveForSelectedDate && !showWeekendNotice;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <EventAvailableIcon className="w-5 h-5 mr-2 text-blue-600" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          {showWeekendNotice && <WeekendIcon className="w-4 h-4 ml-2 text-yellow-500" />}
        </div>
      </h4>

      {attendance ? (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="grid grid-cols-3 gap-4">
              <CheckDetail icon={<CheckCircleIcon />} label="Check In" value={attendance.checkIn} />
              <CheckDetail icon={<EventBusyIcon />} label="Check Out" value={attendance.checkOut} fallback="Not checked out" />
              <div>
                <p className="text-sm font-semibold">Shift: {user.userShift}</p>
                <p className="text-sm text-gray-700">
                  Status: {getAttendanceStatus(shift, new Date(attendance.checkIn), new Date(attendance.checkOut))}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <AccessTimeIcon className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Hours Worked</span>
              </div>
              <p className="text-lg font-semibold text-purple-600">
                {calculateWorkHours(attendance.checkIn, attendance.checkOut)}
              </p>
            </div>
          </div>
        </div>
      ) : leaveForSelectedDate ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow">
          <div className="flex items-center space-x-3 mb-3">
            <EventBusyIcon className="text-yellow-500" />
            <h5 className="text-yellow-700 font-bold">Leave Taken</h5>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div><span className="font-medium">Type:</span> {leaveForSelectedDate.type || 'N/A'}</div>
            <div><span className="font-medium">Duration:</span> {leaveForSelectedDate.duration === 1 ? 'Full Day' : 'Half Day'}</div>
            <div><span className="font-medium">Status:</span> {leaveForSelectedDate.status}</div>
            <div><span className="font-medium">Reason:</span> {leaveForSelectedDate.reason || 'N/A'}</div>
          </div>
        </div>
      ) : showWeekendNotice ? (
        <div className="text-center py-6">
          <WeekendIcon className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="text-yellow-600 font-medium">Weekend Day</p>
          <p className="text-sm text-gray-500">No attendance expected</p>
        </div>
      ) : showAbsentNotice ? (
        <div className="text-center py-6">
          <EventBusyIcon className="w-12 h-12 text-red-600 mx-auto" />
          <p className="text-red-600 font-medium">No Attendance</p>
          <p className="text-sm text-gray-500">Employee was absent on this day</p>
        </div>
      ) : null}
    </div>
  );
};


const CheckDetail = ({ icon, label, value, fallback = 'N/A' }) => (
  <div>
    <div className="flex items-center space-x-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <p className="text-lg font-semibold text-emerald-600">{value ? format(new Date(value), 'HH:mm') : fallback}</p>
  </div>
);

export default UserDetailsSidePanel;
