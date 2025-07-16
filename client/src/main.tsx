import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Gestionnaire global pour les promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
  // Supprimer les logs pour éviter le spam console
  event.preventDefault();
});

// Gestionnaire global pour les erreurs non gérées
window.addEventListener('error', (event) => {
  // Supprimer les logs pour éviter le spam console
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);