import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#8B5A2B' }}>Barista Café</h1>
      <p>Application successfully running on Replit!</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Navigation</h2>
        <ul>
          <li><a href="/admin" style={{ color: '#8B5A2B' }}>Admin Dashboard</a></li>
          <li><a href="/menu" style={{ color: '#8B5A2B' }}>Menu</a></li>
          <li><a href="/reservations" style={{ color: '#8B5A2B' }}>Reservations</a></li>
        </ul>
      </div>
    </div>
  );
}

export default App;