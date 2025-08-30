const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Personal Details - Updated to match your data format
    "Prefix": { type: String, trim: true },
    "First name": { type: String, required: true, trim: true },
    "Last name": { type: String, required: true, trim: true },
    "Date of birth": { type: String }, // Keeping as string to match your format "02/06/2001"
    "Gender": { type: String, enum: ['Male', 'Female', 'Other'] },
    "Blood group": { type: String },
    "Nationality": { type: String },

    // Contact Details
    "Work email": { type: String, required: true, unique: true, trim: true },
    "Mobile number": { type: String },
    "ISDcode": { type: Number, default: 91 },

    // Authentication
    password: { type: String, required: true },

    // Employment Details - Updated to match your data format
    "Employee Code": { type: String, unique: true, sparse: true },
    "Date of joining": { type: String }, // Keeping as string to match your format "22/07/2024"
    "Employment type": { type: String },
    "Employment status": { type: String, default: 'Active' },
    "Company": { type: String },
    "Business Unit": { type: String },
    "Department": { type: String },
    "Sub department": { type: String },
    "Designation": { type: String },
    "Region": { type: String },
    "Branch": { type: String },
    "Sub branch": { type: String },
    "Shift": { type: String },
    "Level": { type: String },
    "Skill Type": { type: String },
    "Date of Confirmation": { type: String }, // Keeping as string to match format
    "Employee Other Status": { type: String },

    // Hierarchy and Roles - Updated field names
    userType: {
        type: String,
        enum: ['employee', 'teamleader', 'admin'],
        default: 'employee'
    },
    "Reporting manager": { type: String }, // Changed to String to match your data
    "Functional manager": { type: String }, // Changed to String to match your data

    // Leave and Attendance (keeping existing structure for compatibility)
    paidLeaveBalance: { type: Number, default: 12 },
    attendance: [
        {
            date: { type: Date, required: true },
            checkIn: { type: Date, required: true },
            checkInLocation: { lat: Number, lng: Number, address: String },
            checkOut: { type: Date },
            checkOutLocation: { lat: Number, lng: Number, address: String },
        }
    ],
    leaves: [
        {
            date: { type: Date, required: true },
            type: { type: String, enum: ['paid', 'unpaid'], required: true },
            duration: { type: Number, enum: [1, 0.5], default: 1 },
            half: { type: String, enum: ['first', 'second', null], default: null },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            reason: { type: String, trim: true },
            appliedOn: { type: Date, default: Date.now },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            approvedOn: { type: Date },
        }
    ],

    // Separation Details (keeping for future use)
    dateOfLeaving: { type: Date },
    dateOfResignation: { type: Date },
    dateOfSettlement: { type: Date },
    employeeSeparationReason: { type: String },
    organizationSeparationReason: { type: String },
    settlementSeparationReason: { type: String },
    isConsideredForFutureOpening: { type: Boolean, default: true },
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
    blacklistComments: { type: String },

}, { timestamps: true });

UserSchema.methods.comparePassword = async function(enteredPassword) {
    return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema);
