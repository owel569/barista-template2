import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Gestionnaire global pour les promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
  // Log l'erreur pour le debugging mais évite le spam
  if (process.env.NODE_ENV === 'development') {
    console.warn('Promesse non gérée:', event.reason);
  }
  event.preventDefault();
});

// Gestionnaire global pour les erreurs non gérées
window.addEventListener('error', (event) => {
  // Log l'erreur pour le debugging mais évite le spam
  if (process.env.NODE_ENV === 'development') {
    console.warn('Erreur non gérée:', event.error);
  }
  event.preventDefault();
});

// Gestionnaire pour les erreurs de ressources
window.addEventListener('error', (event) => {
  if (event.target !== window) {
    // Erreur de chargement de ressource (image, script, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erreur de ressource:', event.target);
    }
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);