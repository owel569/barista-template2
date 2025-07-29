#!/usr/bin/env tsx
import 'dotenv/config';
import { imageManager } from '../server/services/ImageManager';
import { MENU_ITEM_IMAGES } from '../client/src/lib/image-mapping';

async function main() {
  console.log('🔄 Début migration des images...');
  
  try {
    await imageManager.migrateLegacyImages(MENU_ITEM_IMAGES);
    console.log('✅ Migration terminée avec succès');
    
    // Afficher les stats du cache
    const stats = imageManager.getCacheStats();
    console.log(`📊 Cache stats: ${stats.size} images en cache`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Échec de la migration:', error);
    process.exit(1);
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrompue par l\'utilisateur');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Migration terminée par le système');
  process.exit(0);
});

main().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});