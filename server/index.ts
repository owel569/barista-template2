import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRoutes from './routes/index';
import { wsManager } from './websocket';
import { 
  errorHandler, 
  notFoundHandler,
  handleUncaughtErrors as setupUncaughtExceptionHandlers
} from './middleware/error-handler-enhanced';
import { createApiResponse } from './utils/response';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startApplication() {
  const app = express();

  // 0. Configuration de la gestion d'erreurs globale
  setupUncaughtExceptionHandlers();

  // 1. Middlewares de sécurité et utilitaires
  
  app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour le développement
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(compression());
  
  if (process.env.NODE_ENV !== 'production') {
    app.use(cors({
      origin: true,
      credentials: true,
    }));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 1. Créer le serveur Vite en mode middleware avec configuration optimisée pour Replit
  const isReplit = process.env.REPL_ID !== undefined;
  const viteConfig = {
    server: {
      middlewareMode: true,
      allowedHosts: true,
      ...(isReplit ? {
        hmr: false,
        ws: false
      } : {
        hmr: { 
          port: 24678,
          clientPort: 24678 
        }
      })
    },
    root: path.resolve(__dirname, '../client'),
    appType: 'spa',
    logLevel: isReplit ? 'error' : 'warn', // Moins de logs sur Replit
    clearScreen: false,
    define: {
      __HMR__: !isReplit // Désactiver complètement HMR sur Replit
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  } as any; // Type assertion pour éviter les problèmes de type complexes

  const vite = await createViteServer(viteConfig);

  // 2. Routes API (avant Vite pour éviter l'interception)
  app.use('/api', apiRoutes);

  // Health check endpoint pour Replit
  app.get('/health', (req, res) => {
    const requestId = (req as any).requestId || 'unknown';
    res.status(200).json(createApiResponse(
      true,
      {
        status: 'OK',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      undefined,
      'Service en ligne',
      requestId
    ));
  });

  // 3. Vite middleware (après les routes API)
  app.use(vite.middlewares);

  // 4. Middleware pour les erreurs 404 des routes API
  app.use('/api/*', notFoundHandler);

  // 5. Gestion des routes SPA
  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;

      // Ne pas interférer avec les routes API
      if (url.startsWith('/api')) {
        return next();
      }

      // Servir l'application React principale via Vite
      const html = await vite.transformIndexHtml(url, `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Barista Café</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
      `);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error('Error serving SPA:', e);
      res.status(500).end((e as Error).message);
    }
  });

  // 6. Middleware de gestion d'erreurs (doit être en dernier)
  app.use(errorHandler);

  // 7. Créer le serveur HTTP et initialiser WebSocket
  const httpServer = createServer(app);
  
  // Initialiser WebSocket sur le même serveur
  wsManager.initialize(httpServer);

  // 8. Démarrer le serveur
  httpServer.listen(PORT, HOST, () => {
    console.log(`✅ Serveur démarré avec succès`);
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`⚡ API: http://${HOST}:${PORT}/api`);
    console.log(`✨ Vite: http://${HOST}:${PORT}`);
    console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);
    console.log(`❤️ Health: http://${HOST}:${PORT}/health`);
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.log('🔄 Attempting to kill existing processes and retry...');
      
      // Try to kill existing process on the port
      const { exec } = require('child_process');
      exec(`lsof -ti:${PORT} | xargs kill -9`, (error: Error | null) => {
        if (!error) {
          console.log('✅ Killed existing process, retrying...');
          setTimeout(() => {
            httpServer.listen(PORT, HOST, () => {
              console.log(`✅ Serveur démarré avec succès (retry)`);
              console.log(`🚀 Server running on http://${HOST}:${PORT}`);
              console.log(`⚡ API: http://${HOST}:${PORT}/api`);
              console.log(`✨ Vite: http://${HOST}:${PORT}`);
              console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);
              console.log(`❤️ Health: http://${HOST}:${PORT}/health`);
            });
          }, 1000);
        } else {
          console.error('❌ Could not kill existing process');
          process.exit(1);
        }
      });
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });

  return httpServer;
}

startApplication().catch(err => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});