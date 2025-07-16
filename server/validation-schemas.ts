
import { z } from 'zod';

// Schémas d'authentification
export const loginSchema = z.object({
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email('Email invalide').optional(),
  password: z.string().min(6),
  role: z.enum(['directeur', 'employe']).default('employe')
});

// Schémas pour les réservations
export const reservationSchema = z.object({
  customerName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  customerEmail: z.string().email('Email invalide'),
  customerPhone: z.string().min(10, 'Numéro de téléphone invalide'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
  partySize: z.number().min(1).max(20),
  tableId: z.number().positive().optional(),
  notes: z.string().max(500).optional()
});

// Schémas pour les clients
export const customerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().optional(),
  loyaltyPoints: z.number().min(0).default(0),
  totalSpent: z.number().min(0).default(0)
});

// Schémas pour les employés
export const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  position: z.string().min(2),
  department: z.string().min(2),
  salary: z.number().positive().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Schémas pour le menu
export const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  categoryId: z.number().positive(),
  available: z.boolean().default(true),
  imageUrl: z.string().url().optional()
});

// Schémas pour les événements
export const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
  location: z.string().min(5, 'La localisation doit contenir au moins 5 caractères'),
  maxAttendees: z.number().positive().optional(),
  price: z.number().min(0).optional(),
  type: z.enum(['workshop', 'tasting', 'event', 'promotion']),
  tags: z.array(z.string()).optional()
});

// Schémas pour l'inventaire
export const inventoryItemSchema = z.object({
  name: z.string().min(2),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  minThreshold: z.number().min(0),
  cost: z.number().min(0),
  supplier: z.string().min(2),
  category: z.string().min(2).optional()
});

// Schémas pour les promotions
export const promotionSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['percentage', 'fixed_amount', 'loyalty_points']),
  discountValue: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usageLimit: z.number().positive().optional(),
  customerSegment: z.enum(['all', 'vip', 'new', 'regular']).default('all'),
  applicableItems: z.array(z.string()).optional()
});

// Schémas pour les tâches de maintenance
export const maintenanceTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  equipmentId: z.number().positive(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['preventive', 'corrective', 'emergency']),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estimatedCost: z.number().min(0).optional(),
  assignedTo: z.string().min(2).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('none')
});

// Schémas pour les équipements
export const equipmentSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  brand: z.string().min(2),
  model: z.string().min(2),
  serialNumber: z.string().min(3),
  location: z.string().min(2),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purchasePrice: z.number().positive(),
  warrantyExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  supplier: z.string().min(2),
  specifications: z.record(z.string()).optional()
});

// Schémas pour les transactions comptables
export const transactionSchema = z.object({
  type: z.enum(['recette', 'dépense']),
  category: z.string().min(2),
  amount: z.number().positive(),
  description: z.string().min(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']).optional(),
  reference: z.string().optional()
});

// Schémas pour les fournisseurs
export const supplierSchema = z.object({
  name: z.string().min(2),
  contact: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(10).optional(),
  category: z.string().min(2),
  paymentTerms: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional()
});

// Schémas pour les campagnes marketing
export const campaignSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['email', 'sms', 'social', 'print']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budget: z.number().min(0),
  targetAudience: z.string().min(5),
  objectives: z.array(z.string()).optional()
});
