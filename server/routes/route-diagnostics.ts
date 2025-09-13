
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Route de diagnostic pour vérifier toutes les routes disponibles
router.get('/routes-status', authenticateUser, (req, res) => {
  const routes = {
    public: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/menu (public)'
    ],
    authenticated: [
      'GET /api/users',
      'GET /api/orders',
      'GET /api/analytics',
      'GET /api/dashboard',
      'GET /api/admin',
      'GET /api/delivery',
      'GET /api/tables',
      'GET /api/events',
      'GET /api/inventory',
      'GET /api/staff'
    ],
    roleRestricted: {
      directeur: [
        'GET /api/admin/settings',
        'POST /api/admin/users',
        'DELETE /api/admin/users/:id'
      ],
      gerant: [
        'GET /api/analytics/advanced',
        'GET /api/admin/customers',
        'POST /api/admin/menu'
      ],
      employe: [
        'GET /api/orders',
        'POST /api/reservations',
        'GET /api/menu'
      ]
    }
  };

  res.json({
    success: true,
    user: {
      id: req.user?.id,
      role: req.user?.role,
      email: req.user?.email
    },
    routes,
    message: 'Diagnostic des routes réussi'
  });
});

// Route pour tester l'authentification
router.get('/auth-test', authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: 'Authentification réussie',
    user: {
      id: req.user?.id,
      role: req.user?.role,
      email: req.user?.email,
      permissions: req.user?.permissions
    }
  });
});

export default router;
