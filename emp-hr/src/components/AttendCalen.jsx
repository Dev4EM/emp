import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { getUser } from './Api';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function AttendCalen({ attendanceData }) {
  const [attendanceMap, setAttendanceMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  useEffect(() => {
    const processData = (data) => {
      const map = new Map();
      if (Array.isArray(data)) {
        data.forEach((record) => {
          const day = normalizeDate(record.date);
          map.set(day.getTime(), {
            checkIn: record.checkIn,
            checkOut: record.checkOut,
          });
        });
      }
      setAttendanceMap(map);
      setLoading(false);
    };

    if (attendanceData) {
      processData(attendanceData);
    } else {
      const loadUserData = async () => {
        setLoading(true);
        setError(null);
        try {
          const userData = await getUser();
          processData(userData.attendance);
        } catch (err) {
          setError('Failed to load attendance data.');
          console.error(err);
          setLoading(false);
        }
      };
      loadUserData();
    }
  }, [attendanceData]);

  const isPresent = (day) => {
    if (!attendanceMap) return false;
    const record = attendanceMap.get(normalizeDate(day).getTime());
    return !!(record?.checkIn && record?.checkOut);
  };

  const isPartial = (day) => {
    if (!attendanceMap) return false;
    const record = attendanceMap.get(normalizeDate(day).getTime());
    return !!(record?.checkIn && !record?.checkOut);
  };

  const isAbsent = (day) => {
    if (!attendanceMap) return false;
    const today = normalizeDate(new Date());
    const currentDay = normalizeDate(day);
    if (currentDay >= today) return false;
    return !attendanceMap.has(currentDay.getTime());
  };

  if (loading) return <div className="text-center p-4 text-slate-500">Loading attendance...</div>;
  if (error) return <div className="text-center text-red-600 p-4">{error}</div>;

  const modifiers = {
    present: isPresent,
    partial: isPartial,
    absent: isAbsent,
  };

  const modifierClassNames = {
    present: 'bg-blue-600 text-white rounded-full',
    partial: 'bg-blue-200 text-blue-800 rounded-full',
    absent: 'text-red-500',
    today: 'border-2 border-blue-500 rounded-full',
  };

  const classNames = {
    root: 'w-full',
    caption: 'flex items-center justify-between py-2 px-1',
    caption_label: 'text-base md:text-lg font-bold text-slate-800',
    nav: 'flex items-center',
    nav_button: 'h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors',
    table: 'w-full border-collapse',
    head_row: 'flex',
    head_cell: 'w-full text-xs md:text-sm font-semibold text-slate-500 p-1 md:p-2 text-center',
    row: 'flex w-full mt-1 md:mt-2',
    cell: 'w-full text-center',
    day: 'h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors',
    day_selected: 'bg-blue-600 text-white',
    day_today: 'font-bold',
    day_outside: 'text-slate-400 opacity-50',
    ...modifierClassNames,
  };

  const LegendItem = ({ colorClass, label }) => (
    <div className="flex items-center">
      <span className={`w-4 h-4 rounded-full mr-2 ${colorClass}`}></span>
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );

  return (
    <div className="w-full">
      <DayPicker
        mode="single"
        modifiers={modifiers}
        classNames={classNames}
        components={{
          IconLeft: () => <ChevronLeftIcon className="w-5 h-5" />,
          IconRight: () => <ChevronRightIcon className="w-5 h-5" />,
        }}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <LegendItem colorClass="bg-blue-600" label="Present" />
        <LegendItem colorClass="bg-blue-200" label="Partial" />
        <LegendItem colorClass="border border-red-500" label="Absent" />
      </div>
    </div>
  );
}