import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './routes/index';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000'); // Un seul port pour tout

  // CORS configuration
  app.use(cors({
    origin: '*', // À restreindre en production
    credentials: true
  }));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Création du serveur Vite en mode middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    root: path.join(__dirname, '../client'),
    appType: 'spa'
  });

  // Utilisation des middlewares Vite
  app.use(vite.middlewares);

  // Routes API
  app.use('/api', apiRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'API Barista Café fonctionne' });
  });

  // Gestion des routes frontend
  app.get('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      
      // Ignore les routes API
      if (url.startsWith('/api')) return next();

      const template = await vite.transformIndexHtml(
        url,
        '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'
      );
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      if (e instanceof Error) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Base de données connectée avec succès`);
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🔌 Routes API disponibles sur http://localhost:${PORT}/api`);
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