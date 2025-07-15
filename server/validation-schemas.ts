
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
