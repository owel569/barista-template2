
import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

export const commonSchemas = {
  id: z.number().int().positive(),
  email: z.string()
    .email('Format d\'email invalide')
    .max(VALIDATION_RULES.EMAIL_MAX_LENGTH, 'Email trop long'),
  
  password: z.string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Mot de passe minimum ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caractères`)
    .regex(VALIDATION_RULES.PASSWORD_PATTERN, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  username: z.string()
    .min(VALIDATION_RULES.USERNAME_MIN_LENGTH, `Nom d'utilisateur minimum ${VALIDATION_RULES.USERNAME_MIN_LENGTH} caractères`)
    .max(VALIDATION_RULES.USERNAME_MAX_LENGTH, `Nom d'utilisateur maximum ${VALIDATION_RULES.USERNAME_MAX_LENGTH} caractères`)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nom d\'utilisateur invalide (lettres, chiffres, _ et - uniquement)'),
  
  phone: z.string()
    .regex(VALIDATION_RULES.PHONE_PATTERN, 'Format de téléphone invalide')
    .optional(),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
  
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  
  sortOrder: z.enum(['asc', 'desc']).default('asc')
};

export const createPaginationSchema = (sortFields: string[]) => {
  return z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    sortBy: z.enum(sortFields as [string, ...string[]]).optional(),
    sortOrder: commonSchemas.sortOrder
  });
};

export const createSearchSchema = (searchFields: string[]) => {
  return z.object({
    q: z.string().min(1, 'Terme de recherche requis'),
    fields: z.array(z.enum(searchFields as [string, ...string[]])).optional()
  });
};

export const validateEnum = <T extends Record<string, string>>(
  enumObject: T,
  message?: string
) => {
  const values = Object.values(enumObject) as [string, ...string[]];
  return z.enum(values, {
    errorMap: () => ({ message: message || `Valeur doit être l'une de: ${values.join(', ')}` })
  });
};

export const validateImageUrl = z.string()
  .url('URL d\'image invalide')
  .refine(
    (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url),
    'L\'URL doit pointer vers une image (jpg, jpeg, png, gif, webp)'
  );

export const validatePrice = z.number()
  .positive('Le prix doit être positif')
  .max(9999.99, 'Prix maximum dépassé')
  .multipleOf(0.01, 'Le prix doit avoir au maximum 2 décimales');

export const validateQuantity = z.number()
  .int('La quantité doit être un nombre entier')
  .positive('La quantité doit être positive')
  .max(1000, 'Quantité maximum dépassée');
