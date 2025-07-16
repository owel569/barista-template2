/**
 * Système d'images optimisé pour Barista Café
 * Améliorations selon les suggestions utilisateur
 */

export interface ImageConfig {
  url: string;
  alt: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  width?: number;
  height?: number;
}

// Centralisation des URLs avec configuration avancée
export const OPTIMIZED_IMAGE_MAPPING: Record<string, ImageConfig> = {
  // Cafés - Images haute qualité Pexels
  'espresso-classique': {
    url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Espresso italien traditionnel dans une tasse blanche',
    category: 'cafes',
    priority: 'high',
    width: 800,
    height: 600
  },
  'cappuccino': {
    url: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Cappuccino crémeux avec mousse de lait artistique',
    category: 'cafes',
    priority: 'high',
    width: 800,
    height: 600
  },
  'latte-macchiato': {
    url: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Latte macchiato avec couches de lait distinctes',
    category: 'cafes',
    priority: 'medium',
    width: 800,
    height: 600
  },

  // Pâtisseries - Images appétissantes
  'croissant-aux-amandes': {
    url: 'https://images.pexels.com/photos/4099278/pexels-photo-4099278.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Croissant aux amandes doré et croustillant',
    category: 'patisseries',
    priority: 'high',
    width: 800,
    height: 600
  },
  'muffin-myrtilles': {
    url: 'https://images.pexels.com/photos/761080/pexels-photo-761080.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Muffin aux myrtilles fraîches fait maison',
    category: 'patisseries',
    priority: 'high',
    width: 800,
    height: 600
  },
  'tarte-aux-pommes': {
    url: 'https://images.pexels.com/photos/1070854/pexels-photo-1070854.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Tarte aux pommes traditionnelle avec pâte dorée',
    category: 'patisseries',
    priority: 'medium',
    width: 800,
    height: 600
  },

  // Boissons - Variété de choix
  'the-earl-grey': {
    url: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Thé Earl Grey dans une tasse en porcelaine élégante',
    category: 'boissons',
    priority: 'medium',
    width: 800,
    height: 600
  },
  'smoothie-fruits-rouges': {
    url: 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Smoothie aux fruits rouges frais dans un verre transparent',
    category: 'boissons',
    priority: 'medium',
    width: 800,
    height: 600
  },
  'jus-orange-frais': {
    url: 'https://images.pexels.com/photos/1332206/pexels-photo-1332206.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Jus d\'orange fraîchement pressé avec pulpe',
    category: 'boissons',
    priority: 'low',
    width: 800,
    height: 600
  },

  // Petits Déjeuners - Images complètes
  'petit-dejeuner-complet': {
    url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Petit déjeuner complet avec œufs, pain et confiture',
    category: 'petits-dejeuners',
    priority: 'high',
    width: 800,
    height: 600
  },
  'avocado-toast': {
    url: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Toast à l\'avocat avec graines et herbes fraîches',
    category: 'petits-dejeuners',
    priority: 'high',
    width: 800,
    height: 600
  }
};

// Fonction de normalisation des clés avec cache
const keyCache = new Map<string, string>();

export function normalizeImageKey(input: string): string {
  if (keyCache.has(input)) {
    return keyCache.get(input)!;
  }

  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  keyCache.set(input, normalized);
  return normalized;
}

// Fonction de recherche optimisée avec score de pertinence
export function findBestImageMatch(searchTerm: string): ImageConfig | null {
  const normalizedSearch = normalizeImageKey(searchTerm);
  
  // Recherche exacte
  if (OPTIMIZED_IMAGE_MAPPING[normalizedSearch]) {
    return OPTIMIZED_IMAGE_MAPPING[normalizedSearch];
  }

  // Recherche partielle avec score
  const candidates = Object.entries(OPTIMIZED_IMAGE_MAPPING)
    .map(([key, config]) => ({
      key,
      config,
      score: calculateSimilarity(normalizedSearch, key)
    }))
    .filter(candidate => candidate.score > 0.6)
    .sort((a, b) => b.score - a.score);

  return candidates.length > 0 ? candidates[0].config : null;
}

// Calcul de similarité simple
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Distance de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Fonction de validation d'URL avec cache
const urlValidationCache = new Map<string, boolean>();

export async function validateImageUrl(url: string): Promise<boolean> {
  if (urlValidationCache.has(url)) {
    return urlValidationCache.get(url)!;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/');
    urlValidationCache.set(url, isValid);
    return isValid;
  } catch (error) {
    urlValidationCache.set(url, false);
    return false;
  }
}

// Fonction principale optimisée
export async function getOptimizedImageUrl(
  itemName: string, 
  categorySlug?: string,
  fallbackUrl?: string
): Promise<string> {
  // Recherche par nom d'item
  const itemMatch = findBestImageMatch(itemName);
  if (itemMatch) {
    return itemMatch.url;
  }

  // Recherche par catégorie
  if (categorySlug) {
    const categoryMatch = findBestImageMatch(categorySlug);
    if (categoryMatch) {
      return categoryMatch.url;
    }
  }

  // Image par défaut optimisée
  return fallbackUrl || 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800';
}

// Statistiques du mapping
export function getImageMappingStats() {
  const stats = {
    totalImages: Object.keys(OPTIMIZED_IMAGE_MAPPING).length,
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    averageSize: 0,
    cacheHitRate: keyCache.size > 0 ? (keyCache.size / (keyCache.size + 1)) * 100 : 0
  };

  Object.values(OPTIMIZED_IMAGE_MAPPING).forEach(config => {
    stats.byCategory[config.category] = (stats.byCategory[config.category] || 0) + 1;
    stats.byPriority[config.priority] = (stats.byPriority[config.priority] || 0) + 1;
  });

  return stats;
}

// Export des clés pour faciliter les tests
export const IMAGE_KEYS = Object.keys(OPTIMIZED_IMAGE_MAPPING);