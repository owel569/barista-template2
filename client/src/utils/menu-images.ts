// Importation des images SVG
import cappuccinoImg from '../assets/menu/cappuccino.svg';
import espressoImg from '../assets/menu/espresso.svg';
import latteImg from '../assets/menu/latte.svg';
import croissantImg from '../assets/menu/croissant.svg';
import chocolatImg from '../assets/menu/chocolat.svg';
import theImg from '../assets/menu/the.svg';
import macaronImg from '../assets/menu/macaron.svg';
import saladeImg from '../assets/menu/salade.svg';
import sandwichImg from '../assets/menu/sandwich.svg';

// Mapping des noms d'articles vers les images SVG
export const getMenuItemImage = (name: string): string => {
  const normalizedName = name.toLowerCase();
  
  // Café
  if (normalizedName.includes('cappuccino')) return cappuccinoImg;
  if (normalizedName.includes('espresso')) return espressoImg;
  if (normalizedName.includes('latte')) return latteImg;
  
  // Boissons chaudes
  if (normalizedName.includes('chocolat')) return chocolatImg;
  if (normalizedName.includes('thé') || normalizedName.includes('the')) return theImg;
  
  // Pâtisseries
  if (normalizedName.includes('croissant')) return croissantImg;
  if (normalizedName.includes('macaron')) return macaronImg;
  
  // Plats
  if (normalizedName.includes('salade')) return saladeImg;
  if (normalizedName.includes('sandwich') || normalizedName.includes('club')) return sandwichImg;
  
  // Image par défaut
  return cappuccinoImg;
};