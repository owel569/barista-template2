import { Router } from 'express';

const router = Router();

// Récupérer le profil utilisateur
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;
    
    // TODO: Récupérer depuis la base de données
    const userProfile = {
      id: user?.id,
      username: user?.username,
      email: 'user@example.com',
      role: user?.role,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// Mettre à jour le profil utilisateur
router.put('/profile', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // TODO: Valider et mettre à jour en base de données
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Récupérer tous les utilisateurs (admin uniquement)
router.get('/', async (req, res) => {
  try {
    // TODO: Vérifier le rôle admin
    // TODO: Récupérer depuis la base de données
    
    const users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@restaurant.com',
        role: 'admin',
        active: true
      },
      {
        id: '2',
        username: 'staff1',
        email: 'staff1@restaurant.com',
        role: 'staff',
        active: true
      }
    ];
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

export default router;