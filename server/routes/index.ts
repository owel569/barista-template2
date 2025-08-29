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
import tablesRouter from './tables/tables.routes';
import feedbackRoutes from './feedback/feedback.routes';
import eventRoutes from './events.routes';
import inventoryRoutes from './inventory/inventory.routes';

const router = Router();

// Routes publiques
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes); // Menu public pour consultation

// Routes protégées (nécessitent une authentification)
// router.use('/users', authenticateUser, userRoutes);
// router.use('/orders', authenticateUser, orderRoutes);
// router.use('/analytics', authenticateUser, analyticsRoutes);
// router.use('/dashboard', authenticateUser, dashboardRoutes);
// router.use('/admin', authenticateUser, adminRoutes);
// router.use('/delivery', authenticateUser, deliveryRoutes);
// router.use('/tables', authenticateUser, tablesRouter);
// router.use('/events', authenticateUser, eventRoutes);
router.use('/inventory', authenticateUser, inventoryRoutes);

// Routes avec authentification mixte (certaines publiques, certaines protégées)
router.use('/reservations', reservationRoutes); // POST public, GET/PUT/DELETE protégées
router.use('/feedback', feedbackRoutes); // POST public, GET/DELETE protégées

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