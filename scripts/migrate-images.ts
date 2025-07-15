#!/usr/bin/env tsx
import 'dotenv/config';
import { getDb } from '../server/db';
import { menuItemImages, menuItems } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { IMAGE_MAPPING } from '../client/src/lib/image-mapping';

async function migrateImagesToDatabase() {
  console.log('🖼️ Migration des images IMAGE_MAPPING vers la base de données...');
  
  try {
    const db = await getDb();
    
    // Supprimer toutes les anciennes images
    await db.delete(menuItemImages);
    console.log('🗑️ Anciennes images supprimées');
    
    // Récupérer tous les éléments de menu
    const menuItemsList = await db.select().from(menuItems);
    console.log(`📋 ${menuItemsList.length} éléments de menu trouvés`);
    
    let migratedCount = 0;
    
    for (const menuItem of menuItemsList) {
      // Chercher l'image correspondante dans IMAGE_MAPPING
      const imageUrl = IMAGE_MAPPING[menuItem.name];
      
      if (imageUrl) {
        await db.insert(menuItemImages).values({
          menuItemId: menuItem.id,
          imageUrl: imageUrl,
          altText: `Image de ${menuItem.name}`,
          isPrimary: true,
          uploadMethod: 'pexels'
        });
        
        console.log(`✅ Image migrée pour: ${menuItem.name}`);
        migratedCount++;
      } else {
        console.log(`⚠️ Aucune image trouvée pour: ${menuItem.name}`);
      }
    }
    
    console.log(`🎉 Migration terminée ! ${migratedCount} images migrées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateImagesToDatabase();