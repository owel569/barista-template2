import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

async function createServer() {
  const app = express();

  // 1. Créer le serveur Vite en mode middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    root: path.resolve(__dirname, '../client'),
    appType: 'spa',
    logLevel: 'info'
  });

  // 2. Middlewares
  app.use(vite.middlewares);
  app.use(express.json());

  // 3. Routes API
  app.use('/api', apiRoutes);

  // 4. Gestion des routes SPA
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        res.status(404).send('Not found');
        return;
      }

      // Utiliser le vrai fichier index.html du client
      const fs = await import('fs');
      const templatePath = path.resolve(__dirname, '../client/index.html');
      const template = fs.readFileSync(templatePath, 'utf-8');
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.status(500).end((e as Error).message);
    }
  });

  // 5. Démarrer le serveur
  return app.listen(PORT, HOST, () => {
    console.log(`✅ Base de données connectée avec succès`);
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`⚡ API: http://${HOST}:${PORT}/api`);
    console.log(`✨ Vite: http://${HOST}:${PORT}`);
  });
}

createServer().catch(err => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});