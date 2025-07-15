// Import du mapping depuis JSON pour édition facile
import imageMappingData from './image-mapping.json';

// Mapping principal des images avec clés normalisées
export const IMAGE_MAPPING: Record<string, string> = imageMappingData.images;
  "latte art": "https://images.pexels.com/photos/433145/pexels-photo-433145.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "cappuccino premium": "https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "cappuccino": "https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "americano": "https://images.pexels.com/photos/4264049/pexels-photo-4264049.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "cafe mocha": "https://images.pexels.com/photos/6895939/pexels-photo-6895939.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "cafe frappe": "https://images.pexels.com/photos/11512983/pexels-photo-11512983.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "latte macchiato": "https://images.pexels.com/photos/433145/pexels-photo-433145.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Boissons - URLs Pexels spécifiées
  "the vert premium": "https://images.pexels.com/photos/7565503/pexels-photo-7565503.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "the vert": "https://images.pexels.com/photos/32754882/pexels-photo-32754882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "the earl grey": "https://images.pexels.com/photos/32754882/pexels-photo-32754882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "chocolat chaud": "https://images.pexels.com/photos/15529714/pexels-photo-15529714.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "jus d orange presse": "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "jus de citron vert": "https://images.pexels.com/photos/1546003/pexels-photo-1546003.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "smoothie du jour": "https://images.pexels.com/photos/11160116/pexels-photo-11160116.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "smoothie fruits rouges": "https://images.pexels.com/photos/11160116/pexels-photo-11160116.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Pâtisseries - URLs Pexels spécifiées
  "croissants artisanaux": "https://images.pexels.com/photos/10560686/pexels-photo-10560686.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "croissant au beurre": "https://images.pexels.com/photos/10560686/pexels-photo-10560686.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "macarons francais": "https://images.pexels.com/photos/11345217/pexels-photo-11345217.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "eclair au chocolat": "https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "mille-feuille": "https://images.pexels.com/photos/8738018/pexels-photo-8738018.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "gateaux au chocolat": "https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "muffin chocolat": "https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",

  // Plats - URLs Pexels spécifiées
  "sandwich club": "https://images.pexels.com/photos/28681955/pexels-photo-28681955.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "salade cesar": "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "quiche lorraine": "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};

// Images par défaut par catégorie depuis JSON
export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = imageMappingData.categories;
  "thes": "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "boissons": "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "patisseries": "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "boissons-froides": "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "plats": "https://images.pexels.com/photos/4676406/pexels-photo-4676406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};

/**
 * Normalise une chaîne pour la recherche d'images
 * Supprime les accents, convertit en minuscules et normalise les espaces
 */
export const normalizeKey = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/['']/g, '') // Supprime les apostrophes
    .replace(/\s+/g, ' '); // Normalise les espaces
};

/**
 * Obtient l'URL d'image pour un élément de menu avec système robuste de fallback
 * @param itemName - Nom de l'élément de menu
 * @param categorySlug - Slug de la catégorie pour l'image par défaut
 * @param fallbackUrl - URL de l'image par défaut si aucune correspondance
 * @param enableDebug - Active les logs de debug (défaut: false)
 * @returns URL de l'image
 */
export function getItemImageUrl(
  itemName: string, 
  categorySlug?: string, 
  fallbackUrl?: string,
  enableDebug: boolean = false
): string {
  if (!itemName) {
    if (enableDebug) console.warn('[IMAGE_MAPPING] Nom d\'élément vide fourni');
    return getFallbackImage(categorySlug, fallbackUrl);
  }

  // 1. Essayer le mapping exact avec clé normalisée
  const normalizedName = normalizeKey(itemName);
  const directMatch = IMAGE_MAPPING[normalizedName];

  if (directMatch) {
    if (enableDebug) console.log(`[IMAGE_MAPPING] Image trouvée pour "${itemName}" -> ${directMatch}`);
    return directMatch;
  }

  // 2. Recherche partielle dans les clés
  const partialMatch = Object.keys(IMAGE_MAPPING).find(key => 
    key.includes(normalizedName) || normalizedName.includes(key)
  );

  if (partialMatch) {
    if (enableDebug) console.log(`[IMAGE_MAPPING] Correspondance partielle pour "${itemName}" -> ${IMAGE_MAPPING[partialMatch]}`);
    return IMAGE_MAPPING[partialMatch];
  }

  // 3. Log de debug pour éléments non trouvés
  if (enableDebug) {
    console.warn(`[IMAGE_MAPPING] Aucune image trouvée pour: "${itemName}" (normalisé: "${normalizedName}")`);
    console.warn('[IMAGE_MAPPING] Clés disponibles:', Object.keys(IMAGE_MAPPING));
  }

  // 4. Fallback vers l'image de catégorie ou générique
  return getFallbackImage(categorySlug, fallbackUrl);
}

/**
 * Obtient l'image de fallback appropriée
 */
function getFallbackImage(categorySlug?: string, fallbackUrl?: string): string {
  // Utiliser l'image par défaut de la catégorie
  if (categorySlug && DEFAULT_CATEGORY_IMAGES[categorySlug]) {
    return DEFAULT_CATEGORY_IMAGES[categorySlug];
  }

  // Utiliser l'URL de fallback fournie
  if (fallbackUrl) {
    return fallbackUrl;
  }

  // Image par défaut générique
  return "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop";
}

// Alias pour compatibilité
export const getImageUrlByName = getItemImageUrl;

/**
 * Obtient l'image avec altText optimisé
 */
export function getImageWithAlt(
  itemName: string,
  categorySlug?: string,
  fallbackUrl?: string,
  enableDebug: boolean = false
): { url: string; alt: string } {
  const url = getItemImageUrl(itemName, categorySlug, fallbackUrl, enableDebug);
  const alt = itemName ? `Image de ${itemName}` : 'Image du menu';

  return { url, alt };
}

/**
 * Valide si une URL d'image est accessible (pour tests futurs)
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      // Côté serveur, on assume que l'URL est valide
      resolve(true);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;

    // Timeout après 5 secondes
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Obtient les statistiques du mapping d'images
 */
export function getImageMappingStats(): {
  totalImages: number;
  categoriesWithImages: string[];
  missingImages: string[];
} {
  const totalImages = Object.keys(IMAGE_MAPPING).length;
  const categoriesWithImages = Object.keys(DEFAULT_CATEGORY_IMAGES);

  return {
    totalImages,
    categoriesWithImages,
    missingImages: [] // À implémenter si nécessaire
  };
}