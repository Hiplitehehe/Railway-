// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());  // To handle CORS issues for browser-based requests

// MongoDB Connection Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Define the token schema and model
const tokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  lastClaim: { type: Date, default: Date.now },
  claimedAmount: { type: Number, default: 0 }
});

const Token = mongoose.model('Token', tokenSchema);

// Function to handle the token claim
const claimTokens = async (userId) => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

  let tokenRecord = await Token.findOne({ userId });

  if (!tokenRecord) {
    // Create a new record if the user hasn't claimed tokens yet
    console.log('No existing record found. Creating new token record for user:', userId);
    tokenRecord = new Token({
      userId,
      lastClaim: now,
      claimedAmount: 0,
    });
  }

  console.log("Token Record:", tokenRecord); // Debugging log

  // Check if the user has already claimed tokens in the last 24 hours
  if (tokenRecord.lastClaim > twentyFourHoursAgo) {
    throw new Error('You can only claim tokens once every 24 hours');
  }

  // Update the token record with the new claim
  tokenRecord.lastClaim = now;
  tokenRecord.claimedAmount += 1000; // Add 1000 tokens (adjust as needed)

  await tokenRecord.save();
  return tokenRecord.claimedAmount;
};

// POST /claim route to claim tokens
app.post('/claim', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  console.log('Claim request received from user:', userId);

  try {
    const claimedAmount = await claimTokens(userId);
    console.log('Claim successful:', claimedAmount);
    res.status(200).json({ message: `You have successfully claimed ${claimedAmount} tokens!` });
  } catch (err) {
    console.error('Error during claim:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// Set up the server to listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
