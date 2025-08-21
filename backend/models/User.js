const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // --- NEW FIELDS FOR HIERARCHY ---
  userType: {
    type: String,
    enum: ['employee', 'teamleader'],
    default: 'employee'
  },
  reportingManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for team leaders, ObjectId for employees
  },
  // --- END NEW FIELDS ---
  
  paidLeaveBalance: {
    type: Number,
    default: 12,
  },
  attendance: [
    {
      date: { type: Date, required: true },
      checkIn: { type: Date, required: true },
      checkInLocation: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
      },
      checkOut: { type: Date },
      checkOutLocation: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
      },
    }
  ],
  leaves: [
    {
      date: { type: Date, required: true },
      type: { type: String, enum: ['paid', 'unpaid'], required: true },
      duration: { type: Number, enum: [1, 0.5], default: 1 },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // UPDATED
      appliedOn: { type: Date, default: Date.now }, // NEW FIELD
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // NEW FIELD
      approvedOn: { type: Date, default: null }, // NEW FIELD
      reason: { type: String, default: '' } // NEW FIELD
    }
  ]
});

UserSchema.methods.comparePassword = async function(enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema);
