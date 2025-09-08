
import { z } from 'zod';

// Schémas de base sécurisés
export const secureStringSchema = z.string()
  .min(1, 'Champ requis')
  .max(1000, 'Trop long')
  .regex(/^[^<>\"'&]*$/, 'Caractères dangereux détectés');

export const secureEmailSchema = z.string()
  .email('Email invalide')
  .max(254, 'Email trop long')
  .toLowerCase();

export const securePasswordSchema = z.string()
  .min(8, 'Minimum 8 caractères')
  .max(128, 'Maximum 128 caractères')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Doit contenir majuscule, minuscule, chiffre et caractère spécial');

export const secureIdSchema = z.union([
  z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
  z.number().int().positive('ID doit être positif')
]);

// Schémas métier sécurisés
export const userSchema = z.object({
  email: secureEmailSchema,
  firstName: secureStringSchema.max(50),
  lastName: secureStringSchema.max(50),
  phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,}$/).optional(),
  role: z.enum(['customer', 'staff', 'manager', 'admin'])
});

export const menuItemSchema = z.object({
  name: secureStringSchema.max(100),
  description: secureStringSchema.max(500),
  price: z.number().positive().max(999.99),
  categoryId: secureIdSchema,
  isAvailable: z.boolean(),
  allergens: z.array(secureStringSchema.max(50)).max(20)
});

export const reservationSchema = z.object({
  customerId: secureIdSchema,
  tableId: secureIdSchema,
  date: z.string().datetime(),
  partySize: z.number().int().min(1).max(20),
  notes: secureStringSchema.max(500).optional()
});

export const orderSchema = z.object({
  customerId: secureIdSchema,
  items: z.array(z.object({
    menuItemId: secureIdSchema,
    quantity: z.number().int().min(1).max(10),
    modifications: z.array(secureStringSchema.max(100)).max(5).optional()
  })).min(1).max(50),
  notes: secureStringSchema.max(500).optional()
});

// Validation de sécurité pour les uploads
export const fileUploadSchema = z.object({
  filename: z.string().regex(/^[a-zA-Z0-9._-]+$/, 'Nom de fichier invalide'),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024, 'Fichier trop volumineux (max 5MB)')
});

// Middleware de validation sécurisé
export const secureValidation = {
  sanitizeHtml: (str: string): string => {
    return str.replace(/<[^>]*>/g, '').replace(/[<>&"']/g, '');
  },
  
  validateAndSanitize: <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`Validation échouée: ${result.error.message}`);
    }
    return result.data;
  }
};
