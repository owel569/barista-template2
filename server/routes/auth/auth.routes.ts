import { Router } from 'express';
import { authenticateUser, generateToken, hashPassword, comparePassword } from '../../middleware/auth';
import { validateBody, rateLimiter, LoginSchema, RegisterSchema } from '../../middleware/security';

const router = Router();

// Connexion - Rate limiting appliqué pour éviter les attaques par force brute
router.post('/login', rateLimiter(5, 15 * 60 * 1000), validateBody(LoginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // TODO: Remplacer par vraie vérification base de données
    // Pour l'instant, utilisateur de test
    if (username === 'admin' && password === 'admin123') {
      const user = {
        id: '1',
        username: 'admin',
        email: 'admin@barista.com',
        role: 'admin'
      };
      
      const token = generateToken(user);
      
      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          token,
          user
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
  } catch (error) {
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
    
    // TODO: Vérifier si l'utilisateur existe déjà
    // TODO: Sauvegarder en base de données
    
    const hashedPassword = await hashPassword(password);
    
    res.json({
      success: true,
      message: 'Inscription réussie'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// Vérification du token
router.get('/verify', authenticateUser, (req, res) => {
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