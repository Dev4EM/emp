import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// Make sure your real fetchUser API function is imported or available here
// Example:
import { getUser } from './Api';

export default function AttendCalen({ attendanceData }) {
  const [attendanceMap, setAttendanceMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to normalize date to yyyy-mm-dd string (UTC midnight)
  function normalizeDate(date) {
  const d = new Date(date);
  // Get local year, month, day to avoid timezone shift
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


  useEffect(() => {
    if (attendanceData) {
      const map = {};
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach((record) => {
          const dayKey = normalizeDate(record.date);
          map[dayKey] = {
            checkIn: record.checkIn,
            checkOut: record.checkOut,
          };
        });
      }
      setAttendanceMap(map);
      setLoading(false);
    } else {
      async function loadUserData() {
        setLoading(true);
        setError(null);
        try {
          const userData = await getUser(); // <-- your real API call here
          // userData should include an attendance array

          const map = {};
          if (userData.attendance && Array.isArray(userData.attendance)) {
            userData.attendance.forEach((record) => {
              const dayKey = normalizeDate(record.date);
              map[dayKey] = {
                checkIn: record.checkIn,
                checkOut: record.checkOut,
              };
            });
          }
          setAttendanceMap(map);
        } catch (err) {
          setError('Failed to load attendance data.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }

      loadUserData();
    }
  }, [attendanceData]);

  function isComplete(day) {
    if (!attendanceMap) return false;
    const key = normalizeDate(day);
    const record = attendanceMap[key];
    return record && record.checkIn && record.checkOut;
  }

  function isIncomplete(day) {
    if (!attendanceMap) return false;
    const key = normalizeDate(day);
    const record = attendanceMap[key];
    return record && record.checkIn && !record.checkOut;
  }

  function isNone(day) {
    if (!attendanceMap) return false;
    const key = normalizeDate(day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day > today) return false; // no color for future dates
    return !attendanceMap[key];
  }

  if (loading) return <div className="text-center p-4">Loading attendance data...</div>;
  if (error) return <div className="text-center text-red-600 p-4">{error}</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Attendance Calendar</h2>
      <DayPicker
        className="max-w-md mx-auto p-2 pl-8 border-2 border-[#051b56bf] rounded-lg shadow-md bg-white"
        mode="single"
        modifiers={{
          complete: isComplete,
          incomplete: isIncomplete,
          none: isNone,
        }}
        modifiersStyles={{
          complete: { backgroundColor: '#86efac', borderRadius: '50%' }, // green
          incomplete: { backgroundColor: '#fde68a', borderRadius: '50%' }, // yellow
          none: { backgroundColor: '#fca5a5', borderRadius: '50%' }, // red
        }}
      />
      <div className="mt-4 text-center text-sm space-x-4">
        <span className="inline-block w-4 h-4 bg-green-300 rounded-full"></span> Present
        <span className="inline-block w-4 h-4 bg-yellow-300 rounded-full ml-4"></span> Check In
        <span className="inline-block w-4 h-4 bg-red-300 rounded-full ml-4"></span> Absent
      </div>
    </div>
  );
}
