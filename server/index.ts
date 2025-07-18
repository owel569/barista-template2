import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from './middleware/logging';
import { requestLogger } from './middleware/logging';
import { errorHandler } from './middleware/error-handler';

// Routes
import apiRoutes from './routes/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const logger = createLogger('SERVER');

// Configuration CORS optimisée
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares globaux
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Servir les fichiers statiques
app.use('/images', express.static(path.join(__dirname, '../client/src/assets')));
app.use(express.static(path.join(__dirname, '../dist/public')));

// Routes API
app.use('/api', apiRoutes);

// Route pour servir l'app React
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error('Erreur lors du service du fichier index.html', { error: err.message });
      res.status(500).send('Erreur serveur');
    }
  });
});

// Middleware de gestion d'erreurs (doit être en dernier)
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Serveur Barista Café démarré sur le port ${PORT}`);
  logger.info(`📊 Dashboard admin: http://localhost:${PORT}/admin`);
  logger.info(`🔌 API disponible: http://localhost:${PORT}/api`);
  logger.info(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
  logger.info(`🔧 Mode ${process.env.NODE_ENV || 'development'} activé`);

  if (process.env.NODE_ENV === 'development') {
    logger.info('📝 Logs détaillés activés');
  }
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

export default app;