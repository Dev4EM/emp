import React, { useMemo, useState } from 'react';

// All functions now operate on UTC dates
const startOfMonthUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const addMonthsUTC = (d, n) => {
  const newDate = new Date(d.getTime());
  newDate.setUTCMonth(d.getUTCMonth() + n);
  return newDate;
};
const isoKey = (d) => d.toISOString().slice(0, 10);

const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function CalendarMonthCompact({ attendance = [], onDaySelect }) {
  const [viewDate, setViewDate] = useState(startOfMonthUTC(new Date()));
  
  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  const monthStart = useMemo(() => startOfMonthUTC(viewDate), [viewDate]);
  const monthEnd = useMemo(() => new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth() + 1, 0)), [viewDate]);

  const attendanceMap = useMemo(() => {
    const m = new Map();
    for (const r of attendance) {
      if (!r?.date) continue;
      const k = r.date.slice(0, 10); // Dates from backend are already YYYY-MM-DD UTC
      m.set(k, r);
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

  const getStatus = (d) => {
    const k = isoKey(d);
    const rec = attendanceMap.get(k);
    if (!rec) return 'absent';
    if (rec.checkIn && rec.checkOut) return 'out';
    if (rec.checkIn) return 'in';
    return 'absent';
  };

  return (
    <div className="w-full">
      {/* Header: tight */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setViewDate(addMonthsUTC(viewDate, -1))}
                  className="h-7 w-7 grid place-items-center rounded-md border border-slate-200 hover:bg-slate-50">‹</button>
          <button onClick={() => setViewDate(startOfMonthUTC(new Date()))}
                  className="h-7 px-2 rounded-md border border-slate-200 text-xs hover:bg-slate-50">Today</button>
          <button onClick={() => setViewDate(addMonthsUTC(viewDate, 1))}
                  className="h-7 w-7 grid place-items-center rounded-md border border-slate-200 hover:bg-slate-50">›</button>
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {/* Minimal legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"/><span>In</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"/><span>Out</span>
          </span>
        </div>
      </div>

      {/* Weekdays: tiny */}
      <div className="grid grid-cols-7 text-center text-[10px] text-slate-500 mb-1">
        {weekdays.map(w => <div key={w} className="py-1">{w}</div>)}
      </div>

      {/* Grid: compact fixed height rows */}
      <div className="grid grid-cols-7 gap-[2px]">
        {days.map((d, i) => {
          const inMonth = d.getUTCMonth() === monthStart.getUTCMonth();
          const k = isoKey(d);
          const rec = attendanceMap.get(k);
          const status = getStatus(d);
          const isToday = isoKey(d) === isoKey(today);
          const base = inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400';
          const ring = status === 'out'
            ? 'ring-1 ring-emerald-200'
            : status === 'in'
            ? 'ring-1 ring-blue-200'
            : 'ring-1 ring-slate-200';

          return (
            <button
              key={i}
              onClick={() => onDaySelect?.(d, rec || null)}
              className={`h-16 sm:h-20 md:h-16 lg:h-16 xl:h-16 rounded-[6px] ${base} ${ring} hover:bg-slate-50 transition-colors p-1.5`}
              title={
                rec
                  ? `In: ${rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}`
                  + (rec.checkOut ? ` | Out: ${new Date(rec.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '')
                  : 'No attendance'
              }
            >
              <div className="flex items-start justify-between">
                <span className={`text-[11px] font-semibold ${inMonth ? 'text-slate-800' : 'text-slate-400'}`}>
                  {d.getUTCDate()}
                </span>
                <div className="flex items-center gap-[3px]">
                  {rec?.checkIn && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  {rec?.checkOut && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              </div>
              {isToday && <div className="mt-3 text-[9px] text-indigo-600 font-semibold">Today</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}