
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';

const router = Router();
const logger = createLogger('RESERVATIONS_ROUTES');

// Schémas de validation
const ReservationSchema = z.object({
  customerName: z.string().min(2, 'Nom requis'),
  customerEmail: z.string().email('Email valide requis'),
  customerPhone: z.string().min(8, 'Téléphone requis'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
  partySize: z.number().min(1).max(12, 'Taille de groupe entre 1 et 12'),
  specialRequests: z.string().optional(),
  tablePreference: z.string().optional()
});

const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
});

// Données temporaires (remplacer par BDD)
let reservations = [
  {
    id: '1',
    customerName: 'Marie Dubois',
    customerEmail: 'marie@example.com',
    customerPhone: '01 23 45 67 89',
    date: '2024-01-20',
    time: '19:30',
    partySize: 4,
    status: 'confirmed',
    tableId: 'table-5',
    specialRequests: 'Allergique aux fruits de mer',
    confirmationCode: 'RES-001',
    createdAt: new Date().toISOString()
  }
];

// Routes publiques pour les clients
router.post('/', 
  validateBody(ReservationSchema),
  asyncHandler(async (req, res) => {
    try {
      const newReservation = {
        id: (reservations.length + 1).toString(),
        ...req.body,
        status: 'pending',
        confirmationCode: `RES-${String(reservations.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString()
      };

      reservations.push(newReservation);

      logger.info('Nouvelle réservation créée', { 
        id: newReservation.id,
        customerName: newReservation.customerName,
        date: newReservation.date
      });

      res.status(201).json({
        success: true,
        data: newReservation,
        message: 'Réservation créée avec succès'
      });
    } catch (error) {
      logger.error('Erreur création réservation', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      res.status(500).json({
        success: false,
        error: 'RESERVATION_CREATE_ERROR',
        message: 'Erreur lors de la création de la réservation'
      });
    }
  })
);

// Vérifier disponibilité (public)
router.get('/availability',
  validateQuery(z.object({
    date: z.string(),
    time: z.string(),
    partySize: z.string().transform(Number)
  })),
  asyncHandler(async (req, res) => {
    try {
      const { date, time, partySize } = req.query;
      
      // Logique de vérification de disponibilité
      const isAvailable = true; // TODO: Implémenter la logique réelle

      res.json({
        success: true,
        data: {
          available: isAvailable,
          date,
          time,
          partySize,
          suggestedTimes: ['18:30', '19:00', '20:00', '20:30']
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de disponibilité'
      });
    }
  })
);

// Routes protégées pour le staff
router.get('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  asyncHandler(async (req, res) => {
    try {
      res.json({
        success: true,
        data: reservations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des réservations'
      });
    }
  })
);

router.patch('/:id/status',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string() })),
  validateBody(UpdateStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const reservation = reservations.find(r => r.id === id);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      reservation.status = status;

      logger.info('Statut réservation mis à jour', { id, status });

      res.json({
        success: true,
        data: reservation,
        message: 'Statut mis à jour avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour'
      });
    }
  })
);

export default router;
