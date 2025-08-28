
// Configuration d'optimisation pour les composants UI
export const UI_OPTIMIZATION_CONFIG = {
  // Performance
  VIRTUAL_SCROLL_ITEM_HEIGHT: 50,
  VIRTUAL_SCROLL_OVERSCAN: 5,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  
  // Mémoire
  MAX_CACHED_ITEMS: 1000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Rendu
  MAX_VISIBLE_ITEMS: 100,
  BATCH_SIZE: 20,
  
  // Types sécurisés
  SAFE_DEFAULTS: {
    object: () => Object.create(null),
    array: <T>() => [] as T[],
    string: () => '',
    number: () => 0,
    boolean: () => false,
  },
  
  // Validation
  VALIDATION: {
    maxStringLength: 1000,
    maxArrayLength: 10000,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  
  // Accessibilité
  A11Y: {
    minContrastRatio: 4.5,
    minTouchTarget: 44, // pixels
    focusVisibleOutline: '2px solid var(--ring)',
    ariaLivePolite: 'polite' as const,
    ariaLiveAssertive: 'assertive' as const,
  },
} as const

// Types pour la configuration
export type UIOptimizationConfig = typeof UI_OPTIMIZATION_CONFIG
export type SafeDefaults = typeof UI_OPTIMIZATION_CONFIG.SAFE_DEFAULTS
export type ValidationConfig = typeof UI_OPTIMIZATION_CONFIG.VALIDATION
export type A11yConfig = typeof UI_OPTIMIZATION_CONFIG.A11Y

// Helper pour créer des objets sécurisés
export const createSafeDefaults = UI_OPTIMIZATION_CONFIG.SAFE_DEFAULTS

// Validation helpers
export function validateStringLength(str: string, maxLength = UI_OPTIMIZATION_CONFIG.VALIDATION.maxStringLength): boolean {
  return typeof str === 'string' && str.length <= maxLength
}

export function validateArrayLength<T>(arr: T[], maxLength = UI_OPTIMIZATION_CONFIG.VALIDATION.maxArrayLength): boolean {
  return Array.isArray(arr) && arr.length <= maxLength
}

// Performance helpers
export function shouldUseVirtualization(itemCount: number): boolean {
  return itemCount > UI_OPTIMIZATION_CONFIG.MAX_VISIBLE_ITEMS
}

export function calculateOptimalBatchSize(totalItems: number): number {
  return Math.min(UI_OPTIMIZATION_CONFIG.BATCH_SIZE, Math.ceil(totalItems / 10))
}
