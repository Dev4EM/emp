import { useEffect, useState } from 'react';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SpeedIcon from '@mui/icons-material/Speed';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useGeolocated } from 'react-geolocated';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CalendarMonthView from '../components/CalendarMonthView';
import {
  checkIn,
  checkOut,
  getUser,
  getTodayAttendance,
  getMonthlyAttendance,
  getDepartmentWeekOff,
  getUserLeaveBalance,
} from '../components/Api';

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkOutAddress, setCheckOutAddress] = useState('');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateRecord, setSelectedDateRecord] = useState(null);
  const [departmentWeekOffDays, setDepartmentWeekOffDays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(0);

  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: true },
    userDecisionTimeout: 5000,
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user, leave balance, and today's attendance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        setUser(userData);

        // Leave balance
        const balanceResponse = await getUserLeaveBalance(userData._id);
        setLeaveBalance(
          balanceResponse?.remainingPaidLeave ?? 0
        );

        // Department week off
        if (userData?.Department) {
          try {
            const deptWeekOff = await getDepartmentWeekOff(userData.Department);
            setDepartmentWeekOffDays(deptWeekOff.weekOffDays || []);
          } catch (err) {
            console.error('Failed to fetch department week off', err);
            toast.error('Department week off not found. Please contact IT.');
          }
        }

        // Today's attendance
        const todayAttendance = await getTodayAttendance();
        if (Array.isArray(todayAttendance) && todayAttendance.length > 0) {
          const record = todayAttendance[0];

          if (record.checkIn) {
            setCheckInTime(record.checkIn);
            setHasCheckedIn(true);
            setCheckInAddress(record.checkInLocation?.address || 'N/A');
          }

          if (record.checkOut) {
            setCheckOutTime(record.checkOut);
            setHasCheckedOut(true);
            setCheckOutAddress(record.checkOutLocation?.address || 'N/A');
          }
        }

        // Monthly attendance
        await fetchMonthlyAttendance();
      } catch (err) {
        console.error('Fetch Error:', err);
        toast.error(err.response?.data?.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    return { start, end };
  };
  const getCalendarDateRange = (year, month) => {
  // month is 0-based: Jan = 0
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Day of week for first day of month (0 = Sunday)
  const startDayOfWeek = firstOfMonth.getDay();
  // Subtract 6 days if you want at least 6 previous month dates
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - 6);

  // Day of week for last day of month
  const endDayOfWeek = lastOfMonth.getDay();
  const endDate = new Date(lastOfMonth);
  // Add 6 days for next month
  endDate.setDate(lastOfMonth.getDate() + 6);

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};


const fetchMonthlyAttendance = async (year, month) => {
  try {
    const now = new Date();
    const activeYear = year ?? now.getFullYear();
    const activeMonth = month ?? now.getMonth();
    const { start, end } = getCalendarDateRange(activeYear, activeMonth);

    const attendance = await getMonthlyAttendance(start, end);
    setAttendanceList(attendance || []);
  } catch (err) {
    console.error('Failed to fetch monthly attendance', err);
    toast.error('Failed to load attendance.');
  }
};



const handleMonthChange = async (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  await fetchMonthlyAttendance(year, month);
};


  const formatTime = (isoTime) => {
    if (!isoTime) return 'N/A';
    return new Date(isoTime).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateWorkDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return null;
    const diffMs = new Date(checkOutTime) - new Date(checkInTime);
    if (diffMs < 0) return '0h 0m';
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };
  const fetchTodayAttendance = async () => {
  try {
    const todayAttendance = await getTodayAttendance();
    if (Array.isArray(todayAttendance) && todayAttendance.length > 0) {
      const record = todayAttendance[0];

      if (record.checkIn) {
        setCheckInTime(record.checkIn);
        setHasCheckedIn(true);
        setCheckInAddress(record.checkInLocation?.address || 'N/A');
      }

      if (record.checkOut) {
        setCheckOutTime(record.checkOut);
        setHasCheckedOut(true);
        setCheckOutAddress(record.checkOutLocation?.address || 'N/A');
      }
    }
  } catch (err) {
    console.error('Failed to fetch today’s attendance', err);
    toast.error('Failed to fetch today’s attendance.');
  }
};


  const handleCheckIn = async () => {
  if (!isGeolocationAvailable || !isGeolocationEnabled || !coords) {
    toast.error('Location is required to check in.');
    return;
  }
  if (hasCheckedIn) {
    toast.info('You have already checked in.');
    return;
  }
  setIsProcessing(true);
  try {
    const { latitude, longitude } = coords;
    const address = 'Address';
    const response = await checkIn({ lat: latitude, lng: longitude, address });
    toast.success(response.message || 'Checked in successfully!');
    await fetchMonthlyAttendance();
    await fetchTodayAttendance(); // ✅ fixed
  } catch (err) {
    console.error('Check-in error:', err);
    toast.error(err?.response?.data?.message || 'Check-in failed.');
  } finally {
    setIsProcessing(false);
  }
};


  const handleCheckOut = async () => {
    if (!isGeolocationAvailable || !isGeolocationEnabled || !coords) {
      toast.error('Location is required to check out.');
      return;
    }
    setIsProcessing(true);
    try {
      const { latitude, longitude } = coords;
      const address = 'Address Fetched!';
      const response = await checkOut({ lat: latitude, lng: longitude, address });
      const nowIso = new Date().toISOString();
      setCheckOutTime(nowIso);
      setCheckOutAddress(address);
      setHasCheckedOut(true);
      toast.success(response.message || 'Checked out successfully!');
      await fetchMonthlyAttendance();
    } catch (err) {
      console.error('Check-out error:', err);
      toast.error(err?.response?.data?.message || 'Check-out failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ActionButton = () => {
    if (!hasCheckedIn) {
      return (
        <button
          onClick={handleCheckIn}
          disabled={isProcessing}
          className={`w-full py-3 px-6 rounded text-white ${
            isProcessing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Checking in...' : <><LoginOutlinedIcon className="mr-2" /> Check In</>}
        </button>
      );
    } else if (!hasCheckedOut) {
      return (
        <button
          onClick={handleCheckOut}
          disabled={isProcessing}
          className={`w-full py-3 px-6 rounded text-white ${
            isProcessing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Checking out...' : <><LogoutOutlinedIcon className="mr-2" /> Check Out</>}
        </button>
      );
    } else {
      return (
        <div className="w-full bg-green-500 text-white py-3 px-3 rounded flex justify-center items-center">
          <EventAvailableIcon className="mr-2" /> Day Completed
        </div>
      );
    }
  };

  if (loading) {
    return <div className="h-screen flex justify-center items-center">Loading...</div>;
  }

  const workDuration = calculateWorkDuration(checkInTime, checkOutTime);

  return (
    <>
      <ToastContainer />
     <div className="min-h-screen p-2 bg-gray-50">
        <h1 className="text-2xl bg-white p-3 mb-4">
          Welcome,{' '}
          <span className="font-bold">{user?.['First name'] || 'Employee'}</span> ! May your
          starshine guide you to a stellar day!
        </h1>
        <div className="bg-white p-5 rounded shadow-md mb-6">
          <div className="flex justify-between items-center mb-4 flex-col md:flex-row">
            <div>
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
            </div>
            <div className="w-48">
              <ActionButton />
            </div>
          </div>

          {hasCheckedIn && (
            <div className="max-w-full justify-between gap-5 flex flex-col md:flex-row">
              {/* Check-In */}
              <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg shadow-md p-6 flex flex-col md:flex-row items-start">
                <div className="p-3 h-12 w-12 rounded-full bg-blue-100">
                  <LoginOutlinedIcon style={{ fontSize: 28, color: '#2563EB' }} />
                </div>
                <div className="ml-4 flex-1 flex flex-col items-start">
                  <h4 className="text-lg font-semibold text-blue-700">Check In</h4>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatTime(checkInTime)}</p>
                  <p className="mt-1 text-gray-600 flex items-center text-start w-full max-w-[300px]">
                    {checkInAddress.slice(0, 60)}
                  </p>
                </div>
              </div>

              {/* Check-Out */}
              {hasCheckedOut && (
                <div className="bg-gradient-to-r from-green-50 via-white to-green-50 rounded-lg shadow-md p-6 flex flex-col md:flex-row flex-start">
                  <div className="p-3 pb-2 h-12 w-12 rounded-full bg-green-100">
                    <LogoutOutlinedIcon style={{ fontSize: 28, color: '#16A34A' }} />
                  </div>
                  <div className="ml-4 flex flex-col flex-1 items-start">
                    <h4 className="text-lg font-semibold text-green-700">Check Out</h4>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatTime(checkOutTime)}</p>
                    <p className="mt-1 text-gray-600 flex text-start items-start max-w-[300px]">
                      {checkOutAddress.slice(0, 60) || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              {hasCheckedOut && (
                <div className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50 rounded-lg shadow-md p-6 flex flex-col items-start">
                  <div className="flex items-start">
                    <div className="p-3 pb-3 h-12 w-12 rounded-full bg-yellow-100 mr-4">
                      <SpeedIcon style={{ fontSize: 28, color: '#D97706' }} />
                    </div>
                    <div className="flex flex-col items-start">
                      <h4 className="text-lg font-semibold text-yellow-700">Total Hours</h4>
                      <p className="mt-1 text-2xl font-bold text-gray-900 max-w-[300px]">
                        {hasCheckedOut ? workDuration : '—'}
                      </p>
                      <span className="text-gray-400 text-sm">Since your check‑in & check‑out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendance Summary */}
         <div className="flex flex-col md:flex-row justify-between">
       

        {/* Calendar */}
        <div className="bg-white p-4 max-w-[1000px] m-2 w-full rounded shadow-md">
          <CalendarMonthView
            attendance={attendanceList}
            weekOffs={departmentWeekOffDays}
            onDaySelect={(date, record) => {
              setSelectedDate(date);
              setSelectedDateRecord(record);
            }}
            onMonthChange={handleMonthChange}
          />
        </div>
     
       <div className="bg-white p-4 max-w-[380px] flex flex-col md:flex-row  m-2 w-full rounded shadow-md">
          <div className="text-center border p-3 rounded-lg flex-1 m-1 h-[130px]">
            <span className="text-5xl font-bold">{attendanceList.length}</span>
            <div className="text-xs mt-1">Total Attendance This Month</div>
          </div>
          <div className="text-center border p-3 rounded-lg flex-1 m-1 h-[130px]">
            <span className="text-5xl font-bold">{leaveBalance}</span>
            <div className="text-xs mt-1">Total Leave Balance</div>
          </div>
        </div>
         </div>
      </div>
    </>
  );
}

export default HomePage;
