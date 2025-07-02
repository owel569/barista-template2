// ATTENTION: Ce fichier est obsolète. 
// Utiliser maintenant client/src/lib/image-mapping.ts pour toutes les images
// Conservé temporairement pour éviter les erreurs d'import

export const menuImages = {
  // Conservé pour compatibilité - utiliser client/src/lib/image-mapping.ts à la place
};

// Images pour les catégories
export const categoryImages = {
  'Petit Déjeuner': 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Cafés Premium': 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Pâtisseries': 'https://images.pexels.com/photos/10560686/pexels-photo-10560686.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Déjeuner & Dîner': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Boissons Fraîches': 'https://images.pexels.com/photos/11160116/pexels-photo-11160116.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Desserts': 'https://images.pexels.com/photos/11345217/pexels-photo-11345217.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
};

// OBSOLÈTE: Utiliser getItemImageUrl de client/src/lib/image-mapping.ts à la place
import { getItemImageUrl } from "@/lib/image-mapping";

export function getMenuItemImage(itemName: string): string {
  console.warn("getMenuItemImage est obsolète. Utiliser getItemImageUrl de @/lib/image-mapping à la place.");
  return getItemImageUrl(itemName);
}

// Fonction pour obtenir l'image d'une catégorie
export function getCategoryImage(categoryName: string): string {
  return categoryImages[categoryName as keyof typeof categoryImages] || 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
}