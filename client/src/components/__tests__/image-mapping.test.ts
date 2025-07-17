/**
 * Tests unitaires pour le système d'images
 * Exécuter avec: npm test ou vitest
 */

import { describe, it, expect } from 'vitest';
import { 
  getItemImageUrl, 
  normalizeKey, 
  getImageWithAlt,
  getImageMappingStats,
  validateImageUrl 
} from '../lib/image-mapping';

describe('Image Mapping System', () => {
  describe('normalizeKey', () => {
    it('should normalize accented characters', () => {
      expect(normalizeKey('Café Frappé')).toBe('cafe frappe');
      expect(normalizeKey('Thé Earl Grey')).toBe('the earl grey');
      expect(normalizeKey('Éclair au Chocolat')).toBe('eclair au chocolat');
    });

    it('should handle special characters', () => {
      expect(normalizeKey("Jus d'Orange")).toBe('jus d orange');
      expect(normalizeKey('Mille-feuille')).toBe('mille-feuille');
    });

    it('should normalize spaces and case', () => {
      expect(normalizeKey('  ESPRESSO   CLASSIQUE  ')).toBe('espresso classique');
    });
  });

  describe('getItemImageUrl', () => {
    it('should return correct image for exact matches', () => {
      const url = getItemImageUrl('Espresso Classique');
      expect(url).toContain('pexels.com');
      expect(url).toContain('28538132');
    });

    it('should handle case-insensitive matches', () => {
      const url1 = getItemImageUrl('espresso classique');
      const url2 = getItemImageUrl('ESPRESSO CLASSIQUE');
      const url3 = getItemImageUrl('Espresso Classique');
      
      expect(url1).toBe(url2);
      expect(url2).toBe(url3);
    });

    it('should return category fallback for unknown items', () => {
      const url = getItemImageUrl('Unknown Item', 'cafes');
      expect(url).toContain('pexels.com');
    });

    it('should return generic fallback when no match found', () => {
      const url = getItemImageUrl('Unknown Item');
      expect(url).toContain('pexels.com');
      expect(url).toContain('312418'); // Image générique
    });

    it('should handle empty or invalid input', () => {
      const url1 = getItemImageUrl('');
      const url2 = getItemImageUrl(null as any);
      const url3 = getItemImageUrl(undefined as any);
      
      expect(url1).toContain('pexels.com');
      expect(url2).toContain('pexels.com');
      expect(url3).toContain('pexels.com');
    });
  });

  describe('getImageWithAlt', () => {
    it('should return object with url and alt text', () => {
      const result = getImageWithAlt('Cappuccino');
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('alt');
      expect(result.alt).toBe('Image de Cappuccino');
      expect(result.url).toContain('pexels.com');
    });

    it('should handle empty name gracefully', () => {
      const result = getImageWithAlt('');
      expect(result.alt).toBe('Image du menu');
    });
  });

  describe('getImageMappingStats', () => {
    it('should return mapping statistics', () => {
      const stats = getImageMappingStats();
      
      expect(stats).toHaveProperty('totalImages');
      expect(stats).toHaveProperty('categoriesWithImages');
      expect(stats).toHaveProperty('missingImages');
      
      expect(stats.totalImages).toBeGreaterThan(0);
      expect(Array.isArray(stats.categoriesWithImages)).toBe(true);
      expect(Array.isArray(stats.missingImages)).toBe(true);
    });
  });

  describe('validateImageUrl', () => {
    it('should validate valid URLs', async () => {
      const isValid = await validateImageUrl('https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg');
      expect(typeof isValid).toBe('boolean');
    });
  });
});

describe('Real Menu Items Integration', () => {
  const realMenuItems = [
    'Espresso Classique',
    'Cappuccino', 
    'Latte Macchiato',
    'Thé Earl Grey',
    'Croissant au Beurre',
    'Muffin Chocolat',
    'Smoothie Fruits Rouges',
    'Chocolat Chaud'
  ];

  it('should have images for all real menu items', () => {
    realMenuItems.forEach(item => {
      const url = getItemImageUrl(item);
      expect(url).toContain('pexels.com');
      expect(url).not.toContain('312418'); // Ne devrait pas être l'image générique
    });
  });

  it('should return consistent URLs for same items', () => {
    realMenuItems.forEach(item => {
      const url1 = getItemImageUrl(item);
      const url2 = getItemImageUrl(item);
      expect(url1).toBe(url2);
    });
  });
});