// Système d'images optimisé pour Barista Café
// Avec fallback automatique et gestion d'erreurs

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'cafes': 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'boissons': 'https://images.pexels.com/photos/1766404/pexels-photo-1766404.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'patisseries': 'https://images.pexels.com/photos/1321944/pexels-photo-1321944.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'plats': 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'salades': 'https://images.pexels.com/photos/1833349/pexels-photo-1833349.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'desserts': 'https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'sandwichs': 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'boissons-chaudes': 'https://images.pexels.com/photos/1766404/pexels-photo-1766404.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
};

export const MENU_ITEM_IMAGES: Record<string, string> = {
  // Cafés
  'espresso': 'https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'cappuccino': 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'latte': 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'americano': 'https://images.pexels.com/photos/1370692/pexels-photo-1370692.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'macchiato': 'https://images.pexels.com/photos/1233525/pexels-photo-1233525.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',

  // Boissons
  'the': 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'chocolat': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'smoothie': 'https://images.pexels.com/photos/1346155/pexels-photo-1346155.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'jus': 'https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',

  // Pâtisseries
  'croissant': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'muffin': 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'macaron': 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'eclair': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'tarte': 'https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',

  // Plats
  'sandwich': 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'salade': 'https://images.pexels.com/photos/1833349/pexels-photo-1833349.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'quiche': 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'burger': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'pizza': 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  'croque-monsieur': 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
};

// Image par défaut en cas d'erreur
export const DEFAULT_FALLBACK_IMAGE = 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260';

// Fonction pour normaliser les chaînes
function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprime la ponctuation
    .trim()
    .replace(/\s+/g, '_'); // Remplace les espaces par des underscores
}

// Fonction pour trouver une image par mots-clés
function findByKeywords(normalizedName: string): string | null {
  const keywords = Object.keys(MENU_ITEM_IMAGES);

  for (const keyword of keywords) {
    if (normalizedName.includes(keyword) || keyword.includes(normalizedName)) {
      return MENU_ITEM_IMAGES[keyword];
    }
  }

  return null;
}

// Fonction pour valider une URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Fonction pour obtenir une image avec fallback intelligent
export function getItemImageUrl(
  itemName: string, 
  categorySlug?: string, 
  providedUrl?: string
): string {
  try {
    // Vérifications de sécurité
    if (!itemName || typeof itemName !== 'string') {
      return DEFAULT_FALLBACK_IMAGE;
    }

    // 1. Priorité à l'URL fournie si elle existe
    if (providedUrl && isValidUrl(providedUrl)) {
      return providedUrl;
    }

    // 2. Recherche par nom d'article (normalisé)
    const normalizedName = normalizeString(itemName);
    const exactMatch = MENU_ITEM_IMAGES[normalizedName];
    if (exactMatch) {
      return exactMatch;
    }

    // 3. Recherche par mots-clés dans le nom
    const keywordMatch = findByKeywords(normalizedName);
    if (keywordMatch) {
      return keywordMatch;
    }

    // 4. Fallback vers l'image de catégorie
    if (categorySlug && DEFAULT_CATEGORY_IMAGES[categorySlug]) {
      return DEFAULT_CATEGORY_IMAGES[categorySlug];
    }

    // 5. Image par défaut
    return DEFAULT_FALLBACK_IMAGE;
  } catch (error) {
    console.warn('Erreur lors de la sélection d\'image:', error);
    return DEFAULT_FALLBACK_IMAGE;
  }
}

// Fonction pour obtenir une image de catégorie
export function getCategoryImage(categorySlug: string): string {
  return DEFAULT_CATEGORY_IMAGES[categorySlug] || DEFAULT_FALLBACK_IMAGE;
}

// Fonction pour obtenir une image d'article de menu
export function getMenuItemImage(itemName: string, categorySlug?: string): string {
  return getItemImageUrl(itemName, categorySlug);
}

// Fonction pour précharger les images critiques
export function preloadCriticalImages(): void {
  const criticalImages = [
    DEFAULT_FALLBACK_IMAGE,
    ...Object.values(DEFAULT_CATEGORY_IMAGES).slice(0, 4)
  ];

  criticalImages.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

// Mapping simplifié et sécurisé pour les images
const CATEGORY_IMAGES: Record<string, string> = {
  'cafes': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
  'boissons': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  'patisseries': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  'plats': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
};

const ITEM_IMAGES: Record<string, string> = {
  'espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop',
  'cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
  'latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  'croissant': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  'cookies': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop'
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop';

export function normalizeKey(key: any): string {
  if (!key) return 'default';
  
  const str = String(key).toLowerCase();
  return str
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getItemImageUrl(itemName: any, categorySlug: any = 'default'): string {
  try {
    const normalizedItem = normalizeKey(itemName);
    const normalizedCategory = normalizeKey(categorySlug);

    // Recherche par nom d'item
    if (normalizedItem && ITEM_IMAGES[normalizedItem]) {
      return ITEM_IMAGES[normalizedItem];
    }

    // Recherche par catégorie
    if (normalizedCategory && CATEGORY_IMAGES[normalizedCategory]) {
      return CATEGORY_IMAGES[normalizedCategory];
    }

    return DEFAULT_IMAGE;
  } catch (error) {
    console.warn('Erreur dans getItemImageUrl:', error);
    return DEFAULT_IMAGE;
  }
}