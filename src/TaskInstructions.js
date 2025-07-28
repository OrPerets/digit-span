import React from 'react';
import './VerbalMemory.css';

function TaskInstructions({ instructions, onStart, shortInstruction }) {
  // Handle both new and old prop structures for backward compatibility
  const title = instructions?.title || 'הוראות המשימה';
  const description = instructions?.description || '';
  const steps = instructions?.steps || [];

  return (
    <div className="verbal-memory-container" style={{ direction: 'rtl' }}>
      <div className="memory-content">
        <div className="phase-title" style={{ fontSize: '2rem', marginBottom: '30px' }}>
          {title}
        </div>
        
        <div style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#333', direction: 'rtl', textAlign: 'center' }}>
          {description}
        </div>
        
        <div style={{ textAlign: 'right', marginBottom: '40px', direction: 'rtl' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ 
              margin: '15px 0', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              direction: 'rtl'
            }}>
              <span style={{ 
                backgroundColor: '#1E3A8A', 
                color: 'white', 
                borderRadius: '50%', 
                width: '25px', 
                height: '25px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                marginLeft: '10px'
              }}>
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={onStart}
          className="add-word-button"
          style={{ 
            padding: '15px 30px', 
            fontSize: '1.1rem',
            marginTop: '20px'
          }}
        >
          התחל במשימה
        </button>
      </div>
    </div>
  );
}

export default TaskInstructions; 