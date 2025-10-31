const express = require('express');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

const router = express.Router();

// ✅ Create Session
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch,
      date,
      dayNumber,
      sessionTime,
      assignedTutor,
      assignedCounselor,
      meetingLink,
      quizLink,
      counselingLink
    } = req.body;

    const newSession = new Session({
      batch,
      date,
      dayNumber,
      sessionTime,
      assignedTutor,
      assignedCounselor,
      meetingLink,
      quizLink,
      counselingLink
    });

    await newSession.save();
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get All Sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find().populate('batch');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Sessions by Batch ID
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ batch: req.params.batchId }).populate('batch');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update Session
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      batch,
      date,
      dayNumber,
      sessionTime,
      assignedTutor,
      assignedCounselor,
      meetingLink,
      quizLink,
      counselingLink
    } = req.body;

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      {
        batch,
        date,
        dayNumber,
        sessionTime,
        assignedTutor,
        assignedCounselor,
        meetingLink,
        quizLink,
        counselingLink
      },
      { new: true, runValidators: true }
    );

    if (!updatedSession) return res.status(404).json({ message: "Session not found" });

    res.json(updatedSession);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete Session
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Export router
module.exports = router;
