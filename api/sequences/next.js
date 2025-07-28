const { connectToDatabase, GlobalState } = require('../_lib/mongodb');

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

  if (req.method === 'GET') {
    try {
      await connectToDatabase();
      
      // Get or create experiment counter
      let counterDoc = await GlobalState.findOne({ key: 'experimentCounter' });
      
      if (!counterDoc) {
        // Initialize counter if it doesn't exist
        counterDoc = new GlobalState({
          key: 'experimentCounter',
          value: { count: 0 }
        });
        await counterDoc.save();
      }
      
      // Increment counter for this experiment
      const currentCount = counterDoc.value.count;
      const newCount = currentCount + 1;
      
      // Update counter in database
      await GlobalState.updateOne(
        { key: 'experimentCounter' },
        { 
          value: { count: newCount },
          lastUpdated: new Date()
        }
      );
      
      // Determine sequence based on alternating logic
      // Even experiments (2, 4, 6...) start with music
      // Odd experiments (1, 3, 5...) start without music
      const startWithMusic = newCount % 2 === 0;
      
      // Assign sequence:
      // If starting with music: A (Series A with music first)
      // If starting without music: B (Series B with music first, but we'll modify this)
      let sequence;
      let sequenceDescription;
      
      if (startWithMusic) {
        sequence = 'A'; // Series A with music → Series B without music
        sequenceDescription = 'Start with music (Series A with music, then Series B without music)';
      } else {
        sequence = 'B_NO_MUSIC'; // Special case: Series B without music → Series A with music
        sequenceDescription = 'Start without music (Series B without music, then Series A with music)';
      }
      
      console.log(`Experiment ${newCount}: ${sequenceDescription}`);
      
      res.json({ 
        sequence: sequence,
        experimentNumber: newCount,
        startWithMusic: startWithMusic,
        description: sequenceDescription,
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
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 