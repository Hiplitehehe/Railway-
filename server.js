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

// GET route to claim tokens
app.get('/claim', async (req, res) => {
  const { userId, amount } = req.query;

  if (!userId || !amount) {
    return res.status(400).send('Missing userId or amount.');
  }

  // Check if the user already claimed tokens
  const existingClaim = await Claim.findOne({ userId });

  if (existingClaim) {
    return res.status(400).send('You have already claimed tokens.');
  }

  // Create a new claim entry
  const claim = new Claim({
    userId,
    amount,
    claimedAt: new Date(),
  });

  await claim.save();
  res.status(200).send(`Claimed ${amount} tokens!`);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
