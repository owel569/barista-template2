import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

// Import des routes modulaires
import authRoutes from './auth/auth.routes';
import userRoutes from './users/users.routes';
import menuRoutes from './menu/menu.routes';
import orderRoutes from './orders/orders.routes';
import analyticsRoutes from './analytics/analytics.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminRoutes from './admin/admin.routes';

const router = Router();

// Routes publiques
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes); // Menu public pour consultation

// Routes protégées
router.use('/users', authMiddleware, userRoutes);
router.use('/orders', authMiddleware, orderRoutes);
router.use('/analytics', authMiddleware, analyticsRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/admin', authMiddleware, adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route de test
router.get('/test', (req, res) => {
  res.json({
    message: 'API fonctionne correctement',
    timestamp: new Date().toISOString()
  });
});

export default router;