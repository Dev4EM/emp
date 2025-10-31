const express = require("express");
const Program = require("../models/Program");
const auth = require("../middleware/auth");

const router = express.Router();

// ✅ Create a new Program
router.post("/", auth, async (req, res) => {
  try {
    const { name, duration, description } = req.body;

    // Prevent duplicate program names
    const existing = await Program.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Program already exists" });
    }

    const newProgram = new Program({ name, duration, description });
    await newProgram.save();
    res.status(201).json(newProgram);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all programs
router.get("/", auth, async (req, res) => {
  try {
    const programs = await Program.find().sort({ createdAt: -1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ✅ Get a single program by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get a single program by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update a program
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, duration, description } = req.body;
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // Prevent duplicate names when updating
    if (name && name !== program.name) {
      const existing = await Program.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: "Another program with this name already exists" });
      }
      program.name = name;
    }

    if (duration) program.duration = duration;
    if (description) program.description = description;

    await program.save();
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete a program
router.delete("/:id", auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    await program.deleteOne();
    res.json({ message: "Program deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
