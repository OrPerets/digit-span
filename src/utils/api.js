// Get the appropriate API base URL
export const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), use the current domain
    return '';
  } else {
    // In development, use the local server (changed from 5000 to 3001)
    return 'http://localhost:3001';
  }
};

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  DIGIT_SPAN_RESULTS: '/api/digit-span/results',
  DIGIT_SPAN_RESULTS_BY_ID: (participantId) => `/api/digit-span/results/${participantId}`
}; 