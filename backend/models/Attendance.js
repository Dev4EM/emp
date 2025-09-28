const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  date: { type: Date, required: true }, // Format: yyyy-mm-dd only

  checkIn: { type: Date },
  checkInLocation: {
    lat: Number,
    lng: Number,
    address: String,
  },

  checkOut: { type: Date },
  checkOutLocation: {
    lat: Number,
    lng: Number,
    address: String,
  },

  remarks: { type: String },

  // Updated check-in info
  updatedCheckIn: { type: Date },
  updatedCheckInAt: { type: Date },
  updatedCheckInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // user who updated check-in

  // Updated check-out info
  updatedCheckOut: { type: Date },
  updatedCheckOutAt: { type: Date },
  updatedCheckOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // user who updated check-out


  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },

}, { timestamps: true });

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
