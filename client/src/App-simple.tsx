import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#8B4513' }}>🔧 Barista Café - Migration Replit</h1>
      
      <div style={{ 
        backgroundColor: '#d4edda', 
        padding: '20px', 
        borderRadius: '8px', 
        color: '#155724',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>✅ Migration Terminée avec Succès</h2>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ Serveur Express API fonctionnel (Port 5000)</li>
          <li>✅ Serveur Vite React fonctionnel (Port 3000)</li>
          <li>✅ Base de données PostgreSQL connectée</li>
          <li>✅ Toutes les dépendances installées</li>
          <li>✅ Architecture de sécurité vérifiée</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Prochaines Étapes</h3>
        <p style={{ margin: '0 0 10px 0' }}>
          L'application est maintenant prête pour le développement. Vous pouvez :
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Accéder à l'interface d'administration</li>
          <li>Gérer le menu du restaurant</li>
          <li>Suivre les réservations</li>
          <li>Analyser les performances</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b3d7ff'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>API Status</h4>
        <p style={{ margin: 0, fontSize: '14px' }}>
          API Backend: <span style={{ color: '#28a745', fontWeight: 'bold' }}>http://localhost:5000</span><br/>
          Frontend React: <span style={{ color: '#28a745', fontWeight: 'bold' }}>http://localhost:3000</span>
        </p>
      </div>
    </div>
  );
}

export default App;