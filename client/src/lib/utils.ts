import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { sanitizeString, SECURITY_LIMITS } from "./security"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une devise de manière sécurisée
 */
export function formatCurrency(
  amount: number | string, 
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  // Validation et sanitisation
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '0,00 €'
  }
  
  // Limitation des montants extrêmes pour éviter les problèmes
  const safeAmount = Math.max(-999999999, Math.min(999999999, numAmount))
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(safeAmount)
  } catch {
    // Fallback en cas d'erreur de formatage
    return `${safeAmount.toFixed(2)} ${currency}`
  }
}

/**
 * Formate une date de manière sécurisée
 */
export function formatDate(
  date: Date | string | number, 
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'fr-FR'
): string {
  let dateObj: Date
  
  try {
    if (typeof date === 'string') {
      // Sanitisation basique de la chaîne de date
      const sanitizedDate = sanitizeString(date, { maxLength: 50 })
      dateObj = new Date(sanitizedDate)
    } else if (typeof date === 'number') {
      // Validation du timestamp
      if (date < 0 || date > 8640000000000000) { // Limites JS Date
        throw new Error('Invalid timestamp')
      }
      dateObj = new Date(date)
    } else {
      dateObj = date
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date')
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch {
    return 'Date invalide'
  }
}

/**
 * Debounce sécurisé avec limitation
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = SECURITY_LIMITS.DEBOUNCE_DELAY
): T {
  let timeout: NodeJS.Timeout | undefined
  let lastCallTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    
    // Protection contre les appels trop fréquents
    if (now - lastCallTime < 10) {
      return
    }
    
    lastCallTime = now
    
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), Math.max(10, Math.min(5000, wait)))
  }) as T
}

/**
 * Génère un ID sécurisé et unique
 */
export function generateId(prefix: string = ''): string {
  // Sanitisation du préfixe
  const safePrefix = sanitizeString(prefix, { 
    maxLength: 20,
    allowedChars: /[a-zA-Z0-9-_]/g 
  })
  
  // Génération d'un ID cryptographiquement sécurisé
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  const randomString = Array.from(array, byte => byte.toString(36)).join('')
  
  const timestamp = Date.now().toString(36)
  
  return safePrefix ? `${safePrefix}-${timestamp}-${randomString}` : `${timestamp}-${randomString}`
}

/**
 * Capitalise une chaîne de manière sécurisée
 */
export function capitalize(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }
  
  const sanitized = sanitizeString(str, { maxLength: SECURITY_LIMITS.MAX_STRING_LENGTH })
  
  if (sanitized.length === 0) {
    return ''
  }
  
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase()
}

/**
 * Tronque une chaîne de manière sécurisée
 */
export function truncate(str: string, length: number = 100, suffix: string = '...'): string {
  if (typeof str !== 'string') {
    return ''
  }
  
  // Validation de la longueur
  const safeLength = Math.max(1, Math.min(SECURITY_LIMITS.MAX_STRING_LENGTH, length))
  const safeSuffix = sanitizeString(suffix, { maxLength: 10 })
  
  const sanitized = sanitizeString(str, { maxLength: SECURITY_LIMITS.MAX_STRING_LENGTH })
  
  if (sanitized.length <= safeLength) {
    return sanitized
  }
  
  return sanitized.substring(0, safeLength - safeSuffix.length) + safeSuffix
}

/**
 * Slug sécurisé pour les URLs
 */
export function slugify(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }
  
  return sanitizeString(str, { maxLength: 200 })
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde seulement alphanumériques, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
    .replace(/^-|-$/g, '') // Supprime les tirets en début/fin
}

/**
 * Validation de nombre sécurisée
 */
export function safeNumber(
  value: unknown, 
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  let num: number
  
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    const sanitized = sanitizeString(value, { maxLength: 50 })
    num = parseFloat(sanitized)
  } else {
    num = defaultValue
  }
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue
  }
  
  if (min !== undefined) {
    num = Math.max(min, num)
  }
  
  if (max !== undefined) {
    num = Math.min(max, num)
  }
  
  return num
}

/**
 * Validation d'entier sécurisée
 */
export function safeInteger(
  value: unknown, 
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  const num = safeNumber(value, defaultValue, min, max)
  return Math.floor(num)
}

/**
 * Clone profond sécurisé avec limitation de profondeur
 */
export function safeDeepClone<T>(obj: T, maxDepth: number = SECURITY_LIMITS.MAX_OBJECT_DEPTH): T {
  if (maxDepth <= 0) {
    return obj
  }
  
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > SECURITY_LIMITS.MAX_ARRAY_LENGTH) {
      console.warn('Array too large for safe cloning')
      return obj.slice(0, SECURITY_LIMITS.MAX_ARRAY_LENGTH) as T
    }
    return obj.map(item => safeDeepClone(item, maxDepth - 1)) as T
  }
  
  const cloned = {} as T
  let propCount = 0
  
  for (const key in obj) {
    if (propCount >= 1000) { // Limite le nombre de propriétés
      console.warn('Object has too many properties for safe cloning')
      break
    }
    
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = safeDeepClone(obj[key], maxDepth - 1)
      propCount++
    }
  }
  
  return cloned
}

/**
 * Comparaison sécurisée d'objets
 */
export function safeEqual(a: unknown, b: unknown, maxDepth: number = 10): boolean {
  if (maxDepth <= 0) {
    return a === b
  }
  
  if (a === b) {
    return true
  }
  
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b
  }
  
  if (typeof a !== typeof b) {
    return false
  }
  
  if (typeof a !== 'object') {
    return a === b
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    
    for (let i = 0; i < a.length; i++) {
      if (!safeEqual(a[i], b[i], maxDepth - 1)) {
        return false
      }
    }
    
    return true
  }
  
  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)
  
  if (keysA.length !== keysB.length) {
    return false
  }
  
  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }
    
    if (!safeEqual((a as any)[key], (b as any)[key], maxDepth - 1)) {
      return false
    }
  }
  
  return true
}

/**
 * Formatage sécurisé des bytes
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  const safeBytes = safeNumber(bytes, 0, 0)
  const safeDecimals = safeInteger(decimals, 2, 0, 10)
  
  if (safeBytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(safeBytes) / Math.log(k))
  
  return parseFloat((safeBytes / Math.pow(k, i)).toFixed(safeDecimals)) + ' ' + sizes[i]
}

/**
 * Validation de couleur hexadécimale
 */
export function isValidHexColor(color: string): boolean {
  if (typeof color !== 'string') {
    return false
  }
  
  const sanitized = sanitizeString(color, { maxLength: 7 })
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(sanitized)
}

/**
 * Génération de couleur aléatoire sécurisée
 */
export function generateRandomColor(): string {
  const array = new Uint8Array(3)
  crypto.getRandomValues(array)
  return '#' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}