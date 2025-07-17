import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

// Import des routes
import { registerRoutes } from './routes/index';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import databaseRoutes from './routes/database.routes';

// Import des middlewares
import { errorHandler } from './middleware/error-handler';
import { requestLogger, logger } from './middleware/logger';
import { apiResponseValidator, errorResponseHandler } from './middleware/api-validator';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globaux
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middlewares professionnels
app.use(requestLogger);
app.use(apiResponseValidator);

// Middleware de base avec sécurité
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../dist/public')));

// Démarrage du serveur avec WebSocket
const startServer = async () => {
  try {
    // Configuration des routes principales
    const server = await registerRoutes(app);

    // Routes spécialisées
    app.use('/api/ai', aiRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/database', databaseRoutes);

    // Route de santé du serveur
    app.get('/api/health', (req: express.Request, res: express.Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: ['ai-automation', 'advanced-reports', 'real-time-analytics']
      });
    });

    // Gestion des routes frontend (SPA)
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });

    // Middlewares de gestion d'erreurs (ordre important)
    app.use(errorResponseHandler);
    app.use(errorHandler);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur Barista Café démarré sur le port ${PORT}`);
      console.log(`📊 Dashboard admin: http://localhost:${PORT}/admin`);
      console.log(`🤖 API IA disponible: http://localhost:${PORT}/api/ai`);
      console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
      console.log(`🔌 WebSocket disponible: ws://localhost:${PORT}/api/ws`);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Mode développement activé`);
        console.log(`📝 Logs détaillés activés`);
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur en cours...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur (Ctrl+C)...');
  process.exit(0);
});

export default app;