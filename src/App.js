import React, { useState, useEffect } from 'react';
import './App.css';
import ExperimentFlow from './components/ExperimentFlow';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="App">
      {isMobile ? (
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
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            maxWidth: '500px'
          }}>
            <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
              לא ניתן לבצע את הניסוי על טלפוניים ניידים
            </h1>
            <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
              יש לבצע דרך מחשב אישי בלבד
            </p>
          </div>
        </div>
      ) : (
        <ExperimentFlow />
      )}
    </div>
  );
}

export default App;
