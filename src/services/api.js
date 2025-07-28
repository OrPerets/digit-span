// Determine the API URL based on the current environment
const baseUrl = process.env.NODE_ENV === 'production' 
  ? ''  // Use relative URLs in production since API and frontend are on the same domain
  : 'http://localhost:3001';

console.log('Using API URL:', baseUrl || 'relative (same domain)');

/**
 * BACKEND REQUIREMENT FOR SEQUENCE ROTATION:
 * 
 * You need to implement a backend endpoint: GET /api/sequences/next
 * 
 * This endpoint should:
 * 1. Track the last assigned sequence in your database
 * 2. Return the next sequence in rotation: A -> B -> A...
 * 3. Update the database with the newly assigned sequence
 * 4. Return JSON: { "sequence": "A" } (or B)
 * 
 * For digit-span, we have two conditions:
 * - A: Series A with music, then Series B without music
 * - B: Series B with music, then Series A without music
 */

export const initializeExperiment = async (data) => {
  try {
    const response = await fetch(`${baseUrl}/api/experiments/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error initializing experiment:', error);
    throw error;
  }
};

export const saveTaskResult = async (taskData) => {
  try {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save task result: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving task result:', error);
    throw error;
  }
};

export const completeExperiment = async (experimentData) => {
  try {
    const response = await fetch(`${baseUrl}/api/experiments/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(experimentData),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete experiment: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing experiment:', error);
    throw error;
  }
};

export const getNextSequence = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/sequences/next`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // If backend sequence endpoint is not available, fallback to local randomization
      console.warn('Backend sequence endpoint not available, using local randomization');
      const sequences = ['A', 'B'];
      const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
      return { sequence: randomSequence };
    }

    return await response.json();
  } catch (error) {
    console.warn('Error getting next sequence from backend, using local randomization:', error);
    // Fallback to local randomization
    const sequences = ['A', 'B'];
    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
    return { sequence: randomSequence };
  }
}; 