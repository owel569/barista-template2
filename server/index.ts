
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './routes/index';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5000'); // Port unique pour tout

  // CORS configuration simplifiée
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  // Middlewares de base
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes API - prioritaires
  app.use('/api', apiRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'API Barista Café fonctionne',
      port: PORT,
      mode: process.env.NODE_ENV || 'development'
    });
  });

  // Configuration Vite selon l'environnement
  if (process.env.NODE_ENV !== 'production') {
    // En développement : Vite en mode middleware
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: PORT,
          protocol: 'ws'
        }
      },
      root: path.join(__dirname, '../client'),
      appType: 'spa'
    });

    // Middleware Vite pour toutes les routes non-API
    app.use('*', (req, res, next) => {
      // Laisser passer les routes API et health
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }
      
      // Déléguer à Vite pour le frontend
      vite.middlewares(req, res, next);
    });

  } else {
    // En production : servir les fichiers statiques
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    // Gestion des routes frontend pour SPA
    app.get('*', (req, res) => {
      // Éviter de servir l'index pour les routes API
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return res.status(404).json({ error: 'Route API non trouvée' });
      }
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Base de données connectée avec succès`);
    console.log(`🚀 Serveur Barista Café démarré sur http://0.0.0.0:${PORT}`);
    console.log(`🔌 Routes API disponibles sur http://0.0.0.0:${PORT}/api`);
    console.log(`📱 Frontend disponible sur http://0.0.0.0:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔄 Hot Module Replacement (HMR) intégré`);
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
