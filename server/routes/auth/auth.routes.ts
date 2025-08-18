import { Router } from 'express';
import { authenticateUser, generateToken, hashPassword, comparePassword } from '../../middleware/auth';

const router = Router();

// Connexion
router.post('/login', async (req, res) => {
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
        token,
        user
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

// Inscription
router.post('/register', async (req, res) => {
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