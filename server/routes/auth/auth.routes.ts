import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles, AuthService } from '../../middleware/auth';
import { validateBody, validateParams, commonSchemas } from '../../middleware/validation';
import { getDb } from '../../db';
import { users, customers, activityLogs } from '../../../shared/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { RateLimitError } from '../../middleware/error-handler-enhanced';

const router = Router();
const logger = createLogger('AUTH_ROUTES');

// Configuration JWT - uses AuthService for token generation
// JWT_SECRET is handled by AuthService

// Rate limiting simple en mémoire
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Schémas de validation
const RegisterSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)').max(50),
  lastName: z.string().min(2, 'Nom requis (min 2 caractères)').max(50),
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Mot de passe requis (min 8 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  phone: z.string().optional(),
  role: z.enum(['directeur', 'gerant', 'employe', 'customer']).default('customer')
});

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(8, 'Nouveau mot de passe requis (min 8 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
});

// Fonction utilitaire pour vérifier le rate limiting
function checkRateLimit(identifier: string): void {
  const now = new Date();
  const attempt = loginAttempts.get(identifier);

  if (attempt) {
    const timeDiff = now.getTime() - attempt.lastAttempt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1 && attempt.count >= 5) {
      throw new RateLimitError('Trop de tentatives de connexion. Réessayez dans 1 heure.');
    }

    if (hoursDiff >= 1) {
      loginAttempts.delete(identifier);
    }
  }
}

// Fonction utilitaire pour enregistrer une tentative
function recordLoginAttempt(identifier: string): void {
  const now = new Date();
  const attempt = loginAttempts.get(identifier);

  if (attempt) {
    attempt.count += 1;
    attempt.lastAttempt = now;
  } else {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
  }
}

// Use AuthService.generateToken for consistent JWT payload format
// This ensures { userId, email, role } payload format

// Fonction utilitaire pour enregistrer une activité
async function logActivity(
  userId: number,
  action: string,
  details: string,
  req: Request
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId,
      action,
      entity: 'auth',
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Route d'inscription
router.post('/register',
  validateBody(RegisterSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
      return; // Added return statement
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12);

    // Créer l'utilisateur
    const [newUser] = await db
      .insert(users)
      .values({
        username: email.split('@')[0],
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt
      });

    // Si c'est un client, créer aussi une entrée dans la table customers
    if (role === 'customer') {
      await db.insert(customers).values({
        firstName,
        lastName,
        email,
        phone
      });
    }

    if (!newUser) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte'
      });
      return; // Added return statement
    }

    // Générer le token
    const token = AuthService.generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    // Enregistrer l'activité
    await logActivity(newUser.id, 'REGISTER', 'Inscription utilisateur', req);

    logger.info('Utilisateur inscrit', {
      userId: newUser.id,
      email,
      role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token
      },
      message: 'Inscription réussie'
    });
  })
);

// Route de connexion
router.post('/login',
  validateBody(LoginSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { email, password } = req.body;

    // Vérifier le rate limiting
    checkRateLimit(email);

    // Trouver l'utilisateur
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        password: users.password,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.email, email));

    if (!user || user.isActive === false) {
      recordLoginAttempt(email);
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      recordLoginAttempt(email);
      await logActivity(user.id, 'LOGIN_FAILED', 'Mot de passe incorrect', req);

      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Supprimer les tentatives précédentes
    loginAttempts.delete(email);

    // Générer le token
    const token = AuthService.generateToken({ id: user.id, email: user.email, role: user.role });

    // Enregistrer l'activité
    await logActivity(user.id, 'LOGIN', 'Connexion utilisateur', req);

    logger.info('Utilisateur connecté', {
      userId: user.id,
      email,
      role: user.role,
      ip: req.ip
    });

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Connexion réussie'
    });
  })
);

// Route pour vérifier le token
router.get('/verify',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        firstName: req.user?.firstName,
        lastName: req.user?.lastName,
        isActive: req.user?.isActive
      },
      message: 'Token valide'
    });
  })
);

// Route pour rafraîchir le token
router.post('/refresh',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    const newToken = AuthService.generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    res.json({
      success: true,
      token: newToken,
      message: 'Token rafraîchi avec succès'
    });
  })
);

export default router;