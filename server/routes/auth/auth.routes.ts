import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const router = Router();

// Connexion utilisateur
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user[0].password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user[0].id,
        email: user[0].email,
        role: user[0].role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
          role: user[0].role,
          firstName: user[0].firstName,
          lastName: user[0].lastName
        }
      }
    });

  } catch (error) {
    logger.error('Erreur login', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Vérification du token
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requis'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
          role: user[0].role,
          firstName: user[0].firstName,
          lastName: user[0].lastName
        }
      }
    });

  } catch (error) {
    logger.error('Erreur vérification token', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

export default router;