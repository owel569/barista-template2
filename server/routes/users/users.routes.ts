import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const router = Router();

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));

    res.json({
      success: true,
      data: allUsers
    });

  } catch (error) {
    logger.error('Erreur récupération utilisateurs', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Créer un nouvel utilisateur
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName, role = 'employee' } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role
    }).returning({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role
    });

    res.status(201).json({
      success: true,
      data: newUser[0]
    });

  } catch (error) {
    logger.error('Erreur création utilisateur', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

export default router;