const { connectToDatabase, DigitSpanResult } = require('../_lib/mongodb');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      // Get all results (last 10 for performance)
      const results = await DigitSpanResult.find().sort({ createdAt: -1 }).limit(10);
      
      res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });

    } else if (req.method === 'POST') {
      // Save new results
      console.log('Received digit-span results:', JSON.stringify(req.body, null, 2));
      
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

      // Validate required fields
      if (totalTrials === undefined || totalTrials === null || 
          correctTrials === undefined || correctTrials === null ||
          !passFailMap || !direction || !experimentMode) {
        console.error('Validation failed:', {
          totalTrials,
          correctTrials,
          passFailMap: !!passFailMap,
          direction,
          experimentMode
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          received: {
            totalTrials,
            correctTrials,
            passFailMap: !!passFailMap,
            direction,
            experimentMode
          }
        });
      }

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

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 