export const IMAGE_CATEGORIES = {
  COFFEE: 'coffee',
  TEA: 'tea', 
  PASTRIES: 'pastries',
  SANDWICHES: 'sandwiches',
  SALADS: 'salads',
  DESSERTS: 'desserts',
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  BEVERAGES: 'beverages'
} as const;

export type ImageCategory = typeof IMAGE_CATEGORIES[keyof typeof IMAGE_CATEGORIES];

interface ImageMapping {
  [key: string]: {
    url: string;
    category: ImageCategory;
    alt: string;
    fallback?: string;
  };
}

export const OPTIMIZED_IMAGE_MAPPING: ImageMapping = {
  // Cafés et boissons chaudes
  'espresso': {
    url: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.COFFEE,
    alt: 'Espresso dans une tasse en porcelaine blanche',
    fallback: '/images/default-coffee.jpg'
  },
  'cappuccino': {
    url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.COFFEE,
    alt: 'Cappuccino avec mousse de lait artistique',
    fallback: '/images/default-coffee.jpg'
  },
  'latte': {
    url: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.COFFEE,
    alt: 'Latte avec art en mousse de lait',
    fallback: '/images/default-coffee.jpg'
  },

  // Thés
  'green-tea': {
    url: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.TEA,
    alt: 'Thé vert dans une tasse transparente',
    fallback: '/images/default-tea.jpg'
  },
  'earl-grey': {
    url: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.TEA,
    alt: 'Thé Earl Grey avec tranche de citron',
    fallback: '/images/default-tea.jpg'
  },

  // Pâtisseries
  'croissant': {
    url: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.PASTRIES,
    alt: 'Croissants dorés fraîchement cuits',
    fallback: '/images/default-pastry.jpg'
  },
  'muffin': {
    url: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.PASTRIES,
    alt: 'Muffins aux myrtilles',
    fallback: '/images/default-pastry.jpg'
  },

  // Sandwiches
  'avocado-toast': {
    url: 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.SANDWICHES,
    alt: 'Toast à l\'avocat avec garnitures fraîches',
    fallback: '/images/default-sandwich.jpg'
  },
  'club-sandwich': {
    url: 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: IMAGE_CATEGORIES.SANDWICHES,
    alt: 'Club sandwich avec frites',
    fallback: '/images/default-sandwich.jpg'
  }
};

export const DEFAULT_CATEGORY_IMAGES: Record<ImageCategory, string> = {
  [IMAGE_CATEGORIES.COFFEE]: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.TEA]: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.PASTRIES]: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.SANDWICHES]: 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.SALADS]: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.DESSERTS]: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.BREAKFAST]: 'https://images.pexels.com/photos/103124/pexels-photo-103124.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.LUNCH]: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
  [IMAGE_CATEGORIES.BEVERAGES]: 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg?auto=compress&cs=tinysrgb&w=400'
};

export const getImageForItem = (itemName: string, category?: string): string => {
  const normalizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Recherche directe par nom
  if (OPTIMIZED_IMAGE_MAPPING[normalizedName]) {
    return OPTIMIZED_IMAGE_MAPPING[normalizedName].url;
  }

  // Recherche par mots-clés
  const keywords = normalizedName.split('-');
  for (const [key, mapping] of Object.entries(OPTIMIZED_IMAGE_MAPPING)) {
    if (keywords.some(keyword => key.includes(keyword))) {
      return mapping.url;
    }
  }

  // Image par défaut selon la catégorie
  if (category && DEFAULT_CATEGORY_IMAGES[category as ImageCategory]) {
    return DEFAULT_CATEGORY_IMAGES[category as ImageCategory];
  }

  // Image par défaut générale
  return DEFAULT_CATEGORY_IMAGES[IMAGE_CATEGORIES.COFFEE];
};

export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  const promises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  try {
    await Promise.allSettled(promises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};