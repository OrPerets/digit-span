import React, { useState, useEffect, useCallback } from 'react';
import DigitSpanTask from '../DigitSpanTask';
import TaskInstructions from '../TaskInstructions';
import { 
  initializeExperiment, 
  saveTaskResult, 
  completeExperiment,
  getNextSequence
} from '../services/api';
import { 
  initializeExperimentData,
  getExperimentData,
  updateExperimentData,
  addTaskResult,
  clearExperimentData
} from '../services/localExperimentData';
import { saveExperimentState, clearExperimentState } from '../services/experimentState';
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/audioUtils';

// Global experiment control - set to false to deactivate the experiment
const EXPERIMENT_ACTIVE = true;

// Digit span sequences for the three conditions
const DIGIT_SPAN_SEQUENCES = {
  A: [
    { condition: 'seriesA', withMusic: true, description: 'Series A with background music' },
    { condition: 'seriesB', withMusic: false, description: 'Series B without music' },
  ],
  B: [
    { condition: 'seriesB', withMusic: true, description: 'Series B with background music' },
    { condition: 'seriesA', withMusic: false, description: 'Series A without music' },
  ],
  B_NO_MUSIC: [
    { condition: 'seriesB', withMusic: false, description: 'Series B without music' },
    { condition: 'seriesA', withMusic: true, description: 'Series A with background music' },
  ]
};

// Function to generate random number without repeating digits
const generateRandomDigits = (length) => {
  const digits = [];
  const availableDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (let i = 0; i < length; i++) {
    if (availableDigits.length === 0) {
      // If we run out of unique digits, start over (shouldn't happen for length <= 10)
      availableDigits.push(...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    
    const randomIndex = Math.floor(Math.random() * availableDigits.length);
    const selectedDigit = availableDigits[randomIndex];
    digits.push(selectedDigit);
    availableDigits.splice(randomIndex, 1); // Remove used digit
  }
  
  return digits;
};

// Generate digit spans based on condition
const generateDigitSpansForCondition = (condition, isTestMode = false, isFirstTask = true) => {
  // Practice trials (only for first task)
  const practice = isFirstTask ? [
    { id: "practice1", digits: [2, 8], correct: [8, 2], isPractice: true },
    { id: "practice2", digits: [4, 7, 1], correct: [1, 7, 4], isPractice: true }
  ] : [];
  
  if (isTestMode) {
    // Test mode: only 2 practice + 3 trials (practice only on first task)
    const testTrials = [
      { id: "test1", digits: [3, 4], correct: [4, 3] },
      { id: "test2", digits: [5, 2, 9], correct: [9, 2, 5] },
      { id: "test3", digits: [7, 1, 8], correct: [8, 1, 7] }
    ];
    
    return [...practice, ...testTrials];
  }
  
  // Full experiment mode: original implementation
  // Training stays the same (1a, 1b) - only on first task
  const training = isFirstTask ? [
    { id: "1a", digits: [3, 4], correct: [4, 3] },
    { id: "1b", digits: [7, 1], correct: [1, 7] }
  ] : [];

  // Original sequences
  const originalA = [
    { id: "2a", digits: [5, 2, 9], length: 3 },
    { id: "3a", digits: [9, 4, 7, 2], length: 4 },
    { id: "4a", digits: [2, 9, 6, 4, 7], length: 5 }
  ];

  const originalB = [
    { id: "2b", digits: [6, 1, 3], length: 3 },
    { id: "3b", digits: [1, 8, 5, 3], length: 4 },
    { id: "4b", digits: [5, 1, 8, 3, 9], length: 5 }
  ];

  // Main trials: Pair trials by length (2a, 2b, then 3a, 3b, then 4a, 4b)
  // This follows standard digit span administration: both trials of same length before discontinue check
  let mainSequences = [];

  if (condition === 'seriesA') {
    // Series A: For each length, use original 'a' + random 'b' 
    for (let i = 0; i < originalA.length; i++) {
      // Add original 'a' sequence for this length
      mainSequences.push({
        id: originalA[i].id,
        digits: originalA[i].digits,
        correct: [...originalA[i].digits].reverse(),
        length: originalA[i].digits.length
      });
      
      // Add random 'b' sequence with same length as corresponding 'b'
      const randomDigits = generateRandomDigits(originalB[i].length);
      mainSequences.push({
        id: originalB[i].id.replace('b', 'b_random'),
        digits: randomDigits,
        correct: [...randomDigits].reverse(),
        length: randomDigits.length
      });
    }
  } else {
    // Series B: For each length, use original 'b' + random 'a'
    for (let i = 0; i < originalB.length; i++) {
      // Add random 'a' sequence with same length as corresponding 'a'
      const randomDigits = generateRandomDigits(originalA[i].length);
      mainSequences.push({
        id: originalA[i].id.replace('a', 'a_random'),
        digits: randomDigits,
        correct: [...randomDigits].reverse(),
        length: randomDigits.length
      });
      
      // Add original 'b' sequence for this length
      mainSequences.push({
        id: originalB[i].id,
        digits: originalB[i].digits,
        correct: [...originalB[i].digits].reverse(),
        length: originalB[i].digits.length
      });
    }
  }

  return [...practice, ...training, ...mainSequences];
};

const ExperimentFlow = () => {
  const [stage, setStage] = useState('participantId'); // Start with participant ID input
  const [participantId, setParticipantId] = useState(''); // Store participant ID
  const [experimentMode, setExperimentMode] = useState(null); // 'test' or 'full'
  const [experimentId, setExperimentId] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [musicStartedAfterPractice, setMusicStartedAfterPractice] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isInTransition, setIsInTransition] = useState(false); // New robust transition state

  // Debug useEffect to track isInTransition state changes
  useEffect(() => {
    if (isInTransition) {
      console.log('Transition screen activated');
    }
  }, [isInTransition]);

  // Debug useEffect to track showTransition state changes
  useEffect(() => {
    // Keeping this for essential debugging if needed
  }, [showTransition]);

  // Debug useEffect to track stage changes
  useEffect(() => {
    console.log('Stage changed to:', stage);
  }, [stage]);

  // Send final results to digit-span API endpoint
  const sendDigitSpanResults = useCallback(async () => {
    const experimentData = getExperimentData();
    if (!experimentData || !experimentData.tasks) return;

    // Aggregate all digit-span results
    const allTrialResults = [];
    let totalTrials = 0;
    let correctTrials = 0;
    const passFailMap = {};

    experimentData.tasks.forEach(task => {
      if (task.taskType === 'digit-span' && task.results) {
        totalTrials += task.results.totalTrials || 0;
        correctTrials += task.results.correctTrials || 0;
        
        // Merge trial results
        if (task.results.trialResults) {
          allTrialResults.push(...task.results.trialResults);
        }
        
        // Merge pass/fail maps
        if (task.results.passFailMap) {
          Object.keys(task.results.passFailMap).forEach(length => {
            if (!passFailMap[length]) {
              passFailMap[length] = [];
            }
            passFailMap[length].push(...task.results.passFailMap[length]);
          });
        }
      }
    });

    if (totalTrials === 0) return; // No digit-span results to send

    const digitSpanData = {
      totalTrials,
      correctTrials,
      passFailMap,
      direction: 'backward',
      completed: true,
      experimentMode: experimentMode || 'full',
      sequence: sequence || 'A',
      trialDetails: allTrialResults
    };

    try {
      const response = await fetch('/api/digit-span/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(digitSpanData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Digit-span results saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving digit-span results:', error);
      throw error;
    }
  }, [experimentMode, sequence]);

  // Complete the experiment
  const completeExperimentFlow = useCallback(async () => {
    const experimentData = getExperimentData();
    
    // Try to send digit-span results to the digit-span API endpoint
    try {
      await sendDigitSpanResults();
      console.log('Digit-span results sent to API successfully');
    } catch (error) {
      console.warn('Failed to send digit-span results to API:', error);
    }

    // Try to complete with backend
    try {
      await completeExperiment(experimentData);
      console.log('Experiment completed with backend');
    } catch (error) {
      console.warn('Failed to complete experiment with backend:', error);
    }

    // Update local data
    updateExperimentData({ endTime: new Date().toISOString() });

    // Clear state
    clearExperimentState();
    
    setStage('thankyou');
  }, [sendDigitSpanResults]);

  // Load saved state on component mount
  useEffect(() => {
    if (!EXPERIMENT_ACTIVE) {
      return;
    }

    // Clear any existing state to always start fresh
    clearExperimentState();
    clearExperimentData();

    // Remove the state restoration logic - always start fresh
    // const savedState = loadExperimentState();
    // if (savedState) {
    //   console.log('Restoring saved experiment state:', savedState);
    //   setExperimentId(savedState.experimentId);
    //   setSequence(savedState.sequence);
    //   setCurrentTaskIndex(savedState.currentTaskIndex || 0);
    //   setStage(savedState.stage || 'modeSelection');
    //   setExperimentMode(savedState.experimentMode || null);
    //   setStartTime(savedState.startTime);
    // }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (experimentId && sequence) {
      const state = {
        experimentId,
        sequence,
        currentTaskIndex,
        stage,
        startTime,
        experimentMode,
        tasks: []
      };
      saveExperimentState(state);
    }
  }, [experimentId, sequence, currentTaskIndex, stage, startTime, experimentMode]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (backgroundAudio) {
        stopBackgroundMusic(backgroundAudio);
      }
    };
  }, [backgroundAudio]);

  // Update stage to 'tasks' when starting a task condition
  useEffect(() => {
    if (stage === 'instructions' && !showInstructions) {
      setStage('tasks');
    }
  }, [stage, showInstructions]);

  // Initialize experiment
  const startExperiment = useCallback(async (mode) => {
    try {
      console.log('Starting experiment in mode:', mode);
      
      // Get next sequence from backend or use local randomization
      const sequenceData = await getNextSequence();
      const assignedSequence = sequenceData.sequence;
      
      console.log('Assigned sequence:', assignedSequence);

      // Use participant ID as experiment ID (with timestamp for uniqueness)
      const newExperimentId = `${participantId}-${Date.now()}`;
      
      // Initialize experiment data
      const initData = {
        experimentId: newExperimentId,
        participantId: participantId,
        sequence: assignedSequence,
        experimentMode: mode,
        startTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
      };

      // Try to initialize with backend
      try {
        await initializeExperiment(initData);
        console.log('Experiment initialized with backend');
      } catch (error) {
        console.warn('Failed to initialize with backend, continuing locally:', error);
      }

      // Initialize local data storage
      initializeExperimentData(newExperimentId);
      updateExperimentData({ 
        participantId: participantId,
        sequence: assignedSequence,
        experimentMode: mode
      });

      setExperimentId(newExperimentId);
      setSequence(assignedSequence);
      setExperimentMode(mode);
      setStartTime(new Date().toISOString());
      setStage('instructions'); // Changed from 'consent' to 'instructions'
      
    } catch (error) {
      console.error('Error starting experiment:', error);
      // Continue with local-only mode
      const newExperimentId = `${participantId}-${Date.now()}`;
      const fallbackSequence = Math.random() < 0.5 ? 'A' : 'B';
      
      initializeExperimentData(newExperimentId);
      updateExperimentData({ 
        participantId: participantId,
        sequence: fallbackSequence,
        experimentMode: mode
      });

      setExperimentId(newExperimentId);
      setSequence(fallbackSequence);
      setExperimentMode(mode);
      setStartTime(new Date().toISOString());
      setStage('instructions'); // Changed from 'consent' to 'instructions'
    }
  }, [participantId]);

  // Handle task completion
  const handleTaskComplete = useCallback(async (taskResults) => {
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) return;

    const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    
    console.log('Task completed:', {
      currentTaskIndex,
      sequence,
      totalConditions: DIGIT_SPAN_SEQUENCES[sequence].length,
      currentCondition: currentCondition.description
    });
    
    // Prepare task data for backend
    const taskData = {
      experimentId,
      taskType: 'digit-span',
      condition: currentCondition.condition,
      withMusic: currentCondition.withMusic,
      taskIndex: currentTaskIndex,
      results: taskResults,
      timestamp: new Date().toISOString()
    };

    // Save to local storage
    addTaskResult(taskData);

    // Try to save to backend (non-blocking - don't wait for it)
    saveTaskResult(taskData)
      .then(() => {
        console.log('Task result saved to backend');
      })
      .catch((error) => {
        console.warn('Failed to save task result to backend:', error);
      });

    // Stop background music if playing
    if (backgroundAudio) {
      stopBackgroundMusic(backgroundAudio);
      setBackgroundAudio(null);
    }

    // Move to next task or complete experiment (don't wait for API)
    const nextTaskIndex = currentTaskIndex + 1;
    console.log('Checking next task:', { 
      nextTaskIndex, 
      totalConditions: DIGIT_SPAN_SEQUENCES[sequence].length,
      currentStage: stage,
      showInstructions,
      showTransition
    });
    
    if (nextTaskIndex < DIGIT_SPAN_SEQUENCES[sequence].length) {
      console.log('Moving to next condition:', DIGIT_SPAN_SEQUENCES[sequence][nextTaskIndex].description);
      console.log('Current state before transition:', { 
        stage, 
        showInstructions, 
        showTransition,
        currentTaskIndex 
      });
      
      // Force transition screen to show
      console.log('Moving to next condition, setting up transition...');
      
      // Use the robust transition state
      setIsInTransition(true);
      setCurrentTaskIndex(nextTaskIndex);
      setShowTransition(true);
      setShowInstructions(false);
      // Don't change stage - let isInTransition handle it
      
    } else {
      console.log('All conditions completed, finishing experiment');
      // Complete experiment
      await completeExperimentFlow();
    }
  }, [sequence, currentTaskIndex, experimentId, backgroundAudio, completeExperimentFlow, stage, showInstructions, showTransition]);

  // Handle transition screen completion
  const handleTransitionComplete = useCallback(() => {
    console.log('Transition complete button clicked');
    setIsInTransition(false); // Exit transition mode
    setShowTransition(false);
    
    // For the second task (index 1), skip instructions and go directly to task
    if (currentTaskIndex === 1) {
      console.log('Second task - skipping instructions, going directly to task');
      setShowInstructions(false);
      setStage('tasks');
      
      // Start music immediately if needed for second task
      if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) return;
      const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
      if (currentCondition.withMusic) {
        console.log('Starting background music immediately for second task:', currentCondition.condition);
        const audio = playBackgroundMusic();
        setBackgroundAudio(audio);
      }
    } else {
      // For first task, show instructions as usual
      setShowInstructions(true);
      setStage('instructions');
    }
    
    console.log('Set isInTransition=false, showTransition=false, currentTaskIndex:', currentTaskIndex);
  }, [currentTaskIndex, sequence, setBackgroundAudio]);

  // Handle starting a specific task condition
  const startTaskCondition = useCallback(() => {
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) return;

    const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    const isFirstTask = currentTaskIndex === 0;
    
    console.log('Starting task condition:', {
      currentTaskIndex,
      condition: currentCondition.description,
      withMusic: currentCondition.withMusic,
      isFirstTask
    });
    
    setShowInstructions(false);
    setStage('tasks'); // Ensure we're in the tasks stage
    setMusicStartedAfterPractice(false);
    
    // For first task with music, music will start after practice
    // For subsequent tasks with music, start immediately
    // For tasks without music, never start music
    if (currentCondition.withMusic && !isFirstTask) {
      console.log('Starting background music immediately for subsequent task:', currentCondition.condition);
      const audio = playBackgroundMusic();
      setBackgroundAudio(audio);
    }
  }, [sequence, currentTaskIndex]);

  // Handle when practice phase ends and actual task begins
  const handlePracticeComplete = useCallback(() => {
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) return;

    const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    const isFirstTask = currentTaskIndex === 0;
    
    // Start music after practice for first task with music
    if (currentCondition.withMusic && isFirstTask && !musicStartedAfterPractice) {
      console.log('Starting background music after practice for first task:', currentCondition.condition);
      const audio = playBackgroundMusic();
      setBackgroundAudio(audio);
      setMusicStartedAfterPractice(true);
    }
  }, [sequence, currentTaskIndex, musicStartedAfterPractice]);

  // Handle phase changes from DigitSpanTask
  const handlePhaseChange = useCallback((phase) => {
    // Handle phase changes if needed
    console.log('Phase changed to:', phase);
  }, []);

  if (!EXPERIMENT_ACTIVE) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl' }}>
        <h1>הניסוי אינו פעיל כרגע</h1>
        <p>אנא פנה למנהל הניסוי</p>
      </div>
    );
  }

  // FIRST PRIORITY: If in transition, always show transition screen regardless of anything else
  if (isInTransition) {
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) {
      return <div>Loading transition...</div>;
    }

    const nextCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    
    return (
      <div style={{ 
        textAlign: 'center', 
        direction: 'rtl',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        color: '#000000',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
          <p style={{ 
            fontSize: '24px', 
            marginBottom: '40px',
            lineHeight: '1.5',
            color: '#000000',
            fontWeight: 'normal',
            margin: '0 0 40px 0'
          }}>
            {nextCondition.withMusic ? 
              "כעת תתנסה במשימה זו עם מוזיקה" : 
              "כעת תתנסה במשימה זו ללא מוזיקה"
            }
          </p>
          
          <button 
            onClick={handleTransitionComplete}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'normal',
              backgroundColor: '#3b4f8a',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              minWidth: '180px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2d3f73';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3b4f8a';
            }}
          >
            התחל במשימה
          </button>
      </div>
    );
  }

  // Handle participant ID submission
  const handleParticipantIdSubmit = (e) => {
    e.preventDefault();
    if (participantId.trim()) {
      setStage('modeSelection');
    }
  };

  if (stage === 'participantId') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        direction: 'rtl',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h1 style={{ 
            color: '#1E3A8A', 
            marginBottom: '30px',
            fontSize: '32px'
          }}>
            ניסוי Digit Span
          </h1>
          <p style={{ 
            fontSize: '18px', 
            marginBottom: '30px',
            lineHeight: '1.6',
            color: '#333'
          }}>
            שלום! כדי להתחיל בניסוי, אנא הזן את מספר תעודת זהות
          </p>
          <form onSubmit={handleParticipantIdSubmit}>
            <input
              type="text"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              placeholder="מספר נבדק"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                direction: 'ltr'
              }}
              required
              autoFocus
            />
            <button 
              type="submit"
              disabled={!participantId.trim()}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                backgroundColor: participantId.trim() ? '#1E3A8A' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: participantId.trim() ? 'pointer' : 'not-allowed',
                minWidth: '200px',
                transition: 'background-color 0.3s ease'
              }}
            >
              המשך
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (stage === 'modeSelection') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        direction: 'rtl',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          maxWidth: '600px',
          width: '100%'
        }}>
          <h1 style={{ marginBottom: '20px', color: '#1E3A8A' }}>ברוך הבא, נבדק {participantId}</h1>
          <p style={{ fontSize: '18px', marginBottom: '5px', lineHeight: '1.6' }}>
            עופר - יש כאן אפשרות לבדיקה מהירה עם פחות סדרות מספרים עבורינו
          </p>
          <p style={{ fontSize: '18px', marginBottom: '30px', lineHeight: '1.6' }}>
            כאשר נחבר את זה לניסוי המלא, יהיה גם את הבדיקה שמיעה כמו שיש בשאר הניסויים
          </p>
          <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={() => startExperiment('test')}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              מצב בדיקה
            </button>
            
            <button 
              onClick={() => startExperiment('full')}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                backgroundColor: '#1E3A8A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              ניסוי מלא
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'consent') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl' }}>
        <h1>ניסוי Digit Span</h1>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          ברוכים הבאים לניסוי שלנו. במהלך הניסוי תבצעו משימת זיכרון עבודה בשני תנאים שונים.
        </p>
        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          הניסוי כולל שני חלקים עם משימת Digit Span - אחד עם מוזיקת רקע ואחד בלי.
        </p>
        <p style={{ fontSize: '14px', marginBottom: '30px', color: '#666' }}>
          מצב ניסוי: {experimentMode === 'test' ? 'מצב בדיקה' : 'ניסוי מלא'}
        </p>
        <button 
          onClick={() => setStage('instructions')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1E3A8A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          התחל ניסוי
        </button>
      </div>
    );
  }

  if (stage === 'instructions') {
    console.log('In instructions stage:', {
      sequence,
      currentTaskIndex,
      showInstructions,
      showTransition,
      stage
    });
    
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) {
      console.log('No sequence data, showing loading...');
      return <div>Loading...</div>;
    }

    const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    
    // Show transition screen between conditions
    if (showTransition) {
      console.log('🎯 TRANSITION SCREEN IS RENDERING!');
      console.log('Rendering transition screen, showTransition =', showTransition);
      console.log('Current condition for transition:', currentCondition);
      const nextCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
      
      // Add a bright debug indicator
      console.log('🔴 RED TRANSITION SCREEN SHOULD BE VISIBLE NOW!');
      
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          direction: 'rtl',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ff0000', // RED BACKGROUND FOR DEBUGGING
          color: 'white'
        }}>
          <div style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            border: '5px solid red' // Red border for visibility
          }}>
            <h1 style={{ 
              color: '#059669', 
              marginBottom: '20px',
              fontSize: '32px'
            }}>
              ✅ החלק הראשון הושלם!
            </h1>
            <p style={{ 
              fontSize: '20px', 
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              {nextCondition.withMusic ? 
                "כעת תתנסה במשימה עם מוזיקה" : 
                "כעת תתנסה במשימה בלי מוזיקה"
              }
            </p>
            <p style={{ 
              fontSize: '18px', 
              marginBottom: '40px',
              color: '#666'
            }}>
              {nextCondition.withMusic ? 
                "החלק הבא יתבצע עם מוזיקת רקע" : 
                "החלק הבא יתבצע בשקט"
              }
            </p>
            <button 
              onClick={handleTransitionComplete}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                backgroundColor: '#1E3A8A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              המשך
            </button>
            <p style={{ fontSize: '12px', color: 'red', marginTop: '20px' }}>
              DEBUG: Transition screen is working!
            </p>
          </div>
        </div>
      );
    } else {
      console.log('❌ showTransition is false, checking showInstructions:', showInstructions);
    }
    
    if (showInstructions) {
      const isFirstTask = currentTaskIndex === 0;
      
      const instructions = {
        title: `זיכרון ספרות `,
        // description: currentCondition.description,
        steps: [
          "במשימה זו תראה סדרת ספרות ותתבקש לחזור עליה בסדר הפוך.",
          "כל ספרה תוצג בנפרד למשך שנייה אחת, עם רווח של שנייה בין ספרה לספרה.",
          "לאחר מכן הקלד את הספרות בסדר הפוך - מהאחרונה לראשונה",
          "לחץ Enter או על כפתור 'שלח' כדי להמשיך.",
          isFirstTask ? 
            "המשימה תתחיל עם שני נסיונות לתרגול ולאחר מכן תתבצע המשימה עצמה." :
            "המשימה תתחיל ישירות ללא תרגול."
        ]
      };

      return (
        <TaskInstructions 
          instructions={instructions}
          onStart={startTaskCondition}
        />
      );
    }
  }

  if (stage === 'tasks') {
    console.log('In tasks stage - checking if should render task or wait for transition:', {
      stage,
      showTransition,
      sequence,
      currentTaskIndex
    });
    
    // Don't render tasks if we're showing transition screen
    if (showTransition) {
      console.log('🚫 NOT rendering tasks because showTransition is true');
      return <div>Transitioning...</div>;
    }
    
    if (!sequence || !DIGIT_SPAN_SEQUENCES[sequence]) {
      return <div>Loading...</div>;
    }

    const currentCondition = DIGIT_SPAN_SEQUENCES[sequence][currentTaskIndex];
    const isFirstTask = currentTaskIndex === 0;
    const digitSpans = generateDigitSpansForCondition(
      currentCondition.condition, 
      experimentMode === 'test',
      isFirstTask
    );

    console.log('✅ Rendering DigitSpanTask for condition:', currentCondition.description);

    return (
      <div>
        {/* Progress indicator */}
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#1E3A8A',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          חלק {currentTaskIndex + 1} מתוך {DIGIT_SPAN_SEQUENCES[sequence].length}
        </div>

        {/* Music status indicator */}
        {currentCondition.withMusic && (backgroundAudio || musicStartedAfterPractice) && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#059669',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            zIndex: 1000
          }}>
            🎵 מוזיקת רקע פעילה
          </div>
        )}
        
        <DigitSpanTask
          digitSpans={digitSpans}
          direction="backward"
          onComplete={handleTaskComplete}
          onPhaseChange={handlePhaseChange}
          onPracticeComplete={handlePracticeComplete}
          showFullInstructions={false}
          digitDisplayTime={1000}
          testMode={experimentMode === 'test'}
          showTaskCompletion={currentTaskIndex === DIGIT_SPAN_SEQUENCES[sequence].length - 1}
        />
      </div>
    );
  }

  if (stage === 'thankyou') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl' }}>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <h1 style={{ fontSize: '48px', color: '#1E3A8A', marginBottom: '40px' }}>
            תודה על השתתפותך!
          </h1>
          <p style={{ fontSize: '24px', color: '#6B7280', marginBottom: '40px' }}>
            הניסוי הושלם בהצלחה
          </p>
          <button 
            onClick={() => {
              // Reset for new participant
              clearExperimentData();
              clearExperimentState();
              setStage('participantId'); // Start from participant ID input
              setParticipantId(''); // Clear participant ID
              setExperimentId(null);
              setSequence(null);
              setExperimentMode(null);
              setCurrentTaskIndex(0);
              setShowInstructions(true);
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#1E3A8A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            נבדק חדש
          </button>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default ExperimentFlow; 