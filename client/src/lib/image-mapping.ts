// Système centralisé de mapping des images pour éviter les problèmes d'affichage
export const IMAGE_MAPPING: Record<string, string> = {
  // Cafés
  "Espresso Classique": "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Latte Art": "https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Cappuccino Premium": "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Americano": "https://images.pexels.com/photos/4264049/pexels-photo-4264049.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  
  // Boissons
  "Thé Vert Premium": "https://images.pexels.com/photos/7565503/pexels-photo-7565503.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Chocolat Chaud": "https://images.pexels.com/photos/982612/pexels-photo-982612.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Jus d'Orange Pressé": "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  
  // Pâtisseries
  "Croissants Artisanaux": "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Macarons Français": "https://images.pexels.com/photos/11345217/pexels-photo-11345217.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Éclair au Chocolat": "https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Mille-feuille": "https://images.pexels.com/photos/8738018/pexels-photo-8738018.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  
  // Plats
  "Sandwich Club": "https://images.pexels.com/photos/28681955/pexels-photo-28681955.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Salade César": "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "Quiche Lorraine": "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};

// Images par défaut par catégorie si aucune image spécifique n'est trouvée
export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "cafes": "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "boissons": "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "patisseries": "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "plats": "https://images.pexels.com/photos/4676406/pexels-photo-4676406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};

/**
 * Obtient l'URL d'image pour un élément de menu
 * @param itemName - Nom de l'élément de menu
 * @param categorySlug - Slug de la catégorie pour l'image par défaut
 * @param fallbackUrl - URL de l'image par défaut si aucune correspondance
 * @returns URL de l'image
 */
export function getItemImageUrl(
  itemName: string, 
  categorySlug?: string, 
  fallbackUrl?: string
): string {
  // Essayer d'abord le mapping exact
  const directMatch = IMAGE_MAPPING[itemName];
  if (directMatch) {
    return directMatch;
  }

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