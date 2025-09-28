// shifts.js
export const shifts = {
  general: {
    label: 'General',
    start: '10:00',
    end: '19:00',
  },
  firstAfternoon: {
    label: '1st Afternoon Shift',
    start: '13:15',
    end: '22:15',
  },
  thirdAfternoon: {
    label: '3rd Afternoon Shift',
    start: '14:00',
    end: '22:30',
  },
};

// Helper to parse "HH:mm" strings into Date objects on a specific date
export function parseShiftTime(date, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const shiftDate = new Date(date);
  shiftDate.setHours(hours, minutes, 0, 0);
  return shiftDate;
}

// Attendance status based on rules:
// lateMinutesThreshold = 6 minutes late
// halfDayHoursThreshold = 4 hours (can tweak 4.0 to 4.5 as needed)
export function getAttendanceStatus(shift, checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Absent';

  const shiftStart = parseShiftTime(checkIn, shift.start);
  const shiftEnd = parseShiftTime(checkIn, shift.end);

  // Calculate lateness in minutes
  const lateMinutes = (checkIn - shiftStart) / (1000 * 60);

  // Total worked minutes
  const workedMinutes = (checkOut - checkIn) / (1000 * 60);

  // Total shift minutes
  const shiftDurationMinutes = (shiftEnd - shiftStart) / (1000 * 60);

  // Missing time = shift duration - worked minutes
  const missingMinutes = shiftDurationMinutes - workedMinutes;

  // Define thresholds
  const lateThreshold = 6;
  const halfDayThreshold = 4 * 60; // 4 hours in minutes
  const halfDayMax = 4.5 * 60; // 4.5 hours max for FH or SH

  // Rules:
  if (lateMinutes > lateThreshold) {
    return 'LM | P';  // Late mark
  }

  if (missingMinutes >= halfDayThreshold && missingMinutes <= halfDayMax) {
    // Figure out which half is missed: first half or second half
    const workedFromStart = (checkIn - shiftStart) / (1000 * 60);  // negative if before shift start
    const workedToEnd = (shiftEnd - checkOut) / (1000 * 60);

    // If user absent first half (not present in 1st 4-4.5 hours)
    if (workedFromStart > halfDayThreshold) {
      return 'FH | P';  // First Half Absent
    }
    // If user absent second half
    if (workedToEnd > halfDayThreshold) {
      return 'P | SH';  // Second Half Absent
    }
  }

  return 'Present'; // default
}
