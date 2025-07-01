// Mapping des noms d'articles vers les vraies images
export const getMenuItemImage = (name: string): string => {
  const normalizedName = name.toLowerCase();
  
  // Images réelles des produits
  const imageMap: { [key: string]: string } = {
    // Boissons chaudes
    'chocolat chaud': 'https://images.pexels.com/photos/15529714/pexels-photo-15529714/free-photo-of-cafe-tasse-boire-verre.jpeg?auto=compress&cs=tinysrgb&w=800',
    'thé vert premium': 'https://images.pexels.com/photos/7565503/pexels-photo-7565503.jpeg?auto=compress&cs=tinysrgb&w=800',
    'thé vert': 'https://images.pexels.com/photos/32754882/pexels-photo-32754882/free-photo-of-jus-de-citron-vert-rafraichissant-avec-garniture-de-concombre-et-de-myrtille.jpeg?auto=compress&cs=tinysrgb&w=800',
    
    // Catégories d'images Unsplash de qualité
    'petit déjeuner': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'cafés premium': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'pâtisseries': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'déjeuner dîner': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'boissons fraîches': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
  };
  
  // Recherche exacte d'abord
  if (normalizedName in imageMap) {
    return imageMap[normalizedName];
  }
  
  // Recherche par mots-clés
  if (normalizedName.includes('chocolat')) return imageMap['chocolat chaud'];
  if (normalizedName.includes('thé') || normalizedName.includes('the')) {
    if (normalizedName.includes('premium')) return imageMap['thé vert premium'];
    return imageMap['thé vert'];
  }
  if (normalizedName.includes('cappuccino') || normalizedName.includes('espresso') || normalizedName.includes('latte')) {
    return imageMap['cafés premium'];
  }
  if (normalizedName.includes('croissant') || normalizedName.includes('macaron')) {
    return imageMap['pâtisseries'];
  }
  if (normalizedName.includes('salade') || normalizedName.includes('sandwich') || normalizedName.includes('club')) {
    return imageMap['déjeuner dîner'];
  }
  
  // Image par défaut - café
  return imageMap['cafés premium'];
};