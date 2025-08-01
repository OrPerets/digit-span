import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TaskInstructions from './TaskInstructions';
import './VerbalMemory.css';

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

function DigitSpanTask({ digitSpans, onComplete, onPhaseChange, onPracticeComplete, isFirstOccurrence, showFullInstructions, shortInstruction, digitDisplayTime = 1000, testMode = false, showTaskCompletion = true }) {
  const instructions = {
    title: "מבחן טווח ספרות",
    description: testMode
      ? ""
      :"",
    steps: testMode ? [
      "במשימה זו תראה סדרת ספרות ותתבקש לחזור עליה בסדר הפוך.",
      "כל ספרה תוצג בנפרד למשך שנייה אחת",
      "לאחר מכן, תתבקש לחזור על הספרות בסדר הפוך - מהאחרונה לראשונה.",
      "לאחר ההקלדה, לחץ על Enter או על כפתור 'שלח' כדי להמשיך.",
      "שני הנסיונות הראשונים הם תרגול לצורך הבנת המשימה."
    ] : [
      "במשימה זו תראה סדרת ספרות ותתבקש לחזור עליה בסדר הפוך.",
      "כל ספרה תוצג בנפרד למשך שנייה אחת",
      "לאחר מכן, תתבקש לחזור על הספרות בסדר הפוך - מהאחרונה לראשונה.",
      "לאחר ההקלדה, לחץ על Enter או על כפתור 'שלח' כדי להמשיך.",
      "שני הנסיונות הראשונים הם תרגול לצורך הבנת המשימה."
    ]
  };

  // Generate random digit sequences for the new structure
  const generateDigitSpans = () => {
    // Practice trials with feedback
    const practice = [
      { id: "practice1", digits: [2, 8], correct: [8, 2], isPractice: true },
      { id: "practice2", digits: [4, 7, 1], correct: [1, 7, 4], isPractice: true }
    ];
    
    // Training stays the same (1a, 1b)
    const training = [
      { id: "1a", digits: [3, 4], correct: [4, 3] },
      { id: "1b", digits: [7, 1], correct: [1, 7] }
    ];

    // Original 'a' sequences
    const originalA = [
      { id: "2a", digits: [5, 2, 9], length: 3 },
      { id: "3a", digits: [9, 4, 7, 2], length: 4 },
      { id: "4a", digits: [2, 9, 6, 4, 7], length: 5 }
    ];

    // Original 'b' sequences  
    const originalB = [
      { id: "2b", digits: [6, 1, 3], length: 3 },
      { id: "3b", digits: [1, 8, 5, 3], length: 4 },
      { id: "4b", digits: [5, 1, 8, 3, 9], length: 5 }
    ];

    // Main trials: Pair trials by length (2a, 2b, then 3a, 3b, then 4a, 4b)
    // This follows standard digit span administration: both trials of same length before discontinue check
    const mainTrials = [];
    
    for (let i = 0; i < originalA.length; i++) {
      // Add 'a' sequence for this length
      mainTrials.push({
        id: originalA[i].id,
        digits: originalA[i].digits,
        correct: [...originalA[i].digits].reverse(),
        length: originalA[i].digits.length
      });
      
      // Add 'b' sequence for the same length  
      mainTrials.push({
        id: originalB[i].id,
        digits: originalB[i].digits,
        correct: [...originalB[i].digits].reverse(),
        length: originalB[i].digits.length
      });
    }

    return [...practice, ...training, ...mainTrials];
  };

  // Generate default digit spans
  const defaultDigitSpans = useMemo(() => {
    return generateDigitSpans();
  }, []);

  // Use provided digitSpans or default ones
  const currentSpans = useMemo(() => {
    const spans = digitSpans || defaultDigitSpans;
    return spans;
  }, [digitSpans, defaultDigitSpans]);

  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [displayedDigit, setDisplayedDigit] = useState('');
  const [userInput, setUserInput] = useState('');
  const [currentPhase, setCurrentPhase] = useState('instructions');
  const [showInstructions, setShowInstructions] = useState(showFullInstructions);
  const [trialResults, setTrialResults] = useState([]);
  const [results, setResults] = useState(null);
  const [passFailMap, setPassFailMap] = useState({});
  const [trialStartTime, setTrialStartTime] = useState(null);

  // Auto-complete when showTaskCompletion is false
  useEffect(() => {
    if (currentPhase === 'complete' && results && !showTaskCompletion) {
      // When showTaskCompletion is false, don't show anything - let parent handle
      // onComplete is already called in handleSubmit
    }
  }, [currentPhase, results, showTaskCompletion]);

  // Debugging useEffect to track currentTrialIndex changes
  useEffect(() => {
    if (currentSpans[currentTrialIndex]) {
      // Trial index changed
    }
  }, [currentTrialIndex, currentSpans]);

  // Debugging useEffect to track displayedDigit changes
  useEffect(() => {
    // Displayed digit changed
  }, [displayedDigit, currentTrialIndex]);

  // Notify parent of phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  // Function to check if task should end (failure on both trials of same span length)
  const checkIfTaskShouldEnd = useCallback(() => {
    // In test mode, never end early - complete all trials
    if (testMode) {
      return false;
    }
    
    // Check if both trials of the current span length have failed
    // According to digit span instructions: "Discontinue after failure on both trials of any item (e.g., 5a and 5b)"
    for (const [lengthStr, results] of Object.entries(passFailMap)) {
      const length = parseInt(lengthStr);
      
      // For lengths > 2 (main test items), check if we have exactly 2 results and both failed
      if (length > 2 && results.length === 2) {
        const [firstTrial, secondTrial] = results;
        if (!firstTrial && !secondTrial) {
          return true; // Both trials of this span length failed - discontinue
        }
      }
    }
    return false;
  }, [passFailMap, testMode]);

  // Function to calculate final results
  const calculateResults = useCallback((allTrialResults) => {
    const totalTrials = allTrialResults.length;
    const correctTrials = allTrialResults.filter(trial => trial.isCorrect).length;
    const accuracy = totalTrials > 0 ? (correctTrials / totalTrials) * 100 : 0;

    return {
      totalTrials,
      correctTrials,
      accuracy: Math.round(accuracy * 10) / 10,
      direction: 'backward', // Add required direction field
      trialResults: allTrialResults, // Changed from trialDetails to match schema
      passFailMap,
      timestamp: new Date().toISOString(),
      taskType: 'digit-span-backward'
    };
  }, [passFailMap]);

  // Function to start displaying digits for a trial
  const startDigitDisplay = useCallback((trialIndex = null) => {
    const indexToUse = trialIndex !== null ? trialIndex : currentTrialIndex;
    
    if (!currentSpans[indexToUse]) {
      return;
    }

    const currentTrial = currentSpans[indexToUse];
    
    setUserInput('');
    setCurrentPhase('displaying');
    setTrialStartTime(null); // Reset trial start time

    const displayDigits = async () => {
      // Pre-display pause
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (let index = 0; index < currentTrial.digits.length; index++) {
        // Display digit
        setDisplayedDigit(currentTrial.digits[index]);
        await new Promise(resolve => setTimeout(resolve, digitDisplayTime));
        
        // Clear digit (pause between digits)
        setDisplayedDigit('');
        if (index < currentTrial.digits.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final pause after all digits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentPhase('input');
      setDisplayedDigit('');
      
      // Start tracking response time when input phase begins
      setTrialStartTime(Date.now());
    };

    displayDigits();
  }, [currentTrialIndex, currentSpans, digitDisplayTime]);

  // Handle user input submission
  const handleSubmit = useCallback(() => {
    const currentTrial = currentSpans[currentTrialIndex];
    if (!currentTrial) return;

    const userDigits = userInput.split('').map(Number).filter(n => !isNaN(n));
    const isCorrect = JSON.stringify(userDigits) === JSON.stringify(currentTrial.correct);
    
    // Calculate response time in milliseconds
    const responseTime = trialStartTime ? Date.now() - trialStartTime : 0;

    const trialResult = {
      trialId: currentTrial.id,
      trialIndex: currentTrialIndex,
      isPractice: currentTrial.isPractice || false,
      digitsShown: currentTrial.digits, // Changed from 'sequence' to match schema
      correctAnswer: currentTrial.correct, // Changed from 'expectedResponse' to match schema
      userResponse: userDigits,
      isCorrect: isCorrect, // Changed from 'correct' to match schema
      responseTime: responseTime, // Now a number in milliseconds
      timestamp: new Date()
    };

    const newTrialResults = [...trialResults, trialResult];
    setTrialResults(newTrialResults);

    // Update pass/fail map - track results by sequence length
    const sequenceLength = currentTrial.digits.length;
    if (!passFailMap[sequenceLength]) {
      passFailMap[sequenceLength] = [];
    }
    passFailMap[sequenceLength].push(isCorrect);
    setPassFailMap({...passFailMap});

    // Log trial completion for debugging
    console.log(`Trial ${currentTrial.id} (length ${sequenceLength}): ${isCorrect ? 'PASS' : 'FAIL'}`);
    console.log(`Results for length ${sequenceLength}:`, passFailMap[sequenceLength]);

    if (currentTrial.isPractice) {
      // For practice trials, show feedback and move to next trial
      setCurrentPhase('practice-feedback');
      setTimeout(() => {
        const nextIndex = currentTrialIndex + 1;
        if (nextIndex < currentSpans.length) {
          // Check if next trial is not practice (transition from practice to main task)
          const nextTrial = currentSpans[nextIndex];
          if (!nextTrial.isPractice && onPracticeComplete) {
            // Call the callback when transitioning from practice to main task
            onPracticeComplete();
          }
          setCurrentTrialIndex(nextIndex);
          startDigitDisplay(nextIndex);
        } else {
          // Should not happen in practice, but handle gracefully
          const finalResults = calculateResults(newTrialResults);
          setResults(finalResults);
          setCurrentPhase('complete');
          if (onComplete) {
            onComplete(finalResults);
          }
        }
      }, 2000);
      return;
    }

    // Check if we should discontinue - only after completing both trials of a span length
    const currentLength = currentTrial.digits.length;
    const trialsForCurrentLength = passFailMap[currentLength] || [];
    const shouldCheckDiscontinue = trialsForCurrentLength.length === 2; // Both trials completed
    
    let shouldEnd = false;
    if (shouldCheckDiscontinue) {
      shouldEnd = checkIfTaskShouldEnd();
      if (shouldEnd) {
        console.log(`Task discontinued after both trials of length ${currentLength} failed`);
      }
    }
    
    if (shouldEnd) {
      const finalResults = calculateResults(newTrialResults);
      setResults(finalResults);
      setCurrentPhase('complete');
      if (onComplete) {
        onComplete(finalResults);
      }
    } else {
      // Move to next trial
      const nextIndex = currentTrialIndex + 1;
      if (nextIndex < currentSpans.length) {
        setCurrentTrialIndex(nextIndex);
        startDigitDisplay(nextIndex);
      } else {
        // All trials completed
        const finalResults = calculateResults(newTrialResults);
        setResults(finalResults);
        setCurrentPhase('complete');
        if (onComplete) {
          onComplete(finalResults);
        }
      }
    }
  }, [currentTrialIndex, currentSpans, userInput, trialResults, passFailMap, calculateResults, onComplete, startDigitDisplay, trialStartTime, checkIfTaskShouldEnd, onPracticeComplete]);

  // Handle starting the task
  const handleStartTask = useCallback(() => {
    setShowInstructions(false);
    setCurrentPhase('displaying');
    startDigitDisplay(0);
  }, [startDigitDisplay]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (currentPhase === 'input' && event.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentPhase, handleSubmit]);

  // Auto-start task if instructions are disabled
  useEffect(() => {
    if (!showInstructions && currentPhase === 'instructions') {
      handleStartTask();
    }
  }, [showInstructions, currentPhase, handleStartTask]);

  if (showInstructions && currentPhase === 'instructions') {
    return (
      <TaskInstructions 
        instructions={instructions}
        onStart={handleStartTask}
        shortInstruction={shortInstruction}
      />
    );
  }

  const currentTrial = currentSpans[currentTrialIndex];
  const isPractice = currentTrial?.isPractice || false;

  return (
    <div className="verbal-memory-container" style={{ direction: 'rtl' }}>
      <div className="memory-content">
        {currentPhase === 'displaying' && (
          <>
            <div className="phase-title">
              {isPractice ? 'תרגול' : `ניסיון ${currentTrialIndex + 1} מתוך ${currentSpans.length}`}
            </div>
            <div className="digit-display">
              {displayedDigit || ' '}
            </div>
          </>
        )}

        {currentPhase === 'input' && (
          <>
            <div className="phase-title">
              {isPractice ? 'תרגול - הזן את הספרות בסדר הפוך' : 'הזן את הספרות בסדר הפוך'}
            </div>
            <div className="input-container">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="digit-input"
                placeholder="...הזן ספרות"
                autoFocus
                style={{ direction: 'ltr' }}
              />
              <button 
                onClick={handleSubmit}
                className="add-word-button"
              >
                שלח
              </button>
            </div>
          </>
        )}

        {currentPhase === 'practice-feedback' && (
          <>
            <div className="phase-title">תרגול</div>
            <div style={{ 
              fontSize: '32px', 
              margin: '60px 0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              textAlign: 'center'
            }}>
              {trialResults[trialResults.length - 1]?.isCorrect ? (
                <div style={{ color: '#10B981', fontWeight: 'bold' }}>✓ נכון!</div>
              ) : (
                <div style={{ color: '#EF4444', fontWeight: 'bold' }}>
                  <div style={{ marginBottom: '20px' }}>✗ לא נכון</div>
                  <div style={{ fontSize: '20px' }}>
                    התשובה הנכונה היא: {currentTrial?.correct?.join('')}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {currentPhase === 'complete' && results && showTaskCompletion && (
          <div className="completion-message">
            <h2>המבחן הושלם!</h2>
          </div>
        )}

        {currentPhase === 'complete' && results && !showTaskCompletion && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            fontSize: '18px',
            color: '#666',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            מעבר לחלק הבא...
          </div>
        )}
      </div>
    </div>
  );
}

export default DigitSpanTask; 