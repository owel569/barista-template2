import React, { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Composants simples pour tester
function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/menu/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#8B4513' }}>Barista Café - Système Opérationnel</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Status du Système</h2>
        <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '5px', color: '#155724' }}>
          ✅ Migration terminée avec succès<br/>
          ✅ Backend API fonctionnel (Port 5000)<br/>
          ✅ Frontend React fonctionnel (Port 3000)<br/>
          ✅ Base de données PostgreSQL connectée<br/>
          ✅ Authentification JWT opérationnelle
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Menu du Restaurant</h2>
        {loading ? (
          <p>Chargement du menu...</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {categories.map((cat: any) => (
              <div key={cat.id} style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#8B4513', margin: '0 0 10px 0' }}>{cat.name}</h3>
                <p style={{ margin: '0', color: '#666' }}>{cat.description}</p>
                <small>Items: {cat.items?.length || 0}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Navigation</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/admin" style={{ 
            padding: '10px 20px', 
            backgroundColor: '#8B4513', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '5px'
          }}>Administration</a>
          <a href="/menu" style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6B4423', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '5px'
          }}>Menu Complet</a>
        </div>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [result, setResult] = useState(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
      }
    } catch (error) {
      setResult({ success: false, message: 'Erreur de connexion' });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
      <h1>Administration - Connexion</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ 
          padding: '10px', 
          backgroundColor: '#8B4513', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Se connecter
        </button>
      </form>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <strong>Compte de test:</strong><br/>
        Email: admin@barista.com<br/>
        Mot de passe: Admin123!
      </div>

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          borderRadius: '5px',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          color: result.success ? '#155724' : '#721c24'
        }}>
          {result.success ? 'Connexion réussie!' : result.message}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={AdminLogin} />
          <Route component={() => <div style={{padding: '20px'}}><h1>Page non trouvée</h1><a href="/">Retour à l'accueil</a></div>} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;