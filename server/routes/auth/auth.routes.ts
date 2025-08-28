import { Router } from 'express';
import { authenticateUser, generateToken, hashPassword, comparePassword } from '../../middleware/auth';
import { validateBody, rateLimiter, LoginSchema, RegisterSchema } from '../../middleware/security';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const router = Router();

// Connexion - Rate limiting appliqué pour éviter les attaques par force brute
router.post('/login', rateLimiter(5, 15 * 60 * 1000), validateBody(LoginSchema), async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // Rechercher l'utilisateur dans la base de données
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Créer le payload utilisateur (sans le mot de passe)
    const userPayload = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    const token = generateToken(userPayload);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userPayload
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Inscription - Rate limiting pour éviter le spam
router.post('/register', rateLimiter(3, 60 * 60 * 1000), validateBody(RegisterSchema), async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cet utilisateur existe déjà'
      });
    }
    
    // Vérifier si l'email existe déjà
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      firstName: 'Utilisateur',
      lastName: 'Nouveau',
      role: 'user'
    });
    
    res.json({
      success: true,
      message: 'Inscription réussie'
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// Vérification du token
router.get('/verify', authenticateUser, (req, res): void => {
  res.json({
    success: true,
    user: req.user
  });
});

// Déconnexion
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

export default router;