/**
 * Système d'images professionnel pour Barista Café
 * Optimisé et sécurisé avec fallback automatique
 */

// Images par catégorie - Source Unsplash pour la qualité
const CATEGORY_IMAGES: Record<string, string> = {
  'cafes': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80',
  'boissons': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  'patisseries': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80',
  'plats': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&q=80',
  'salades': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80',
  'desserts': 'https://images.unsplash.com/photo-1488474339733-16ac48362dc4?w=400&h=300&fit=crop&q=80',
  'sandwichs': 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop&q=80',
  'boissons-chaudes': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&q=80'
};

// Images spécifiques par item
const ITEM_IMAGES: Record<string, string> = {
  // Cafés
  'espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop&q=80',
  'cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop&q=80',
  'latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&q=80',
  'americano': 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&h=300&fit=crop&q=80',
  'macchiato': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',

  // Boissons
  'the': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&q=80',
  'chocolat': 'https://images.unsplash.com/photo-1542990253-0b8cefdf2b46?w=400&h=300&fit=crop&q=80',
  'smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&q=80',
  'jus': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=300&fit=crop&q=80',

  // Pâtisseries
  'croissant': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80',
  'muffin': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop&q=80',
  'macaron': 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=300&fit=crop&q=80',
  'eclair': 'https://images.unsplash.com/photo-1488474339733-16ac48362dc4?w=400&h=300&fit=crop&q=80',
  'tarte': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&h=300&fit=crop&q=80',
  'cookies': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop&q=80',

  // Plats
  'sandwich': 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop&q=80',
  'salade': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80',
  'quiche': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&q=80',
  'burger': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop&q=80',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&q=80'
};

// Image par défaut professionnelle
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80';

/**
 * Normalise une chaîne pour la recherche d'image
 */
export function normalizeKey(key: unknown): string {
  if (!key || typeof key !== 'string') return 'default';

  return String(key)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Obtient l'URL d'image pour un item avec fallback intelligent
 */
export function getItemImageUrl(itemName: unknown, categorySlug: unknown = 'default'): string {
  try {
    if (!itemName) return DEFAULT_IMAGE;

    const normalizedItem = normalizeKey(itemName);
    const normalizedCategory = normalizeKey(categorySlug);

    // 1. Recherche par nom exact d'item
    if (normalizedItem && ITEM_IMAGES[normalizedItem]) {
      return ITEM_IMAGES[normalizedItem];
    }

    // 2. Recherche par mots-clés dans le nom
    const itemKeys = Object.keys(ITEM_IMAGES);
    for (const key of itemKeys) {
      if (normalizedItem && (normalizedItem.includes(key) || key.includes(normalizedItem))) {
        return ITEM_IMAGES[key];
      }
    }

    // 3. Recherche par catégorie
    if (normalizedCategory && CATEGORY_IMAGES[normalizedCategory]) {
      return CATEGORY_IMAGES[normalizedCategory];
    }

    // 4. Image par défaut
    return DEFAULT_IMAGE;
  } catch (error) {
    console.warn('Erreur getItemImageUrl:', error);
    return DEFAULT_IMAGE;
  }
}

/**
 * Obtient l'URL d'image pour une catégorie
 */
export function getCategoryImage(categorySlug: string): string {
  const normalized = normalizeKey(categorySlug);
  return CATEGORY_IMAGES[normalized] || DEFAULT_IMAGE;
}

/**
 * Obtient une image avec texte alternatif
 */
export function getImageWithAlt(itemName: string): { url: string; alt: string } {
  return {
    url: getItemImageUrl(itemName),
    alt: itemName ? `Image de ${itemName}` : 'Image du menu'
  };
}

/**
 * Précharge les images critiques pour les performances
 */
export function preloadCriticalImages(): void {
  const criticalImages = [
    DEFAULT_IMAGE,
    ...Object.values(CATEGORY_IMAGES).slice(0, 4),
    ...Object.values(ITEM_IMAGES).slice(0, 6)
  ];

  criticalImages.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

/**
 * Valide qu'une URL d'image est accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Statistiques du système d'images
 */
export function getImageMappingStats() {
  return {
    totalImages: Object.keys(ITEM_IMAGES).length + Object.keys(CATEGORY_IMAGES).length,
    categoriesWithImages: Object.keys(CATEGORY_IMAGES),
    itemsWithImages: Object.keys(ITEM_IMAGES),
    missingImages: [] // À implémenter si nécessaire
  };
}

// Exports pour compatibilité
export { CATEGORY_IMAGES as DEFAULT_CATEGORY_IMAGES };
export { ITEM_IMAGES as MENU_ITEM_IMAGES };
export { DEFAULT_IMAGE as DEFAULT_FALLBACK_IMAGE };