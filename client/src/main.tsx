import './react-global';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// S'assurer que les styles Tailwind sont chargés et forcés
console.log('✅ Styles CSS chargés depuis main.tsx');

// Forcer l'application des styles CSS au démarrage
document.documentElement.classList.add('tailwind-loaded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);