const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Personal Details
    prefix: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    nationality: { type: String },

    // Contact Details
    workEmail: { type: String, required: true, unique: true, trim: true },
    mobileNumber: { type: String },

    // Authentication
    password: { type: String, required: true },

    // Employment Details
    employeeCode: { type: String, unique: true, sparse: true },
    biometricId: { type: String, unique: true, sparse: true },
    dateOfJoining: { type: Date },
    employmentType: { type: String },
    employmentStatus: { type: String, default: 'Active' },
    company: { type: String },
    businessUnit: { type: String },
    department: { type: String },
    subDepartment: { type: String },
    designation: { type: String },
    region: { type: String },
    branch: { type: String },
    subBranch: { type: String },
    shift: { type: String },
    level: { type: String },
    skillType: { type: String },
    dateOfConfirmation: { type: Date },

    // Hierarchy and Roles
    userType: {
        type: String,
        enum: ['employee', 'teamleader', 'admin'],
        default: 'employee'
    },
    reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    functionalManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Leave and Attendance
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
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            reason: { type: String, trim: true },
            appliedOn: { type: Date, default: Date.now },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            approvedOn: { type: Date },
        }
    ],

    // Separation Details
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

    // Other Status
    otherStatus: { type: String },
    otherStatusDate: { type: Date },
    otherStatusRemarks: { type: String },
    isdCode: { type: String },

}, { timestamps: true });

UserSchema.methods.comparePassword = async function(enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema);
