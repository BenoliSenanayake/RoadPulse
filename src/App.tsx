import React from 'react';

function App() {
  const mode = "debug";
  console.log("[RoadPulse] System Booting. Mode:", mode);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif', 
      background: '#0f172a', 
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: '0' }}>RoadPulse</h1>
      <p style={{ opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '1rem' }}>
        Emergency Recovery Mode
      </p>
      <div style={{ marginTop: '2rem', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px border rgba(255,255,255,0.1)' }}>
        <p>If you see this, the React engine is working.</p>
      </div>
    </div>
  );
}

export default App;
