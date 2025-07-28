const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Global State Schema - for tracking experiment counter
const globalStateSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const GlobalState = mongoose.models.GlobalState || mongoose.model('GlobalState', globalStateSchema, 'globalState');

// Digit Span Result Schema
const digitSpanSchema = new mongoose.Schema({
  participantId: {
    type: String,
    required: true
  },
  experimentMode: {
    type: String,
    enum: ['test', 'full'],
    required: true
  },
  sequence: {
    type: String,
    enum: ['A', 'B'],
    required: false
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

const DigitSpanResult = mongoose.models.DigitSpanResult || mongoose.model('DigitSpanResult', digitSpanSchema, 'digitSpan');

module.exports = { connectToDatabase, DigitSpanResult, GlobalState }; 