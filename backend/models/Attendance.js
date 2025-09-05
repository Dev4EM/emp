const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    default: null
  },
  checkInLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  checkOutLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day'],
    default: 'Absent'
  },
  remarks: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// Compound index for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ employeeId: 1 });

// Calculate total hours and status before saving
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const hours = (new Date(this.checkOut) - new Date(this.checkIn)) / (1000 * 60 * 60);
    this.totalHours = parseFloat(hours.toFixed(2));
    this.status = hours >= 8.45 ? 'Present' : hours >= 4 ? 'Half Day' : 'Absent';
  } else if (this.checkIn) {
    this.status = 'Present'; // Will be updated when checkout happens
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
