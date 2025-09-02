
import { z } from 'zod';

// Schémas de validation pour la logique métier
export const LoyaltyRewardSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(500),
  pointsCost: z.number().positive('Les points doivent être positifs').max(10000, 'Maximum 10000 points'),
  type: z.enum(['discount', 'free_item', 'special_offer']),
  category: z.string().optional(),
  available: z.boolean(),
  value: z.number().optional(),
  maxUsage: z.number().optional()
});

export const PointsAwardSchema = z.object({
  memberId: z.number().positive('ID membre invalide'),
  points: z.number().positive('Points doivent être positifs').max(1000, 'Maximum 1000 points par attribution'),
  reason: z.string().min(1, 'Raison requise').max(200, 'Raison trop longue')
});

// Validation des permissions
export const validatePermissions = (userRole: string, requiredPermissions: string[]): boolean => {
  const rolePermissions: Record<string, string[]> = {
    admin: ['all'],
    directeur: ['analytics', 'loyalty', 'reports', 'users'],
    employe: ['orders', 'reservations', 'basic_analytics']
  };

  if (rolePermissions[userRole]?.includes('all')) return true;
  
  return requiredPermissions.every(permission => 
    rolePermissions[userRole]?.includes(permission)
  );
};

// Sanitisation des données
export const sanitizeData = <T>(data: T): T => {
  if (typeof data === 'string') {
    return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as T;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized as T;
  }
  
  return data;
};
