import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './routes/index';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const SERVER_PORT = parseInt(process.env.PORT || '5000'); // Port serveur Express
  const VITE_PORT = 3000; // Port Vite séparé

  // CORS configuration pour permettre les requêtes cross-origin
  app.use(cors({
    origin: [`http://localhost:${VITE_PORT}`, `http://0.0.0.0:${VITE_PORT}`],
    credentials: true
  }));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes API - prioritaires
  app.use('/api', apiRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'API Barista Café fonctionne',
      port: SERVER_PORT,
      vitePort: VITE_PORT
    });
  });

  // En mode développement : proxy vers Vite
  if (process.env.NODE_ENV !== 'production') {
    // Création du serveur Vite en mode middleware
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { port: 3001 } // Port HMR séparé
      },
      root: path.join(__dirname, '../client'),
      appType: 'spa'
    });

    // Utilisation des middlewares Vite pour les routes non-API
    app.use('*', (req, res, next) => {
      // Laisser passer les routes API
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }
      
      // Déléguer à Vite pour le frontend
      vite.middlewares(req, res, next);
    });
  } else {
    // En production : servir les fichiers statiques
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return res.status(404).json({ error: 'Route API non trouvée' });
      }
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`✅ Base de données connectée avec succès`);
    console.log(`🚀 Serveur Express démarré sur http://0.0.0.0:${SERVER_PORT}`);
    console.log(`🔌 Routes API disponibles sur http://0.0.0.0:${SERVER_PORT}/api`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 Frontend Vite disponible sur http://0.0.0.0:${VITE_PORT}`);
      console.log(`🔄 Hot Module Replacement (HMR) sur le port 3001`);
    }
  });
}

startServer().catch(err => {
  console.error('Erreur démarrage serveur:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});