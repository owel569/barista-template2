import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000; // Replit utilise process.env.PORT
const HOST = '0.0.0.0'; // Nécessaire pour Replit

async function startServer() {
  const app = express();

  // Middleware CORS seulement en développement
  if (process.env.NODE_ENV !== 'production') {
    const cors = await import('cors');
    app.use(cors.default({ origin: '*' }));
  }

  // Configuration Vite en développement
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 443, // Port WebSocket spécial pour Replit
          clientPort: 443
        }
      },
      root: path.resolve(__dirname, '../client'),
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, '../client/dist')));
  }

  // Routes API
  app.use('/api', apiRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
  });

  // Gestion des routes frontend
  app.get('*', async (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        root: path.resolve(__dirname, '../client'),
        appType: 'spa'
      });
      const html = await vite.transformIndexHtml(
        req.url,
        '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'
      );
      res.send(html);
    } else {
      res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
    }
  });

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
    console.log(`⚡ API disponible sur http://${HOST}:${PORT}/api`);
  });
}

startServer().catch(err => {
  console.error('Erreur démarrage serveur:', err);
  process.exit(1);
});