import './react-global';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// S'assurer que les styles Tailwind sont chargés
console.log('✅ Styles CSS chargés depuis main.tsx');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);