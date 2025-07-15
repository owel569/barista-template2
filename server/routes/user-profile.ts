
import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';

const userProfileRouter = Router();

// Schéma de validation pour le profil utilisateur
const profileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone requis'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  birthDate: z.string().optional(),
  preferredLanguage: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean()
  }).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Nouveau mot de passe requis (minimum 6 caractères)'),
  confirmPassword: z.string().min(6, 'Confirmation du mot de passe requise')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

// Données simulées pour le profil utilisateur
const userProfiles = new Map([
  [1, {
    id: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    birthDate: '1990-05-15',
    preferredLanguage: 'fr',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]
]);

// Routes
userProfileRouter.get('/', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const profile = userProfiles.get(user.id);
  
  if (!profile) {
    return res.status(404).json({ message: 'Profil non trouvé' });
  }
  
  res.json(profile);
}));

userProfileRouter.put('/', validateBody(profileSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const existingProfile = userProfiles.get(user.id);
  
  if (!existingProfile) {
    return res.status(404).json({ message: 'Profil non trouvé' });
  }
  
  const updatedProfile = {
    ...existingProfile,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  userProfiles.set(user.id, updatedProfile);
  res.json(updatedProfile);
}));

userProfileRouter.put('/password', validateBody(passwordSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;
  
  // Ici, vous devriez vérifier le mot de passe actuel contre la base de données
  // Pour la simulation, on accepte tous les changements
  
  res.json({ message: 'Mot de passe mis à jour avec succès' });
}));

userProfileRouter.get('/orders', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Simuler l'historique des commandes
  const orders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      date: '2024-01-15',
      total: 25.50,
      status: 'delivered',
      items: [
        { name: 'Cappuccino', quantity: 2, price: 7.00 },
        { name: 'Croissant', quantity: 1, price: 2.80 }
      ]
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      date: '2024-01-20',
      total: 18.75,
      status: 'delivered',
      items: [
        { name: 'Latte', quantity: 1, price: 4.50 },
        { name: 'Sandwich Club', quantity: 1, price: 8.50 }
      ]
    }
  ];
  
  res.json(orders);
}));

userProfileRouter.get('/reservations', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Simuler l'historique des réservations
  const reservations = [
    {
      id: 1,
      date: '2024-01-25',
      time: '19:30',
      partySize: 4,
      tableNumber: 5,
      status: 'confirmed',
      notes: 'Anniversaire'
    },
    {
      id: 2,
      date: '2024-01-30',
      time: '20:00',
      partySize: 2,
      tableNumber: 2,
      status: 'completed',
      notes: ''
    }
  ];
  
  res.json(reservations);
}));

userProfileRouter.get('/loyalty', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Simuler les données de fidélité
  const loyaltyData = {
    points: 250,
    level: 'Silver',
    nextLevelPoints: 500,
    pointsToNextLevel: 250,
    totalSpent: 125.50,
    visitsThisMonth: 8,
    favoriteItems: [
      { name: 'Cappuccino', orderCount: 15 },
      { name: 'Croissant', orderCount: 8 }
    ],
    availableRewards: [
      { id: 1, name: 'Café gratuit', pointsCost: 100 },
      { id: 2, name: 'Réduction 20%', pointsCost: 200 }
    ]
  };
  
  res.json(loyaltyData);
}));

userProfileRouter.post('/loyalty/redeem', validateBody(z.object({ rewardId: z.number() })), asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { rewardId } = req.body;
  
  // Simuler la récupération d'une récompense
  res.json({ 
    message: 'Récompense récupérée avec succès',
    rewardId,
    pointsUsed: 100,
    remainingPoints: 150
  });
}));

userProfileRouter.get('/preferences', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Simuler les préférences utilisateur
  const preferences = {
    theme: 'light',
    language: 'fr',
    currency: 'EUR',
    notifications: {
      orderUpdates: true,
      promotions: false,
      newMenuItems: true
    },
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      lactoseFree: false
    }
  };
  
  res.json(preferences);
}));

userProfileRouter.put('/preferences', validateBody(z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  notifications: z.object({
    orderUpdates: z.boolean(),
    promotions: z.boolean(),
    newMenuItems: z.boolean()
  }).optional(),
  dietary: z.object({
    vegetarian: z.boolean(),
    vegan: z.boolean(),
    glutenFree: z.boolean(),
    lactoseFree: z.boolean()
  }).optional()
})), asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Simuler la mise à jour des préférences
  res.json({ 
    message: 'Préférences mises à jour avec succès',
    preferences: req.body
  });
}));

export { userProfileRouter };
