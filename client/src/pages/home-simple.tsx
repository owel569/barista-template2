import React from 'react';

export default function HomeSimple() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Barista Café</h1>
      <p>Bienvenue dans notre système de gestion de restaurant</p>
      <p>L'application a été migrée avec succès vers Replit!</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Navigation</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><a href="/menu">Menu</a></li>
          <li><a href="/login">Connexion</a></li>
          <li><a href="/admin">Administration</a></li>
        </ul>
      </div>
    </div>
  );
}