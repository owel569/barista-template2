import { Router } from 'express';
import { z } from 'zod';

const userProfileRouter = Router();

// Mock user profile data
let userProfile = {
  id: 1,
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@email.com',
  phone: '+33612345678',
  address: '123 Rue de la Paix, 75001 Paris',
  birthday: '1985-06-15',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  loyaltyPoints: 450,
  loyaltyLevel: 'Fidèle',
  totalSpent: 285.50,
  orderCount: 23,
  favoriteItems: [
    { id: 1, name: 'Cappuccino Premium', orderCount: 8 },
    { id: 2, name: 'Croissant Artisanal', orderCount: 5 },
    { id: 3, name: 'Latte Art', orderCount: 4 }
  ],
  recentOrders: [
    {
      id: 101,
      date: '2024-07-08T14:30:00Z',
      total: 12.40,
      status: 'delivered'
    },
    {
      id: 100,
      date: '2024-07-05T09:15:00Z',
      total: 8.60,
      status: 'delivered'
    },
    {
      id: 99,
      date: '2024-07-03T16:45:00Z',
      total: 15.20,
      status: 'delivered'
    }
  ],
  preferences: {
    notifications: true,
    newsletter: true,
    promotions: false
  }
};

// Get user profile
userProfileRouter.get('/profile', (req, res) => {
  res.json(userProfile);
});

// Update user profile
userProfileRouter.patch('/profile', (req, res) => {
  const updates = req.body;
  
  // Validate the updates
  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'birthday'];
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});
  
  userProfile = { ...userProfile, ...filteredUpdates };
  res.json(userProfile);
});

// Change password
userProfileRouter.patch('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // In a real app, you would verify the current password
  // and hash the new password before saving
  
  // For demo purposes, we'll just return success
  res.json({ message: 'Mot de passe modifié avec succès' });
});

// Update preferences
userProfileRouter.patch('/preferences', (req, res) => {
  const { preferences } = req.body;
  
  userProfile.preferences = { ...userProfile.preferences, ...preferences };
  res.json(userProfile.preferences);
});

// Delete account
userProfileRouter.delete('/account', (req, res) => {
  // In a real app, you would:
  // 1. Verify user authentication
  // 2. Delete all user data
  // 3. Invalidate sessions
  // 4. Send confirmation email
  
  res.json({ message: 'Compte supprimé avec succès' });
});

// Get user's favorite items
userProfileRouter.get('/favorites', (req, res) => {
  res.json(userProfile.favoriteItems);
});

// Add item to favorites
userProfileRouter.post('/favorites', (req, res) => {
  const { itemId, itemName } = req.body;
  
  const existingFavorite = userProfile.favoriteItems.find(fav => fav.id === itemId);
  
  if (existingFavorite) {
    existingFavorite.orderCount += 1;
  } else {
    userProfile.favoriteItems.push({
      id: itemId,
      name: itemName,
      orderCount: 1
    });
  }
  
  res.json(userProfile.favoriteItems);
});

// Remove item from favorites
userProfileRouter.delete('/favorites/:itemId', (req, res) => {
  const { itemId } = req.params;
  
  userProfile.favoriteItems = userProfile.favoriteItems.filter(
    fav => fav.id !== parseInt(itemId)
  );
  
  res.json(userProfile.favoriteItems);
});

// Get user's order history
userProfileRouter.get('/orders', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  
  const paginatedOrders = userProfile.recentOrders.slice(startIndex, endIndex);
  
  res.json({
    orders: paginatedOrders,
    total: userProfile.recentOrders.length,
    page: Number(page),
    totalPages: Math.ceil(userProfile.recentOrders.length / Number(limit))
  });
});

// Get loyalty program details
userProfileRouter.get('/loyalty', (req, res) => {
  const loyaltyLevels = [
    { name: 'Nouveau', minPoints: 0, benefits: ['Accès aux promotions de base'] },
    { name: 'Régulier', minPoints: 100, benefits: ['5% de réduction', 'Offres exclusives'] },
    { name: 'Fidèle', minPoints: 300, benefits: ['10% de réduction', 'Livraison gratuite', 'Accès prioritaire'] },
    { name: 'VIP', minPoints: 500, benefits: ['15% de réduction', 'Cadeaux exclusifs', 'Service personnalisé'] }
  ];
  
  const currentLevel = loyaltyLevels.find(level => level.name === userProfile.loyaltyLevel);
  const nextLevel = loyaltyLevels.find(level => level.minPoints > userProfile.loyaltyPoints);
  
  res.json({
    currentPoints: userProfile.loyaltyPoints,
    currentLevel,
    nextLevel,
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - userProfile.loyaltyPoints : 0,
    allLevels: loyaltyLevels
  });
});

export { userProfileRouter };