import React, { useEffect, useState } from 'react';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttendCalen from '../components/AttendCalen';
import { checkIn, checkOut, getUser } from '../components/Api';
import CalendarMonthView from '../components/CalendarMonthView';

import { useGeolocated } from 'react-geolocated';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: true },
    userDecisionTimeout: 5000,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const extractTodayAttendance = (attendanceList) => {
    const today = new Date();
    const todayUTCString = today.toISOString().split('T')[0];
    
    return attendanceList.find((entry) => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      const entryDateUTCString = entryDate.toISOString().split('T')[0];
      return entryDateUTCString === todayUTCString;
    });
  };

  const formatTime = (isoTime) => {
    if (!isoTime) return 'N/A';
    return new Date(isoTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateWorkDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return null;
    const diffMs = new Date(checkOutTime) - new Date(checkInTime);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHours}h ${diffMinutes}m`;
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      console.error('Failed to fetch address:', error);
      return 'Address not found';
    }
  };

  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
      const todayAttendance = extractTodayAttendance(userData.attendance || []);
      if (todayAttendance?.checkIn) {
        setCheckInTime(todayAttendance.checkIn);
        setHasCheckedIn(true);
        setCheckInAddress(todayAttendance.checkInLocation?.address || 'Address not available');
      }
      if (todayAttendance?.checkOut) {
        setCheckOutTime(todayAttendance.checkOut);
        setHasCheckedOut(true);
        setCheckOutAddress(todayAttendance.checkOutLocation?.address || 'Address not available');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!isGeolocationAvailable || !isGeolocationEnabled || !coords) {
      toast.error('Please enable location services to check in.');
      return;
    }
    setIsProcessing(true);
    try {
      const { latitude, longitude } = coords;
      const address = await fetchAddress(latitude, longitude);
      const response = await checkIn({ lat: latitude, lng: longitude, address });
      setCheckInTime(response.attendance.checkIn);
      setHasCheckedIn(true);
      setCheckInAddress(address);
      toast.success(response.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!isGeolocationAvailable || !isGeolocationEnabled || !coords) {
      toast.error('Please enable location services to check out.');
      return;
    }
    setIsProcessing(true);
    try {
      const { latitude, longitude } = coords;
      const address = await fetchAddress(latitude, longitude);
      const response = await checkOut({ lat: latitude, lng: longitude, address });
      setCheckOutTime(new Date().toISOString());
      setHasCheckedOut(true);
      setCheckOutAddress(address);
      toast.success(response.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const workDuration = calculateWorkDuration(checkInTime, checkOutTime);

  const ActionButton = () => {
    if (!hasCheckedIn) {
      return (
        <button onClick={handleCheckIn} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center disabled:bg-blue-400">
          {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><LoginOutlinedIcon className="mr-2" /> Check In</>}
        </button>
      );
    }
    if (!hasCheckedOut) {
      return (
        <button onClick={handleCheckOut} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center disabled:bg-blue-400">
          {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><LogoutOutlinedIcon className="mr-2" /> Check Out</>}
        </button>
      );
    }
    return (
      <div className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center">
        <EventAvailableIcon className="mr-2" /> Day Complete
      </div>
    );
  };

  const InfoCard = ({ icon, title, time, address }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">{icon}</div>
        <div>
          <p className="text-slate-600 text-sm">{title}</p>
          <p className="text-slate-800 font-bold text-lg">{time}</p>
          {address && 
            <div className="flex items-start justify-start text-xs text-slate-500 mt-1">
              <LocationOnIcon style={{ fontSize: '0.875rem' }} className="mr-1 mt-0.5"/>
              <span className="truncate max-w-[150px]">{address}</span>
            </div>
          }
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer theme="light" position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Welcome, {user?.["First name"] || 'User'}!</h1>
            <p className="text-slate-600 mt-1">
              {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-slate-600">Current Time</p>
                  <p className="text-4xl font-bold text-slate-800">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
                <div className="w-full md:w-48">
                  <ActionButton />
                </div>
              </div>

              {(hasCheckedIn || hasCheckedOut) && (
                <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
                  {hasCheckedIn && <InfoCard icon={<LoginOutlinedIcon />} title="Checked  In" time={formatTime(checkInTime)} address={checkInAddress} />}
                  {hasCheckedOut && <InfoCard icon={<LogoutOutlinedIcon />} title="Checked Out" time={formatTime(checkOutTime)} address={checkOutAddress} />}
                  {workDuration && <InfoCard icon={<SpeedIcon />} title="Work Duration" time={workDuration} />}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Attendance This Month</span>
                    <span className="font-bold text-slate-800">{user?.attendance?.length || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Paid Leave Balance</span>
                    <span className="font-bold text-slate-800">{user?.paidLeaveBalance || 0}</span>
                  </div>
                </div>
              </div>
            </aside>
          </main>

         
<section className="mt-8">
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h2 className="text-xl font-bold text-slate-800 mb-4">Attendance Calendar</h2>
    <CalendarMonthView
      attendance={user?.attendance || []}
      onDaySelect={(date, record) => {
        // Optional: show a toast or open a modal with full day details
        // Example:
        // toast.info(record ? `In: ${record.checkIn}\nOut: ${record.checkOut || 'N/A'}` : 'No attendance record');
      }}
    />
  </div>
</section>

        </div>
      </div>
    </>
  );
}

export default HomePage;