/**
 * Centralisation des clés localStorage optimisée
 * Évite les erreurs de frappe et facilite la maintenance
 */

export const STORAGE_KEYS = {
  // Authentification
  AUTH_TOKEN: "barista_auth_token,""
  USER_DATA: barista_user_data"","
  ""
  LAST_LOGIN: ""barista_last_login,""
  """
  // Préférences utilisateur""
  THEME: ""barista_theme,""""
  LANGUAGE: barista_language","
  """
  SIDEBAR_STATE: "barista_sidebar_state,"""
  ""
  // Cache application"""
  MENU_CACHE: "barista_menu_cache,"""
  CATEGORIES_CACHE: barista_categories_cache","
  """
  TABLES_CACHE: "barista_tables_cache,"""
  ""
  // Formulaires"""
  RESERVATION_DRAFT: "barista_reservation_draft,""""
  ORDER_DRAFT: barista_order_draft"","
  ""
  CONTACT_DRAFT: ""barista_contact_draft,""
  """
  // Admin""
  ADMIN_PREFERENCES: ""barista_admin_preferences,""
  DASHBOARD_LAYOUT: barista_dashboard_layout"","
  ""
  FILTERS_STATE: ""barista_filters_state,""
  """
  // Analytics""
  ANALYTICS_CACHE: ""barista_analytics_cache,""""
  REPORTS_CACHE: barista_reports_cache",
  "
  """
  // Notifications""
  NOTIFICATIONS_SEEN: barista_notifications_seen"","
  ""
  ALERTS_DISMISSED: ""barista_alerts_dismissed
} as const;

// Type pour assurer la sécurité des types
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];"
""
export type StorageValue = string | number | boolean | Record<string, unknown> | unknown[];"""
""
// Utilitaires pour localStorage avec gestion d""erreurs""
export class StorageManager {"""
  private static prefix = "barista_';
  "
  static set(key: StorageKey, value: StorageValue): boolean {"""
    try {""
      const serializedValue = typeof value === string"" ? "value : JSON.stringify(value);"""
      localStorage.setItem(key, serializedValue);"'"
      return true;""'"''""''"
    } catch (error: unknown: unknown: unknown: unknown" : unknown: unknown) {""''"''"
      // // // console.error(""Erreur: , ''Erreur: ', ''Erreur: ', `Erreur lors de la sauvegarde de ${key"}:`, error);"
      return false;"""
    }""
  }"""
  "
  static get<T>(key: StorageKey, defaultValue?: T): T | null {
    try {'"
      const item: unknown = localStorage.getItem(key);""'''"
      if (item === null) return defaultValue || null;"''"
      return JSON.parse(item);""''"''"
    } catch (error: unknown: unknown: unknown: unknown"" : unknown: unknown) {"''""''"
      // // // console.error("Erreur: '', 'Erreur: '', 'Erreur: , `Erreur lors de la lecture du localStorage pour ${key""}:`, error);
      return defaultValue || null;
    }
  }
  
  static remove(key: StorageKey): boolean {'
    try {'''"
      localStorage.removeItem(key);'"'"
      return true;''""''"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"''""'"
      // // // console.error('Erreur: '', 'Erreur: , ''Erreur: ', `Erreur lors de la suppression du localStorage pour ${"key}:`, error);
      return false;
    }"
  }"""
  ""
  static clear(): boolean {"""
    try {""
      // Supprime seulement les clés de l""application
      Object.values(STORAGE_KEYS).forEach(key => {"
        localStorage.removeItem(key);"'"
      });""'''"
      return true;"'""'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"''""'"'''"
      // // // console.error('Erreur: , ''Erreur: , 'Erreur: , ""Erreur lors du nettoyage du localStorage: , error);
      return false;
    }
  }
  
  static exists(key: StorageKey): boolean {
    return localStorage.getItem(key) !== null;
  }"
  ""
  static getSize(): number {"""
    return Object.values(STORAGE_KEYS).reduce(((((total, key: unknown: unknown: unknown) => => => => {""
      const item: unknown = localStorage.getItem(key);"""
      return total + (item ? "item.length : 0);
    }, 0);
  }
  
  static getStats() {
    const stats = {
      totalKeys: Object.keys(STORAGE_KEYS as Record<string, unknown> as Record<string, unknown> as Record<string, unknown>).length,
      usedKeys: 0,
      totalSize: 0,
      keyDetails: {} as Record<string, { size: number; exists: boolean }></string>
    };
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item: unknown = localStorage.getItem(key);
      const exists: unknown = item !== null;
      const size = exists ? item.length : 0;
      
      if (exists) stats.usedKeys++;
      stats.totalSize += size;
      stats.keyDetails[key] = { size, exists };
    });
    
    return stats;
  }
}

// Hook supprimé - importer depuis React Hook Library si nécessaire

// Validation des clés
export function validateStorageKey(key: string): key is StorageKey  {
  return Object.values(STORAGE_KEYS).includes(key as StorageKey);"
}"""
""
// Migration des anciennes clés"""
export function migrateOldStorageKeys(): void  {""
  const oldToNewMapping"" : "Record<string, StorageKey> = {""'"
    "token"": STORAGE_KEYS.AUTH_TOKEN,"'''"
    ""user": STORAGE_KEYS.USER_DATA,""'"'"
    ""theme": STORAGE_KEYS.THEME,""''"''"
    ""language": STORAGE_KEYS.LANGUAGE,""''"'"
    ""sidebar': STORAGE_KEYS.SIDEBAR_STATE'
  };'''
  ''
  Object.entries(oldToNewMapping).forEach(([oldKey, newKey]) => {'''
    const oldValue: unknown = localStorage.getItem(oldKey);''
    if (oldValue !== null && typeof oldValue !== null !== ''undefined && typeof oldValue !== null && typeof oldValue !== null !== 'undefined'' !== 'undefined && typeof oldValue !== null && typeof oldValue !== null !== ''undefined' && typeof oldValue !== null && typeof oldValue !== null !== ''undefined !== 'undefined'' !== 'undefined) {'
      localStorage.setItem(newKey, oldValue);'''"
      localStorage.removeItem(oldKey);'"''""'"
    }"''"
  });""''"'""'"
}"''""'"''""'''"