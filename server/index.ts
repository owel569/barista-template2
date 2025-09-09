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

  // 1. Routes API (en premier pour éviter l'interception)
  app.use('/api', apiRoutes);

  // 2. Configuration Vite pour le développement
  if (process.env.NODE_ENV !== 'production') {
    const server = createServer(app);

    // Configuration WebSocket
    wsManager.setup(server);

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true
      },
      root: path.resolve(__dirname, '../client'),
      appType: 'spa',
      logLevel: 'info',
      clearScreen: false,
      optimizeDeps: {
        include: ['react', 'react-dom', 'lucide-react']
      }
    });

    app.use(vite.middlewares);

    // 3. Gestion des erreurs
    app.use(notFoundHandler);
    app.use(errorHandler);

    server.listen(PORT, HOST, () => {
      console.log(`✅ Serveur démarré avec succès`);
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`⚡ API: http://${HOST}:${PORT}/api`);
      console.log(`✨ Vite: http://${HOST}:${PORT}`);
      console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);
      console.log(`❤️ Health: http://${HOST}:${PORT}/health`);
    });
  } else {
    // Configuration production
    const server = createServer(app);
    wsManager.setup(server);

    app.use(notFoundHandler);
    app.use(errorHandler);

    server.listen(PORT, HOST, () => {
      console.log(`✅ Serveur démarré avec succès`);
      console.log(`🚀 Production server running on http://${HOST}:${PORT}`);
    });
  }
}

// Gestion des erreurs non capturées
function setupUncaughtExceptionHandlers() {
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

startApplication().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});