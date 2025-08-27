// Polyfill global pour React pour éviter les erreurs "React is not defined"
import * as React from 'react';

// Ajouter React au scope global
declare global {
  interface Window {
    React: typeof import('react');
  }
}

// S'assurer que React est disponible globalement
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

if (typeof global !== 'undefined') {
  (global as any).React = React;
}

export default React;