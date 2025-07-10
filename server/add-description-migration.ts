import { db } from "./db";
import { sql } from "drizzle-orm";

export async function addDescriptionColumn() {
  try {
    console.log('🔧 Ajout de la colonne description aux catégories de menu...');
    
    // Ajouter la colonne description si elle n'existe pas
    await db.execute(sql`ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS description TEXT`);
    
    // Mettre à jour les descriptions existantes
    await db.execute(sql`UPDATE menu_categories SET description = CASE
      WHEN slug = 'cafes' THEN 'Nos spécialités de café'
      WHEN slug = 'boissons' THEN 'Thés et autres boissons'
      WHEN slug = 'patisseries' THEN 'Viennoiseries et desserts'
      WHEN slug = 'plats' THEN 'Plats savoureux'
      ELSE 'Description de la catégorie'
    END WHERE description IS NULL`);
    
    console.log('✅ Colonne description ajoutée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne description:', error);
    return false;
  }
}