import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Gestionnaire global pour les promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Promesse non gérée:', event.reason);
  // Ne pas empêcher l'affichage pour le debugging
});

// Gestionnaire global pour les erreurs non gérées
window.addEventListener('error', (event) => {
  console.warn('Erreur globale:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);