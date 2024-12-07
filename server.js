const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Model
const Claim = require('./models/Claim');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Initialize User with 9000 Tokens
app.post('/initialize', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  const existingClaim = await Claim.findOne({ userId });

  if (existingClaim) {
    return res.status(200).send(`You already have ${existingClaim.amount} tokens.`);
  }

  const claim = new Claim({
    userId,
    amount: 9000,
    claimedAt: null, // First-time users have no claim time initially
  });

  await claim.save();
  res.status(200).send('Your account has been initialized with 9000 tokens!');
});

// Claim Tokens
app.post('/claim', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  const existingClaim = await Claim.findOne({ userId });

  if (!existingClaim) {
    return res.status(400).send('You need to initialize your account first with /initialize.');
  }

  // First-time claim: No waiting required
  if (!existingClaim.claimedAt) {
    existingClaim.amount += 1000; // Add 1000 tokens
    existingClaim.claimedAt = new Date(); // Set the claim time
    await existingClaim.save();
    return res.status(200).send(`You have claimed 1000 tokens for the first time! Total tokens: ${existingClaim.amount}`);
  }

  // Calculate time difference
  const timeDifference = new Date() - new Date(existingClaim.claimedAt);
  const cooldownTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  if (timeDifference >= cooldownTime) {
    existingClaim.amount += 1000; // Add 1000 tokens
    existingClaim.claimedAt = new Date(); // Update claim time
    await existingClaim.save();
    return res.status(200).send(`You have claimed 1000 tokens! Total tokens: ${existingClaim.amount}`);
  } else {
    const remainingTime = cooldownTime - timeDifference;
    return res.status(400).send(`You can only claim tokens once every 24 hours. Please wait ${Math.ceil(remainingTime / 60000)} minutes.`);
  }
});

// Check Token Balance
app.get('/check-token', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  const claim = await Claim.findOne({ userId });

  if (!claim) {
    return res.status(200).send('You have not claimed any tokens yet.');
  }

  res.status(200).send(`You have ${claim.amount} tokens.`);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
