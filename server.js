const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Mongo URI - Replace with your actual Mongo URI
const MONGO_URI = 'mongodb+srv://00876abc:00876abc@cluster.mongodb.net/mydb?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const tokenSchema = new mongoose.Schema({
  userId: String,
  tokensLeft: Number,
  lastClaimTime: Date
});

const Token = mongoose.model('Token', tokenSchema);

// Middleware to parse JSON
app.use(express.json());

app.post('/claim', async (req, res) => {
  const { userId } = req.body;
  const claimAmount = 1000;  // Amount to claim
  const currentTime = Date.now();
  const claimInterval = 24 * 60 * 60 * 1000; // 24 hours

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    let user = await Token.findOne({ userId });

    if (user) {
      const timeDiff = currentTime - user.lastClaimTime;
      if (timeDiff < claimInterval) {
        return res.status(400).json({ message: 'You can only claim once every 24 hours.' });
      }

      // Update user data
      user.tokensLeft += claimAmount;
      user.lastClaimTime = currentTime;
      await user.save();
    } else {
      // Create new user if not found
      user = new Token({ userId, tokensLeft: claimAmount, lastClaimTime: currentTime });
      await user.save();
    }

    return res.status(200).json({ message: 'Tokens claimed successfully!', tokensLeft: user.tokensLeft });
  } catch (err) {
    return res.status(500).json({ message: 'Error processing your request', error: err });
  }
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
