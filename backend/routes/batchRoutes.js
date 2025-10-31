const express = require('express');
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');

const router = express.Router();

// ✅ Create Batch
router.post('/', auth, async (req, res) => {
  try {
    const { batchNumber, program, startDate, endDate } = req.body;
    const newBatch = new Batch({ batchNumber, program, startDate, endDate });
    await newBatch.save();
    res.status(201).json(newBatch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get All Batches
router.get('/', auth, async (req, res) => {
  try {
    const batches = await Batch.find().populate('program').sort({ startDate: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Single Batch
router.get('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('program');
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete Batch
router.delete('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Export router (CommonJS syntax)
module.exports = router;
