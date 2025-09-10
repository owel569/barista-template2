
import React from 'react';

export function DebugCSS() {
  const [cssLoaded, setCssLoaded] = React.useState(false);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Check if CSS is loaded
    const testElement = document.createElement('div');
    testElement.className = 'bg-coffee-primary text-coffee-light p-4';
    document.body.appendChild(testElement);
    
    const styles = window.getComputedStyle(testElement);
    const hasBackground = styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    
    setCssLoaded(hasBackground);
    document.body.removeChild(testElement);

    // Check if fonts are loaded
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      // Fallback for older browsers
      setTimeout(() => setFontsLoaded(true), 3000);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
      <div>CSS: {cssLoaded ? '✅' : '❌'}</div>
      <div>Fonts: {fontsLoaded ? '✅' : '❌'}</div>
      <div className="bg-coffee-primary text-coffee-light p-1 mt-1">
        Test couleur
      </div>
    </div>
  );
}
