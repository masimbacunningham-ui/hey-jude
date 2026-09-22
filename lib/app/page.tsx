import React from 'react';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Hey Jude</h1>
      <p>Shared Household Financial Assistant</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Accounts Overview</h3>
        <ul>
          <li>Hello Paisa (Cunningham)</li>
          <li>Lynne's Mukuru</li>
          <li>Absa (Driving)</li>
          <li>Mukuru Savings</li>
        </ul>
      </div>
    </main>
  );
}
