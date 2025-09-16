import { z } from 'zod';
export const customerCreateSchema = z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    address: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    notes: z.string().max(500).optional(),
});
export const reservationCreateSchema = z.object({
    customerName: z.string().min(2).max(100),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(10).max(20),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    partySize: z.number().int().min(1).max(20),
    tableId: z.number().int().positive().optional(),
    notes: z.string().max(500).optional(),
    specialRequests: z.string().max(500).optional(),
});
export const menuItemCreateSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    price: z.number().positive(),
    categoryId: z.number().int().positive(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().default(true),
    isVegetarian: z.boolean().default(false),
    isVegan: z.boolean().default(false),
    isGlutenFree: z.boolean().default(false),
    allergens: z.array(z.string()).default([]),
    ingredients: z.array(z.string()).optional(),
    preparationTime: z.number().int().positive().optional(),
    calories: z.number().int().positive().optional(),
    spicyLevel: z.number().int().min(1).max(5).optional(),
});
export const SECURITY_CONSTANTS = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_TIMEOUT_MINUTES: 15,
    TOKEN_EXPIRY_HOURS: 24,
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT_MINUTES: 60,
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};
export const VALIDATION_MESSAGES = {
    REQUIRED: 'Ce champ est requis',
    EMAIL_INVALID: 'Adresse email invalide',
    PHONE_INVALID: 'Numéro de téléphone invalide',
    PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères',
    NAME_TOO_SHORT: 'Le nom doit contenir au moins 2 caractères',
    PRICE_INVALID: 'Le prix doit être un nombre positif',
    QUANTITY_INVALID: 'La quantité doit être un nombre entier positif',
};
