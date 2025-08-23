import React, { useEffect, useState } from 'react';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AttendCalen from '../components/AttendCalen';
import { checkIn, checkOut, getUser } from '../components/Api';
import { useGeolocated } from 'react-geolocated';
import { toast, ToastContainer } from 'react-toastify';

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
  
  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    userDecisionTimeout: 5000,
  });

  const extractTodayAttendance = (attendanceList) => {
    const today = new Date();
    return attendanceList.find((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    });
  };

  const formatTime = (isoTime) => {
    return new Date(isoTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (isoTime) => {
    return new Date(isoTime).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateWorkDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return null;
    
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffMs = checkOut - checkIn;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
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
      const location = { lat: latitude, lng: longitude, address };

      const response = await checkIn(location);
      const checkInISO = response.attendance.checkIn;
      setCheckInTime(checkInISO);
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
      const location = { lat: latitude, lng: longitude, address };

      const response = await checkOut(location);
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
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const workDuration = calculateWorkDuration(checkInTime, checkOutTime);

  return (
    <>
      <ToastContainer theme="colored" />
      <div className="min-h-screen bg-gray-900">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              
              {/* Welcome Section */}
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <PersonIcon className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    Welcome, {user?.["First name"] || 'User'}!
                  </h1>
                  <p className="text-blue-200 text-sm lg:text-base">
                    May your orbit be steady and your stars aligned.
                  </p>
                  <p className="text-blue-300 text-xs lg:text-sm mt-1">
                    {user?.Designation || 'Employee'} • {user?.Department || 'Department'}
                  </p>
                </div>
              </div>

              {/* Date and Attendance Controls */}
              <div className="flex flex-col items-start lg:items-end space-y-3">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {new Date().toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-blue-200">
                    {new Date().toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>

                {/* Check In/Out Buttons */}
                <div className="flex flex-col space-y-2 w-full lg:w-auto">
                  {!hasCheckedIn ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[150px]"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <LoginOutlinedIcon />
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  ) : !hasCheckedOut ? (
                    <button
                      onClick={handleCheckOut}
                      disabled={isProcessing}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[150px]"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <LogoutOutlinedIcon />
                          <span>Check Out</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-600 px-6 py-3 rounded-lg font-semibold text-center min-w-[150px]">
                      Day Complete ✓
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Status Cards */}
        {(hasCheckedIn || hasCheckedOut) && (
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Check In Status */}
                {hasCheckedIn && (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-600 p-2 rounded-full">
                        <LoginOutlinedIcon className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">Checked In</h3>
                        <div className="flex items-center space-x-1 text-green-400 text-sm">
                          <AccessTimeIcon className="text-xs" />
                          <span>{formatTime(checkInTime)}</span>
                        </div>
                        <div className="flex items-start space-x-1 text-gray-400 text-xs mt-1">
                          <LocationOnIcon className="text-xs mt-0.5" />
                          <span className="truncate">{checkInAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Check Out Status */}
                {hasCheckedOut && (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-600 p-2 rounded-full">
                        <LogoutOutlinedIcon className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">Checked Out</h3>
                        <div className="flex items-center space-x-1 text-orange-400 text-sm">
                          <AccessTimeIcon className="text-xs" />
                          <span>{formatTime(checkOutTime)}</span>
                        </div>
                        <div className="flex items-start space-x-1 text-gray-400 text-xs mt-1">
                          <LocationOnIcon className="text-xs mt-0.5" />
                          <span className="truncate">{checkOutAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Duration */}
                {workDuration && (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 p-2 rounded-full">
                        <AccessTimeIcon className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Work Duration</h3>
                        <p className="text-blue-400 text-sm">{workDuration}</p>
                        <p className="text-gray-400 text-xs">Today's total</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Component */}
        <div className="container mx-auto px-4 py-6">
          <AttendCalen />
        </div>
      </div>
    </>
  );
}

export default HomePage;
