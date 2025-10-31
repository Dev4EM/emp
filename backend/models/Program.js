const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    duration: { type: String, required: true }, // ✅ Add this line
    description: { type: String },
  },
  { timestamps: true } // optional but useful
);

module.exports = mongoose.model('Program', programSchema);
