const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  date: { type: Date, required: true },
  dayNumber: Number,
  sessionTime: String,
  meetingLink: String,
  assignedTutor: String,
  assignedCounselor: String,
  quizLink: String,
  counselingLink: String,
});

module.exports = mongoose.model('Session', sessionSchema);
