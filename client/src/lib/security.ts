/**
 * Utilitaires de sécurité pour les composants UI
 * Validation, sanitisation et protection contre les attaques courantes
 */

// Types pour la validation
export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: unknown
}

export interface SecurityConfig {
  maxLength?: number
  minLength?: number
  allowedChars?: RegExp
  forbidden?: string[]
  htmlSanitize?: boolean
}

/**
 * Sanitise une chaîne de caractères pour éviter les injections XSS
 */
export function sanitizeString(
  value: string, 
  config: SecurityConfig = {}
): string {
  if (typeof value !== 'string') {
    return ''
  }

  let sanitized = value

  // Suppression des caractères dangereux pour XSS
  if (config.htmlSanitize !== false) {
    sanitized = sanitized
      .replace(/[<>]/g, '') // Supprime les balises HTML basiques
      .replace(/javascript:/gi, '') // Supprime les URL javascript
      .replace(/on\w+\s*=/gi, '') // Supprime les handlers d'événements
      .replace(/data:\s*text\/html/gi, '') // Supprime les data URLs HTML
  }

  // Limitation de longueur
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.slice(0, config.maxLength)
  }

  // Validation des caractères autorisés
  if (config.allowedChars && !config.allowedChars.test(sanitized);{
    sanitized = sanitized.replace(config.allowedChars, '')
  }

  // Suppression des mots interdits
  if (config.forbidden) {
    config.forbidden.forEach(word => {
      const regex = new RegExp(word, 'gi')
      sanitized = sanitized.replace(regex, ''});}

  return sanitized.trim()
}

/**
 * Valide un email de manière sécurisée
 */
export function validateEmail(email: string): ValidationResult {
  const sanitized = sanitizeString(email, { maxLength: 254 })
  
  // RFC 5322 regex simplifié mais sécurisé
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(sanitized);{
    return {
      isValid: false,
      error: 'Format d\'email invalide'
    }
  }

  return {
    isValid: true,
    sanitized
  }
}

/**
 * Valide un numéro de téléphone
 */
export function validatePhone(phone: string): ValidationResult {
  const sanitized = sanitizeString(phone, { 
    allowedChars: /[0-9+\-\s()]/g,
    maxLength: 20 
  })
  
  // Regex pour formats internationaux basiques
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  const cleanPhone = sanitized.replace(/[\s\-()]/g, '')
  
  if (!phoneRegex.test(cleanPhone);{
    return {
      isValid: false,
      error: 'Format de téléphone invalide'
    }
  }

  return {
    isValid: true,
    sanitized: cleanPhone
  }
}

/**
 * Valide une URL de manière sécurisée
 */
export function validateUrl(url: string): ValidationResult {
  const sanitized = sanitizeString(url, { maxLength: 2048 })
  
  try {
    const urlObj = new URL(sanitized)
    
    // Protocoles autorisés
    const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:']
    if (!allowedProtocols.includes(urlObj.protocol);{
      return {
        isValid: false,
        error: 'Protocole non autorisé'
      }
    }

    // Vérification des domaines suspects
    const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0']
    if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain);{
      return {
        isValid: false,
        error: 'Domaine non autorisé'
      }
    }

    return {
      isValid: true,
      sanitized: urlObj.toString()
    }
  } catch {
    return {
      isValid: false,
      error: 'URL invalide'
    }
  }
}

/**
 * Valide et sanitise les données d'un formulaire
 */
export function validateFormData(
  data: Record<string, unknown>,
  schema: Record<string, SecurityConfig & { required?: boolean; type?: string }>
): { isValid: boolean; errors: Record<string, string>; sanitized: Record<string, unknown> } {
  const errors: Record<string, string> = {}
  const sanitized: Record<string, unknown> = {}

  for (const [key, config] of Object.entries(schema);{
    const value = data[key]

    // Vérification des champs requis
    if (config.required && (value === undefined || value === null || value === '');{
      errors[key] = 'Ce champ est requis'
      continue
    }

    // Skip si pas de valeur et pas requis
    if (!value && !config.required) {
      continue
    }

    // Validation selon le type
    switch (config.type) {
      case 'email':
        const emailResult = validateEmail(String(value);if (!emailResult.isValid) {
          errors[key] = emailResult.error!
        } else {
          sanitized[key] = emailResult.sanitized
        }
        break

      case 'phone':
        const phoneResult = validatePhone(String(value);if (!phoneResult.isValid) {
          errors[key] = phoneResult.error!
        } else {
          sanitized[key] = phoneResult.sanitized
        }
        break

      case 'url':
        const urlResult = validateUrl(String(value);if (!urlResult.isValid) {
          errors[key] = urlResult.error!
        } else {
          sanitized[key] = urlResult.sanitized
        }
        break

      case 'string':
      default:
        sanitized[key] = sanitizeString(String(value), config)
        
        // Validation de longueur
        if (config.minLength && String(sanitized[key]).length < config.minLength) {
          errors[key] = `Minimum ${config.minLength} caractères requis`
        }
        break
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  }
}

/**
 * Escape les caractères HTML pour éviter XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Génère un token CSRF sécurisé
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0');.join('')
}

/**
 * Valide un token CSRF
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false
  }
  
  // Comparaison en temps constant pour éviter les attaques de timing
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Limite le taux d'appels (rate limiting) côté client
 */
export function createRateLimiter(maxCalls: number, windowMs: number) {
  const calls: number[] = []
  
  return function rateLimiter(): boolean {
    const now = Date.now()
    
    // Supprime les appels anciens
    while (calls.length > 0 && calls[0] <= now - windowMs) {
      calls.shift()
    }
    
    // Vérifie la limite
    if (calls.length >= maxCalls) {
      return false
    }
    
    calls.push(now)
    return true
  }
}

/**
 * Debounce sécurisé pour éviter les appels excessifs
 */
export function secureDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  maxWait?: number
): T {
  let timeout: NodeJS.Timeout | null = null
  let maxTimeout: NodeJS.Timeout | null = null
  let lastCallTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    
    // Protection contre les appels trop fréquents
    if (now - lastCallTime < 10) { // Minimum 10ms entre les appels
      return
    }
    
    lastCallTime = now

    if (timeout) {
      clearTimeout(timeout)
    }
    
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        maxTimeout = null
        func(...args)
      }, maxWait)
    }

    timeout = setTimeout(() => {
      if (maxTimeout) {
        clearTimeout(maxTimeout)
        maxTimeout = null
      }
      timeout = null
      func(...args)
    }, wait});as T
}

/**
 * Constantes de sécurité
 */
export const SECURITY_LIMITS = {
  MAX_STRING_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_OBJECT_DEPTH: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEBOUNCE_DELAY: 300,
  RATE_LIMIT_CALLS: 100,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
} as const