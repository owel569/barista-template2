import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des routes
import routes from './routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import des middlewares
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logging';

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
app.use(requestLogger);

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes API
app.use('/api', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Route de santé du serveur
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['ai-automation', 'advanced-reports', 'real-time-analytics']
  });
});

// Gestion des routes frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Barista Café démarré sur le port ${PORT}`);
  console.log(`📊 Dashboard admin: http://localhost:${PORT}/admin`);
  console.log(`🤖 API IA disponible: http://localhost:${PORT}/api/ai`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Mode développement activé`);
    console.log(`📝 Logs détaillés activés`);
  }
});

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