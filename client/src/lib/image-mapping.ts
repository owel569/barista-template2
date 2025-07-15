
export const imageMapping: Record<string, string> = {
  // Cafés
  'espresso': '/api/images/espresso.jpg',
  'cappuccino': '/api/images/cappuccino.jpg',
  'latte': '/api/images/latte.jpg',
  'americano': '/api/images/americano.jpg',
  'macchiato': '/api/images/macchiato.jpg',
  
  // Boissons
  'thé': '/api/images/tea.jpg',
  'chocolat': '/api/images/chocolate.jpg',
  'smoothie': '/api/images/smoothie.jpg',
  'jus': '/api/images/juice.jpg',
  
  // Pâtisseries
  'croissant': '/api/images/croissant.jpg',
  'muffin': '/api/images/muffin.jpg',
  'cookie': '/api/images/cookie.jpg',
  'tarte': '/api/images/tart.jpg',
  'éclair': '/api/images/eclair.jpg',
  'macaron': '/api/images/macaron.jpg',
  
  // Plats
  'sandwich': '/api/images/sandwich.jpg',
  'salade': '/api/images/salad.jpg',
  'quiche': '/api/images/quiche.jpg',
  'panini': '/api/images/panini.jpg',
  'bagel': '/api/images/bagel.jpg',
  
  // Images par défaut
  'default': '/api/images/default-item.jpg',
  'cafe': '/api/images/coffee-default.jpg',
  'food': '/api/images/food-default.jpg',
  'pastry': '/api/images/pastry-default.jpg'
};

export function getItemImageUrl(itemName: string, categoryName?: string, customImageUrl?: string): string {
  // Si une URL personnalisée est fournie, l'utiliser en priorité
  if (customImageUrl && customImageUrl.trim()) {
    return customImageUrl;
  }
  
  // Normaliser le nom pour la recherche
  const normalizedName = itemName.toLowerCase().trim();
  
  // Rechercher par nom exact
  for (const [key, url] of Object.entries(imageMapping)) {
    if (normalizedName.includes(key)) {
      return url;
    }
  }
  
  // Rechercher par catégorie si fournie
  if (categoryName) {
    const normalizedCategory = categoryName.toLowerCase();
    if (normalizedCategory.includes('café') || normalizedCategory.includes('boisson')) {
      return imageMapping['cafe'] ?? imageMapping['default'] ?? '/api/images/coffee-default.jpg';
    }
    if (normalizedCategory.includes('pâtisserie')) {
      return imageMapping['pastry'] ?? imageMapping['default'] ?? '/api/images/pastry-default.jpg';
    }
    if (normalizedCategory.includes('plat')) {
      return imageMapping['food'] ?? imageMapping['default'] ?? '/api/images/food-default.jpg';
    }
  }
  
  // Image par défaut
  return imageMapping['default'] ?? '/api/images/default-item.jpg';
}

export function getCategoryImageUrl(categoryName: string): string {
  const normalized = categoryName.toLowerCase();
  
  if (normalized.includes('café')) return imageMapping['cafe'] ?? imageMapping['default'] ?? '/api/images/coffee-default.jpg';
  if (normalized.includes('boisson')) return imageMapping['cafe'] ?? imageMapping['default'] ?? '/api/images/coffee-default.jpg';
  if (normalized.includes('pâtisserie')) return imageMapping['pastry'] ?? imageMapping['default'] ?? '/api/images/pastry-default.jpg';
  if (normalized.includes('plat')) return imageMapping['food'] ?? imageMapping['default'] ?? '/api/images/food-default.jpg';
  
  return imageMapping['default'] ?? '/api/images/default-item.jpg';
}

// Fonction pour valider si une image existe
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Alias pour compatibilité avec l'ancien code
export function getImageUrlByName(itemName: string, categoryName?: string): string {
  return getItemImageUrl(itemName, categoryName);
}

// Constantes pour les images par défaut des catégories
export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'cafe': imageMapping['cafe'] ?? '/api/images/coffee-default.jpg',
  'boisson': imageMapping['cafe'] ?? '/api/images/coffee-default.jpg',
  'patisserie': imageMapping['pastry'] ?? '/api/images/pastry-default.jpg',
  'plat': imageMapping['food'] ?? '/api/images/food-default.jpg',
  'dessert': imageMapping['pastry'] ?? '/api/images/pastry-default.jpg',
  'default': imageMapping['default'] ?? '/api/images/default-item.jpg'
};
