export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
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
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 