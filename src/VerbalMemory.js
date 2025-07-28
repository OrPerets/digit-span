import React, { useState, useEffect, useCallback } from 'react';
import TaskInstructions from './TaskInstructions';
import './VerbalMemory.css';

function VerbalMemory({ 
  words, 
  onComplete, 
  onPhaseChange, 
  isFirstOccurrence, 
  showFullInstructions,
  shortInstruction 
}) {
  // Default words for demonstration
  const defaultWords = [
    'שולחן', 'כוס', 'ספר', 'דלת', 'חלון', 'עץ', 'כיסא', 'מחשב',
    'טלפון', 'מפתח', 'תיק', 'עיפרון', 'נייר', 'מים', 'פרח', 'שעון'
  ];

  const [currentPhase, setCurrentPhase] = useState('instructions');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [rememberedWords, setRememberedWords] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isInRecallPhase, setIsInRecallPhase] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);
  const [results, setResults] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const currentWords = words || defaultWords;

  // Automatically save words to remembered list every 2 seconds during recall
  useEffect(() => {
    let interval;
    if (isInRecallPhase && userInput.trim()) {
      interval = setInterval(() => {
        const trimmedInput = userInput.trim();
        if (trimmedInput && !rememberedWords.some(word => word.toLowerCase() === trimmedInput.toLowerCase())) {
          const textareaWords = trimmedInput.split(/\n+/).filter(line => line.trim());
          const newWords = textareaWords.filter(word => 
            !rememberedWords.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())
          );
          if (newWords.length > 0) {
            setRememberedWords(prev => [...prev, ...newWords]);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isInRecallPhase, userInput, rememberedWords]);

  // Notify parent of phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  const instructions = {
    title: "משימת זיכרון מילים",
    description: "במשימה זו תראה רשימת מילים. נסה לזכור כמה שיותר מילים.",
    steps: [
      "תראה מילים המוצגות אחת אחרי השנייה",
      "נסה לזכור כמה שיותר מילים",
      "לאחר מכן תתבקש להקליד את המילים שאתה זוכר",
      "השימוש במקלדת חופשי, כתוב מילה אחת בכל שורה"
    ],
  };

  // Handle advancing to next word
  const handleNextWord = () => {
    if (currentWordIndex < currentWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // All words shown, move to recall
      setCurrentPhase('recall');
      setIsInRecallPhase(true);
      setIsTimerRunning(true);
    }
  };

  // Handle adding word to remembered list
  const handleAddWord = () => {
    const trimmedInput = userInput.trim();
    if (trimmedInput && !rememberedWords.some(word => word.toLowerCase() === trimmedInput.toLowerCase())) {
      setRememberedWords([...rememberedWords, trimmedInput]);
      setUserInput('');
    }
  };

  // Handle completing the task
  const handleComplete = () => {
    setIsTimerRunning(false);
    
    // Process any remaining words in the textarea
    const textareaWords = userInput.split(/\n+/).filter(line => line.trim());
    const finalRememberedWords = [...rememberedWords];
    textareaWords.forEach(word => {
      if (word.trim() && !finalRememberedWords.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())) {
        finalRememberedWords.push(word.trim());
      }
    });

    const totalWords = currentWords.length;
    const rememberedCount = finalRememberedWords.length;
    const correctWords = finalRememberedWords.filter(word => 
      currentWords.some(originalWord => originalWord.toLowerCase() === word.toLowerCase())
    );
    const correctCount = correctWords.length;
    
    const taskResults = {
      totalWords,
      rememberedCount,
      correctCount,
      accuracy: totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0,
      wordsShown: currentWords,
      wordsRemembered: finalRememberedWords,
      correctWordsRemembered: correctWords,
      completed: true
    };

    setResults(taskResults);
    setCurrentPhase('complete');
    
    if (onComplete) {
      onComplete(taskResults);
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Handle starting the task
  const handleStartTask = () => {
    setCurrentPhase('encoding');
  };

  // Handle moving to recall phase
  const handleStartRecall = () => {
    setCurrentPhase('recall');
    setIsInRecallPhase(true);
    setIsTimerRunning(true);
  };

  // Auto-start if no instructions needed
  useEffect(() => {
    if (!showFullInstructions && currentPhase === 'instructions') {
      setCurrentPhase('encoding');
    }
  }, [showFullInstructions, currentPhase]);

  if (currentPhase === 'instructions') {
    if (!showFullInstructions) {
      return (
        <div className="verbal-memory-container">
          <div className="memory-content">
            <div className="phase-title">
              {shortInstruction || "משימת זיכרון מילים"}
            </div>
            <button
              onClick={handleStartTask}
              className="add-word-button"
              style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}
            >
              התחל במשימה
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <TaskInstructions 
        instructions={instructions}
        onStart={handleStartTask}
        shortInstruction={shortInstruction}
      />
    );
  }

  return (
    <div className="verbal-memory-container" style={{ direction: 'rtl' }}>
      <div className="memory-content">
        
        {currentPhase === 'encoding' && (
          <div className="encoding-phase">
            <div className="phase-title">
              מילה {currentWordIndex + 1} מתוך {currentWords.length}
            </div>
            <div className="word-display">
              {currentWords[currentWordIndex]}
            </div>
            <button 
              onClick={handleNextWord}
              className="add-word-button"
              style={{ marginTop: '20px' }}
            >
              {currentWordIndex < currentWords.length - 1 ? 'מילה הבאה' : 'סיים צפייה'}
            </button>
          </div>
        )}

        {currentPhase === 'recall' && (
          <div className="recall-phase">
            <div className="phase-title">
              זכור מילים ({timer} שניות נותרו)
            </div>
            <div className="timer-display">
              {timer}
            </div>
            
            <div className="input-container">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="word-input"
                placeholder="כתוב מילים שאתה זוכר, מילה אחת בכל שורה..."
                rows={8}
                autoFocus
                style={{
                  width: '100%',
                  minHeight: '200px',
                  resize: 'vertical'
                }}
              />
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '10px'
              }}>
                <button 
                  onClick={handleComplete}
                  className="add-word-button"
                  style={{ 
                    backgroundColor: '#dc3545',
                    marginTop: '0'
                  }}
                >
                  סיים מבחן
                </button>
                
                <button 
                  onClick={() => setShowAllWords(!showAllWords)}
                  className="add-word-button"
                  style={{ 
                    backgroundColor: '#6c757d',
                    marginTop: '0'
                  }}
                >
                  {showAllWords ? 'הסתר' : 'הצג'} מילים שנזכרו
                </button>
              </div>
            </div>

            {showAllWords && rememberedWords.length > 0 && (
              <div className="remembered-words">
                <h4>מילים שנזכרו עד כה ({rememberedWords.length}):</h4>
                <div className="word-grid">
                  {rememberedWords.map((word, index) => (
                    <div key={index} className="remembered-word">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'complete' && results && (
          <div className="completion-message">
            <h2>המשימה הושלמה!</h2>
            <div className="scores">
              <p>מילים שהוצגו: {results.totalWords}</p>
              <p>מילים שנזכרו: {results.rememberedCount}</p>
              <p>מילים נכונות: {results.correctCount}</p>
              <p>דיוק: {results.accuracy}%</p>
            </div>
            
            <details style={{ marginTop: '20px', textAlign: 'right' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                פירוט מילים
              </summary>
              <div style={{ marginTop: '10px' }}>
                <h4>מילים שהוצגו:</h4>
                <div className="word-grid">
                  {results.wordsShown.map((word, index) => (
                    <div key={index} className="word-item">
                      {word}
                    </div>
                  ))}
                </div>
                
                <h4 style={{ marginTop: '20px' }}>מילים נכונות שנזכרו:</h4>
                <div className="word-grid">
                  {results.correctWordsRemembered.map((word, index) => (
                    <div key={index} className="remembered-word" style={{ backgroundColor: '#d4edda' }}>
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerbalMemory;