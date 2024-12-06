const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Token = require('./models/token'); // Import the Token model

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Function to claim tokens
const claimTokens = async (userId) => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

  // Find or create a token record for the user
  let tokenRecord = await Token.findOne({ userId });

  if (!tokenRecord) {
    // Create a new record if the user hasn't claimed tokens yet
    tokenRecord = new Token({
      userId,
      lastClaim: now,
      claimedAmount: 0,
    });
  }

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

// Claim endpoint
app.post('/claim', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const claimedAmount = await claimTokens(userId);
    res.status(200).json({ message: `You have successfully claimed ${claimedAmount} tokens!` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
