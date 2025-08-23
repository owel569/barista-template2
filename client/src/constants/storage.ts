// Centralisation des clés localStorage pour éviter les erreurs de typo
export const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user',
  theme: 'app_theme',
  language: 'app_language',
  dashboard_preferences: 'dashboard_preferences',
  table_filters: 'table_filters',
  notification_settings: 'notification_settings'
} as const;

// Type pour les clés de stockage
export type StorageKey = keyof typeof STORAGE_KEYS;

// Utilitaires pour la gestion sécurisée du localStorage
export const storageUtils = {
  // Lecture sécurisée avec validation JSON
  get<T>(key: StorageKey, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS[key]);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      if (parsed === null || parsed === undefined) return defaultValue;
      
      return parsed as T;
    } catch (error) {
      console.error(`Erreur lecture localStorage pour ${key}:`, error);
      // Nettoyer l'entrée corrompue
      localStorage.removeItem(STORAGE_KEYS[key]);
      return defaultValue;
    }
  },

  // Écriture sécurisée
  set<T>(key: StorageKey, value: T): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS[key,], JSON.stringify(value);
      return true;
    } catch (error) {
      console.error(`Erreur écriture localStorage pour ${key}:`, error);
      return false;
    }
  },

  // Suppression
  remove(key: StorageKey): void {
    localStorage.removeItem(STORAGE_KEYS[key]);
  },

  // Nettoyage complet
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key});
    });
  },

  // Vérification d'existence
  has(key: StorageKey): boolean {
    return localStorage.getItem(STORAGE_KEYS[key]) !== null;
  }
};