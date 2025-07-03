import { db } from "./db";
import { menuItems } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function cleanupDuplicateMenuItems() {
  try {
    console.log("🧹 Nettoyage des doublons de menu...");
    
    // Supprimer tous les doublons en gardant seulement le premier de chaque nom
    const deleteDuplicatesQuery = sql`
      DELETE FROM menu_items 
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM menu_items 
        GROUP BY name
      )
    `;
    
    await db.execute(deleteDuplicatesQuery);
    
    // Vérifier les résultats
    const remainingItems = await db.select().from(menuItems);
    console.log(`✅ Nettoyage terminé. ${remainingItems.length} éléments uniques conservés.`);
    
    // Afficher les items restants pour vérification
    const itemsByName = new Map();
    for (const item of remainingItems) {
      const count = itemsByName.get(item.name) || 0;
      itemsByName.set(item.name, count + 1);
    }
    
    const duplicates = Array.from(itemsByName.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log("⚠️  Doublons détectés:");
      duplicates.forEach(([name, count]) => {
        console.log(`  - ${name}: ${count} occurrences`);
      });
    } else {
      console.log("✅ Aucun doublon détecté après nettoyage");
    }
    
  } catch (error) {
    console.error("Erreur lors du nettoyage des doublons:", error);
  }
}