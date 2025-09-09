import { Router, Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { requireRoleHierarchy } from '../../middleware/security';
import { validateBody } from '../../middleware/security';
import { db } from '../../db';
import { customers } from '../../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const CustomerCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().max(100),
  phone: z.string().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  preferences: z.any().optional()
});

const CustomerUpdateSchema = CustomerCreateSchema.partial();

// GET /api/admin/customers - Récupérer tous les clients
router.get('/', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const allCustomers = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));

    res.json({
      success: true,
      data: allCustomers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
});

// POST /api/admin/customers - Créer un nouveau client
router.post('/', authenticateUser, requireRoleHierarchy('staff'), validateBody(CustomerCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const customerData = req.body;

    const [newCustomer] = await db
      .insert(customers)
      .values(customerData)
      .returning();

    res.status(201).json({
      success: true,
      data: newCustomer,
      message: 'Client créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du client'
    });
  }
});

// GET /api/admin/customers/:id - Récupérer un client spécifique
router.get('/:id', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID du client requis'
      });
      return;
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client'
    });
  }
});

// PUT /api/admin/customers/:id - Mettre à jour un client
router.put('/:id', authenticateUser, requireRoleHierarchy('staff'), validateBody(CustomerUpdateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID du client requis'
      });
      return;
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (!updatedCustomer) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Client mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du client'
    });
  }
});

// DELETE /api/admin/customers/:id - Supprimer un client
router.delete('/:id', authenticateUser, requireRoleHierarchy('manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID du client requis'
      });
      return;
    }

    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (!deletedCustomer) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client'
    });
  }
});

// GET /api/admin/customers/stats - Statistiques des clients
router.get('/stats/overview', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      topCustomers
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customers),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.isActive, true)),
      db.select().from(customers).orderBy(desc(customers.loyaltyPoints)).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        total: totalCustomers[0]?.count || 0,
        active: activeCustomers[0]?.count || 0,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;