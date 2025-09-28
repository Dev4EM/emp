const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['paid', 'unpaid'], required: true },
  duration: { type: Number, enum: [1, 0.5], default: 1 },
  half: { type: String, enum: ['first', 'second', null], default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason: { type: String },
  appliedOn: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedOn: { type: Date },
}, { timestamps: true });

// Ensure one leave record per employee per day
LeaveSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Leave', LeaveSchema);
