import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
// Temporary logger replacement
const logger = {
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta)
};

const router = Router();

// Connexion utilisateur
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, password: password?.substring(0, 3) + '...' });

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
    
    console.log('User found:', user.length > 0, user[0]?.email);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const foundUser = user[0];
    console.log('Found user password hash:', foundUser.password?.substring(0, 10) + '...');
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
          role: foundUser.role,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName
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

    const userInfo = user[0];
    res.json({
      success: true,
      data: {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          username: userInfo.username,
          role: userInfo.role,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
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