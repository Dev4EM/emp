const mongoose = require('mongoose');

const UserWeekOffOverrideSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  isWeekOff: { type: Boolean, default: true },
  reason: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

UserWeekOffOverrideSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UserWeekOffOverride', UserWeekOffOverrideSchema);
