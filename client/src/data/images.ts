// Images authentiques Pexels pour tous les éléments du menu
export const menuImages = {
  // Cafés
  'Cappuccino Premium': 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Espresso Classique': 'https://images.pexels.com/photos/28538132/pexels-photo-28538132.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Latte Art': 'https://images.pexels.com/photos/433145/pexels-photo-433145.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  
  // Boissons
  'Chocolat Chaud': 'https://images.pexels.com/photos/15529714/pexels-photo-15529714.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Thé Vert Premium': 'https://images.pexels.com/photos/7565503/pexels-photo-7565503.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Smoothie du Jour': 'https://images.pexels.com/photos/11160116/pexels-photo-11160116.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  
  // Pâtisseries
  'Croissants Artisanaux': 'https://images.pexels.com/photos/10560686/pexels-photo-10560686.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Macarons Français': 'https://images.pexels.com/photos/11345217/pexels-photo-11345217.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Gâteaux au Chocolat': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  
  // Plats
  'Salade César': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'Sandwich Club': 'https://images.pexels.com/photos/28681955/pexels-photo-28681955.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
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

// Fonction pour obtenir l'image d'un élément du menu
export function getMenuItemImage(itemName: string): string {
  return menuImages[itemName as keyof typeof menuImages] || 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
}

// Fonction pour obtenir l'image d'une catégorie
export function getCategoryImage(categoryName: string): string {
  return categoryImages[categoryName as keyof typeof categoryImages] || 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
}