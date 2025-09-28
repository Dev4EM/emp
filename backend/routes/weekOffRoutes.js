const express = require('express');
const router = express.Router();
const DepartmentWeekOff = require('../models/DepartmentWeekOff');
const UserWeekOffOverride = require('../models/UserWeekOffOverride');

// Dummy auth middleware (replace with your real auth)
const authMiddleware = (req, res, next) => {
  req.user = { _id: '60d0fe4f5311236168a109ca' }; // example user id
  next();
};

router.use(authMiddleware);

// Get week off for a department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const record = await DepartmentWeekOff.findOne({ department });
    if (!record) return res.status(404).json({ message: 'Department not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create/update department week off
router.post('/department', async (req, res) => {
  try {
    const { department, weekOffDays } = req.body;
    if (!department || !weekOffDays) return res.status(400).json({ message: 'department and weekOffDays required' });

    const record = await DepartmentWeekOff.findOneAndUpdate(
      { department },
      { weekOffDays, updatedAt: new Date(), createdBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user week off overrides in a date range
router.get('/user-overrides', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    if (!userId || !startDate || !endDate) return res.status(400).json({ message: 'userId, startDate and endDate required' });

    const overrides = await UserWeekOffOverride.find({
      userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });
    res.json(overrides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create/update user week off override
router.post('/user-override', async (req, res) => {
  try {
    const { userId, date, isWeekOff, reason } = req.body;
    if (!userId || !date) return res.status(400).json({ message: 'userId and date required' });

    const override = await UserWeekOffOverride.findOneAndUpdate(
      { userId, date: new Date(date) },
      { isWeekOff, reason, approvedBy: req.user._id, createdAt: new Date() },
      { new: true, upsert: true }
    );
    res.json(override);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user week off override
router.delete('/user-override', async (req, res) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) return res.status(400).json({ message: 'userId and date required' });

    await UserWeekOffOverride.findOneAndDelete({ userId, date: new Date(date) });
    res.json({ message: 'Override deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
