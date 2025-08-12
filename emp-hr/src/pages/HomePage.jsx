import React, { useEffect, useState } from 'react';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AttendCalen from '../components/AttendCalen';
import AuthWrapper from '../components/AuthWrapper';
import { checkIn, checkOut, getUser } from '../components/Api';

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkOutAddress, setCheckOutAddress] = useState('');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);

  // Get today's attendance
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

  // Format time "10:00 AM"
  const formatTime = (isoTime) => {
    return new Date(isoTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Reverse geocode lat,lng to address via OpenStreetMap Nominatim
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

  // Fetch user and check today's attendance
  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const todayAttendance = extractTodayAttendance(userData.attendance || []);
      if (todayAttendance?.checkIn) {
        setCheckInTime(formatTime(todayAttendance.checkIn));
        setHasCheckedIn(true);

        if (todayAttendance.checkInLocation?.address) {
          setCheckInAddress(todayAttendance.checkInLocation.address);
        } else {
          setCheckInAddress('Address not available');
        }
      }
      if (todayAttendance?.checkOut) {
        setHasCheckedOut(true);

        if (todayAttendance.checkOutLocation?.address) {
          setCheckOutAddress(todayAttendance.checkOutLocation.address);
        } else {
          setCheckOutAddress('Address not available');
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get browser geolocation (returns a Promise)
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  };

  // Handle CheckIn with real location and address
  const handleCheckIn = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const address = await fetchAddress(latitude, longitude);

      const location = {
        lat: latitude,
        lng: longitude,
        address,
      };

      const response = await checkIn(location);
      const checkInISO = response.attendance.checkIn;
      setCheckInTime(formatTime(checkInISO));
      setHasCheckedIn(true);
      setCheckInAddress(address);
    } catch (err) {
      console.error('Check-in failed:', err);
      alert('Failed to get location or check in. Please allow location access.');
    }
  };

  // Handle CheckOut with real location and address
  const handleCheckOut = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const address = await fetchAddress(latitude, longitude);

      const location = {
        lat: latitude,
        lng: longitude,
        address,
      };
      const response = await checkOut(location);
      setHasCheckedOut(true);
      setCheckOutAddress(address);
    } catch (err) {
      console.error('Check-out failed:', err);
      alert('Failed to get location or check out. Please allow location access.');
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <div className="text-white p-6">Loading user data...</div>;

  return (
    <AuthWrapper>
      <div className="fixed mt-10 left-0 w-full">
        <div className="flex pl-[130px] flex-row items-center justify-between w-full bg-[#051b56bf] p-3 text-white">
          <div className="flex flex-col items-start">
            <h1>Welcome, {user?.name || 'User'}!</h1>
            <p>May your orbit be steady and your stars aligned.</p>
          </div>
          <div className="flex flex-col items-start pr-4">
            <p>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>

            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                className="bg-[#e96101] w-full m-2 pl-5 pr-5 pt-2 pb-2 rounded-lg"
              >
                <LoginOutlinedIcon /> Check In
              </button>
            )}

            {hasCheckedIn && !hasCheckedOut && (
              <>
               
                <button
                  onClick={handleCheckOut}
                  className="bg-[#e96101] w-full m-2 pl-5 pr-5 pt-2 pb-2 rounded-lg"
                >
                  <LogoutOutlinedIcon /> Check Out
                </button>
                 <p className="text-sm text-green-300">
                  Checked in at: {checkInTime}
                  <br />
                
                </p>
              </>
            )}

            {hasCheckedOut && (
              <p className="text-sm text-yellow-300">
                Checked out successfully
                <br />
            
              </p>
            )}
          </div>
        </div>

        <AttendCalen />
      </div>
    </AuthWrapper>
  );
}

export default HomePage;
