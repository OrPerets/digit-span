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
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 