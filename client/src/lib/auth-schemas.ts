import { z } from 'zod';

// Constantes centralisées pour la validation du mot de passe
export const PASSWORD_VALIDATION = {
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  MIN_LENGTH: 8,
  MAX_LENGTH: 100,
  ERROR_MESSAGE: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
} as const;

const { REGEX: PASSWORD_REGEX, MIN_LENGTH: MIN_PASSWORD_LENGTH, MAX_LENGTH: MAX_PASSWORD_LENGTH } = PASSWORD_VALIDATION;

// Login form validation schema (sécurisé)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Veuillez entrer une adresse email valide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`)
});

// Registration form validation schema (sécurisé)
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Veuillez entrer une adresse email valide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`)
    .max(MAX_PASSWORD_LENGTH, `Le mot de passe ne peut pas dépasser ${MAX_PASSWORD_LENGTH} caractères`)
    .regex(PASSWORD_REGEX, PASSWORD_VALIDATION.ERROR_MESSAGE),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

// Types for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// User role validation - UNIFIÉ avec les 4 rôles
export const userRoleSchema = z.enum(['directeur', 'gerant', 'employe', 'customer'], {
  errorMap: () => ({ message: 'Le rôle doit être "directeur", "gerant", "employe" ou "customer"' })
});

// Type pour les rôles
export type UserRole = z.infer<typeof userRoleSchema>;

// Constantes pour les rôles
export const USER_ROLES = {
  DIRECTEUR: 'directeur' as const,
  GERANT: 'gerant' as const,
  EMPLOYE: 'employe' as const,
  CUSTOMER: 'customer' as const
} as const;

// Password change schema - UNIFIÉ avec les mêmes règles que l'inscription
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(1, 'Le nouveau mot de passe est requis')
    .min(MIN_PASSWORD_LENGTH, `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`)
    .max(MAX_PASSWORD_LENGTH, `Le mot de passe ne peut pas dépasser ${MAX_PASSWORD_LENGTH} caractères`)
    .regex(PASSWORD_REGEX, PASSWORD_VALIDATION.ERROR_MESSAGE),
  confirmNewPassword: z
    .string()
    .min(1, 'La confirmation du nouveau mot de passe est requise')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmNewPassword']
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;