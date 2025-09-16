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
import reservationRoutes from './reservations/reservations.routes';
import tablesRoutes from './tables/tables.routes';
import feedbackRoutes from './feedback/feedback.routes';
import eventRoutes from './events.routes';
import inventoryRoutes from './inventory/inventory.routes';
import staffRoutes from './staff/staff.routes';
import routeDiagnostics from './route-diagnostics';
import notificationRoutes from './notifications/notifications.routes';
import galleryRoutes from './gallery.routes';

const router = Router();

// Routes publiques
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes); // Menu public pour consultation

// Routes protégées (nécessitent une authentification)
router.use('/users', userRoutes); // Authentification gérée dans les routes individuelles
router.use('/orders', orderRoutes); // Authentification gérée dans les routes individuelles
router.use('/analytics', analyticsRoutes); // Authentification gérée dans les routes individuelles
router.use('/dashboard', dashboardRoutes); // Authentification gérée dans les routes individuelles
router.use('/admin', adminRoutes); // Authentification gérée dans les routes individuelles
router.use('/delivery', deliveryRoutes); // Authentification gérée dans les routes individuelles
router.use('/tables', tablesRoutes); // Authentification gérée dans les routes individuelles
router.use('/events', eventRoutes); // Authentification gérée dans les routes individuelles
router.use('/inventory', inventoryRoutes); // Authentification gérée dans les routes individuelles
router.use('/staff', staffRoutes); // Authentification gérée dans les routes individuelles

// Routes avec authentification mixte (certaines publiques, certaines protégées)
router.use('/reservations', reservationRoutes); // POST public, GET/PUT/DELETE protégées
router.use('/feedback', feedbackRoutes); // POST public, GET/DELETE protégées
router.use('/notifications', notificationRoutes); // Route pour les notifications

// Routes spécialisées
  router.use('/analytics', analyticsRoutes);
  router.use('/dashboard', dashboardRoutes);
  router.use('/feedback', feedbackRoutes);
  router.use('/gallery', galleryRoutes);
  router.use('/inventory', inventoryRoutes);
  router.use('/menu', menuRoutes);
  router.use('/notifications', notificationRoutes);
  router.use('/orders', orderRoutes);
  router.use('/reservations', reservationRoutes);
  router.use('/staff', staffRoutes);
  router.use('/tables', tablesRoutes);
  router.use('/users', userRoutes);

// Route de diagnostic
router.use('/diagnostics', routeDiagnostics);

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