const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  }
});


// Method to compare passwords using simple string comparison
UserSchema.methods.comparePassword = async function(enteredPassword) {
  // This is a direct, plain-text comparison.
  return enteredPassword === this.password;
};
module.exports = mongoose.model('User', UserSchema);
