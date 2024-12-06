// models/Claim.js

const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true, // User ID is required for every record
    unique: true,   // Ensure that userId is unique in the collection
  },
  amount: {
    type: Number,
    required: true,
    default: 0, // Default token amount when a user first claims
  },
  claimedAt: {
    type: Date,
    required: true,
    default: null, // Initially null, to mark when the user last claimed tokens
  },
});

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
