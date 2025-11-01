import React, { useMemo, useState, useEffect } from 'react';
import { getUser } from './Api';
import { toast, ToastContainer } from 'react-toastify';
// UTC date helpers
const startOfMonthUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const addMonthsUTC = (d, n) => {
  const newDate = new Date(d.getTime());
  newDate.setUTCMonth(d.getUTCMonth() + n);
  return newDate;
};
const isoKey = (d) => d.toISOString().slice(0, 10);

const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const getWeekOffDatesFromNames = (year, month, weekOffDayNames) => {
  const dayNameToNumber = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDays = weekOffDayNames
    .map(name => dayNameToNumber[name])
    .filter(d => d !== undefined);

  const result = [];
  const date = new Date(Date.UTC(year, month, 1));

  while (date.getUTCMonth() === month) {
    if (targetDays.includes(date.getUTCDay())) {
      result.push(date.toISOString().slice(0, 10));
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return result;
};

const getWeekEnds = (year, month) => {
  const result = [];
  const date = new Date(Date.UTC(year, month, 1));
  while (date.getUTCMonth() === month) {
    if (date.getUTCDay() === 0) { // Sunday
      result.push(date.toISOString().slice(0, 10));
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return result;
};

export default function CalendarMonthCompact({
  attendance = [],
  onDaySelect,
  weekOffs: propWeekOffs,
  onMonthChange,
}) {
  const [viewDate, setViewDate] = useState(startOfMonthUTC(new Date()));

  // Notify parent on initial mount
  useEffect(() => {
    if (onMonthChange) onMonthChange(viewDate);
  }, []);

  const changeMonth = (newDate) => {
    setViewDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
  };

  const weekOffs = useMemo(() => {
    if (propWeekOffs && propWeekOffs.length > 0) {
      return getWeekOffDatesFromNames(
        viewDate.getUTCFullYear(),
        viewDate.getUTCMonth(),
        propWeekOffs
      );
    }
    return getWeekEnds(viewDate.getUTCFullYear(), viewDate.getUTCMonth());
  }, [viewDate, propWeekOffs]);

  const weekOffMap = useMemo(() => {
    const m = new Map();
    for (const d of weekOffs) m.set(d.slice(0, 10), true);
    return m;
  }, [weekOffs]);

  const monthStart = useMemo(() => startOfMonthUTC(viewDate), [viewDate]);
  const monthEnd = useMemo(() => new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth() + 1, 0)), [viewDate]);

  const attendanceMap = useMemo(() => {
    const m = new Map();
    for (const r of attendance) {
      if (!r?.date) continue;
      m.set(r.date.slice(0, 10), r);
    }
    return m;
  }, [attendance]);

  const days = useMemo(() => {
    const out = [];
    const s = new Date(monthStart.getTime());
    s.setUTCDate(s.getUTCDate() - s.getUTCDay());
    const e = new Date(monthEnd.getTime());
    e.setUTCDate(e.getUTCDate() + (6 - e.getUTCDay()));
    for (let d = new Date(s.getTime()); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
      out.push(new Date(d.getTime()));
    }
    return out;
  }, [monthStart, monthEnd]);

  const title = monthStart.toLocaleDateString('en-GB',{ month:'long', year:'numeric', timeZone: 'UTC' });

  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  const getStatus = (d) => {
    const k = isoKey(d);
    const rec = attendanceMap.get(k);

    if (weekOffMap.get(k)) return 'weekoff';
    if (d > today) return 'future';
    if (!rec) return 'leave';
    if (rec.checkIn && rec.checkOut) return 'out';
    if (rec.checkIn) return 'in';
    return 'leave';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex md:flex-row flex-col items-start p-3 md:items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button className='border-2 px-1' onClick={() => changeMonth(addMonthsUTC(viewDate, -1))}>‹</button>
          <button onClick={() => changeMonth(startOfMonthUTC(new Date()))}>Today</button>
          <button className='border-2 px-1' onClick={() => changeMonth(addMonthsUTC(viewDate, 1))}>›</button>
        </div>
        <h3 className="text-sm mt-3 font-semibold text-slate-800">{title}</h3>

        {/* Minimal legend */}
        <div className="grid grid-cols-2 absolute md:relative right-0 mr-10 items-center gap-2 text-[10px] text-slate-900">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400"/><span>Checked In</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"/><span>Checked Out</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400"/><span>Week Off</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400"/><span>Leave</span>
          </span>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 p-1.5 items-center text-center text-[10px] text-slate-500 mb-1">
        {weekdays.map(w => <div key={w} className="py-1 px-6 text-[16px] max-w-[30px]">{w}</div>)}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {days.map((d, i) => {
          const inMonth = d.getUTCMonth() === monthStart.getUTCMonth();
          const k = isoKey(d);
          const rec = attendanceMap.get(k);
          const status = getStatus(d);
          const isToday = isoKey(d) === isoKey(today);

          const baseBg = inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400';
          const bgColor =
            status === 'leave' ? 'bg-[#A52A2A] text-white' :
            status === 'weekoff' ? 'bg-gray-100 text-gray-700' :
            status === 'out' ? 'bg-green-800 text-white' :
            status === 'in' ? 'bg-yellow-100 text-black' :
            status === 'future' ? baseBg :
            baseBg;

          return (
            
            <button
  key={i}
  onClick={() => {
    const msg = rec
      ? `In: ${rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}
         | Out: ${rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}`
      : 'No attendance';
    toast(msg);
    onDaySelect?.(d, rec || null); // optional if parent still needs it
  }}
  className={`${bgColor} h-10 w-10 md:h-14 md:w-14 m-2 flex items-center justify-center rounded-full hover:bg-pink-200 transition-colors`}
>
  <span className={`text-[10px] md:text-[15px] font-semibold ${
      inMonth
        ? status === 'out' ? 'text-white'
        : status === 'in' ? 'text-black'
        : status === 'leave' ? 'text-white'
        : 'text-slate-300'
        : 'text-slate-400'
  }`}>
    {d.getUTCDate()}
  </span>
  {isToday && <div className="mt-7 ml-[-10px] text-[9px] text-indigo-600 font-semibold">Today</div>}
</button>
          );
        })}
      </div>
    </div>
  );
}
