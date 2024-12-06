// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Use CORS middleware
app.use(cors());

// Use JSON body parser middleware
app.use(express.json());

// Define Claim model
const Claim = require('./models/Claim');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// POST route to initialize the user with 9000 tokens (if they haven't claimed yet)
app.post('/initialize', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  // Check if the user already exists
  const existingClaim = await Claim.findOne({ userId });

  if (existingClaim) {
    return res.status(200).send(`You already have ${existingClaim.amount} tokens.`);
  }

  // If the user doesn't exist, create a record with 9000 tokens
  const claim = new Claim({
    userId,
    amount: 9000,  // Assign 9000 tokens initially
    claimedAt: new Date(),  // No waiting for the first claim
  });

  await claim.save();
  res.status(200).send('Your account has been initialized with 9000 tokens!');
});

// POST route for claiming additional tokens (1000 tokens per claim)
app.post('/claim', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  // Check if the user exists
  const existingClaim = await Claim.findOne({ userId });

  if (!existingClaim) {
    return res.status(400).send('You need to initialize your account first with /initialize.');
  }

  // Check if this is the first claim (no cooldown for first claim)
  if (!existingClaim.claimedAt) {
    existingClaim.amount += 1000;  // Add 1000 tokens
    existingClaim.claimedAt = new Date();  // Record the claim time

    await existingClaim.save();
    return res.status(200).send(`You have claimed 1000 tokens for the first time! Total tokens: ${existingClaim.amount}`);
  }

  // Calculate time difference from the last claim
  const timeDifference = new Date() - new Date(existingClaim.claimedAt);

  // 24 hours in milliseconds (24 * 60 * 60 * 1000)
  const cooldownTime = 24 * 60 * 60 * 1000;

  // If the time difference is greater than or equal to 24 hours, allow them to claim 1000 tokens
  if (timeDifference >= cooldownTime) {
    existingClaim.amount += 1000;  // Add 1000 tokens
    existingClaim.claimedAt = new Date();  // Update the claim time

    await existingClaim.save();
    return res.status(200).send(`You have claimed 1000 tokens! Total tokens: ${existingClaim.amount}`);
  } else {
    const remainingTime = cooldownTime - timeDifference; // Time remaining for the next claim
    return res.status(400).send(`You can only claim tokens once every 24 hours. Please wait ${Math.ceil(remainingTime / 60000)} minutes.`);
  }
});

// GET route to check user's token balance
app.get('/check-token', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send('Missing userId.');
  }

  // Find the user's claim record
  const claim = await Claim.findOne({ userId });

  if (!claim) {
    return res.status(200).send('You have not claimed any tokens yet.');
  }

  // Return the claim details
  res.status(200).send(`You have ${claim.amount} tokens.`);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
