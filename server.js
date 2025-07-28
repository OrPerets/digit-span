const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed from 5000 to 3001

// CORS configuration - explicitly allow React app
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',  // Default React dev server
    'http://localhost:5001',  // Alternative React dev server port
    'http://localhost:3001',  // Another common port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Digit Span Result Schema
const digitSpanSchema = new mongoose.Schema({
  participantId: {
    type: String,
    required: true
  },
  sessionTimestamp: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  // Summary results
  totalTrials: {
    type: Number,
    required: true
  },
  correctTrials: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    enum: ['forward', 'backward'],
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  accuracy: {
    type: Number, // percentage
    required: true
  },
  // Detailed trial-by-trial results
  trialResults: [{
    trialId: String,
    trialIndex: Number,
    isPractice: Boolean,
    digitsShown: [Number],
    correctAnswer: [Number],
    userResponse: [Number],
    isCorrect: Boolean,
    responseTime: Number, // in milliseconds
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Pass/fail map from original structure
  passFailMap: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

const DigitSpanResult = mongoose.model('DigitSpanResult', digitSpanSchema, 'digitSpan');

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Get next sequence (for sequence rotation)
app.get('/api/sequences/next', (req, res) => {
  try {
    // Simple random assignment for now
    const sequences = ['A', 'B'];
    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
    
    res.json({ 
      sequence: randomSequence,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting next sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next sequence',
      error: error.message
    });
  }
});

// Initialize experiment
app.post('/api/experiments/init', (req, res) => {
  try {
    console.log('Initializing experiment:', req.body);
    
    // Just acknowledge the initialization for now
    res.status(201).json({
      success: true,
      message: 'Experiment initialized',
      experimentId: req.body.experimentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing experiment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize experiment',
      error: error.message
    });
  }
});

// Complete experiment
app.post('/api/experiments/complete', (req, res) => {
  try {
    console.log('Completing experiment:', req.body);
    
    // Just acknowledge the completion for now
    res.status(200).json({
      success: true,
      message: 'Experiment completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing experiment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete experiment',
      error: error.message
    });
  }
});

// Save individual task results (for intermediate saves)
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('Received task result:', req.body);
    
    // For now, just acknowledge receipt - we'll save everything at the end
    res.status(201).json({
      success: true,
      message: 'Task result received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling task result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task result',
      error: error.message
    });
  }
});

// Save digit span results
app.post('/api/digit-span/results', async (req, res) => {
  try {
    const {
      totalTrials,
      correctTrials,
      passFailMap,
      direction,
      completed,
      experimentMode = 'full', // Default to full if not specified
      sequence,
      trialDetails = []
    } = req.body;

    // Generate random participant ID for now
    const participantId = `participant_${uuidv4().substring(0, 8)}`;
    
    // Calculate accuracy
    const accuracy = totalTrials > 0 ? (correctTrials / totalTrials) * 100 : 0;

    // Create the result document
    const digitSpanResult = new DigitSpanResult({
      participantId,
      experimentMode,
      sequence,
      totalTrials,
      correctTrials,
      direction,
      completed,
      accuracy,
      passFailMap,
      trialResults: trialDetails
    });

    // Save to MongoDB
    const savedResult = await digitSpanResult.save();
    
    console.log(`Saved digit span result for participant: ${participantId}`);
    
    res.status(201).json({
      success: true,
      message: 'Results saved successfully',
      participantId: participantId,
      resultId: savedResult._id,
      data: savedResult
    });

  } catch (error) {
    console.error('Error saving digit span results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save results',
      error: error.message
    });
  }
});

// Get all results (for testing/admin purposes)
app.get('/api/digit-span/results', async (req, res) => {
  try {
    const results = await DigitSpanResult.find().sort({ createdAt: -1 }).limit(10);
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});

// Get results by participant ID
app.get('/api/digit-span/results/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const results = await DigitSpanResult.find({ participantId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: results.length,
      participantId,
      data: results
    });
  } catch (error) {
    console.error('Error fetching participant results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participant results',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 