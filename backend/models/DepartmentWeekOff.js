const mongoose = require('mongoose');

const DepartmentWeekOffSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  weekOffDays: [{ type: String, required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DepartmentWeekOff', DepartmentWeekOffSchema);
