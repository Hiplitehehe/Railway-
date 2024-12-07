const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Ensure each userId is unique
  },
  amount: {
    type: Number,
    required: true,
    default: 0, // Default tokens for new users
  },
  claimedAt: {
    type: Date,
    default: null, // Null for users who haven't claimed yet
  },
});

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
