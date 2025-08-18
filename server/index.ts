import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index';

const app = express();
const PORT = 5000; // Backend sur port 5000, séparé du Vite sur port 3000

// CORS pour permettre les requêtes du frontend Vite (port 3000)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api', apiRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Barista Café fonctionne' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Barista Café démarrée sur http://localhost:${PORT}`);
  console.log(`🔌 Routes API disponibles sur http://localhost:${PORT}/api`);
});

process.on('SIGINT', () => {
  console.log('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

export default app;