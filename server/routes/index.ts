import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';

// Import des routes modulaires
import authRoutes from './auth/auth.routes';
import userRoutes from './users/users.routes';
import menuRoutes from './menu/menu.routes';
import orderRoutes from './orders/orders.routes';
import analyticsRoutes from './analytics/analytics.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminRoutes from './admin/admin.routes';
import deliveryRoutes from './delivery';
import reservationRoutes from './reservations';
import tableRoutes from './tables';
import feedbackRoutes from './feedback.routes';
import eventRoutes from './events.routes';

const router = Router();

// Routes publiques
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes); // Menu public pour consultation

// Routes protégées
router.use('/users', authenticateUser, userRoutes);
router.use('/orders', authenticateUser, orderRoutes);
router.use('/analytics', authenticateUser, analyticsRoutes);
router.use('/dashboard', authenticateUser, dashboardRoutes);
router.use('/admin', authenticateUser, adminRoutes);
router.use('/delivery', authenticateUser, deliveryRoutes);
router.use('/tables', authenticateUser, tableRoutes);
router.use('/events', authenticateUser, eventRoutes);

// Routes semi-publiques (certaines routes publiques, d'autres protégées)
router.use('/reservations', reservationRoutes);
router.use('/feedback', feedbackRoutes);

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