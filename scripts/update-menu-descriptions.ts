#!/usr/bin/env tsx
import 'dotenv/config';
import { getDb } from '../server/db';
import { menuItems, menuItemImages } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getItemImageUrl } from '../client/src/lib/image-mapping';

// Mapping des améliorations de descriptions par nom d'élément
const ENHANCED_DESCRIPTIONS = {
  'Espresso': 'Espresso italien authentique aux arômes intenses, crema dorée parfaite, grains torréfiés artisanalement',
  'Cappuccino': 'Équilibre parfait entre espresso corsé et mousse de lait veloutée, saupoudré de cacao pur',
  'Latte': 'Café au lait onctueux avec art latte dessiné par nos baristas experts, douceur et intensité réunies',
  'Americano': 'Double espresso allongé à l\'eau chaude, café long et intense pour les amateurs de saveurs authentiques',
  'Thé Earl Grey': 'Thé noir Ceylon premium aux bergamotes naturelles, servi avec miel de lavande et citron frais',
  'Chocolat chaud': 'Chocolat belge fondu avec lait entier fermier, chantilly maison et copeaux de chocolat noir 70%',
  'Thé vert Sencha': 'Thé vert japonais délicat aux propriétés antioxydantes, notes fraîches et herbacées',
  'Croissant': 'Viennoiserie française traditionnelle, pâte feuilletée au beurre AOP Charentes-Poitou, dorée au four',
  'Muffin': 'Muffin moelleux aux myrtilles fraîches et pépites de chocolat blanc, recette maison authentique',
  'Éclair': 'Pâte à choux aérienne garnie de crème pâtissière au café, glaçage fondant au mokaccino italien',
  'Quiche': 'Quiche lorraine traditionnelle aux lardons fumés, œufs fermiers et crème fraîche, pâte brisée maison',
  'Sandwich': 'Sandwich gourmand sur pain artisanal, ingrédients frais sélectionnés, accompagné de salade croquante'
};

async function updateMenuDescriptions() {
  console.log('📝 Mise à jour des descriptions du menu...');
  
  try {
    const db = await getDb();
    
    // Récupérer tous les éléments de menu
    const menuItemsList = await db.select().from(menuItems);
    console.log(`📋 ${menuItemsList.length} éléments de menu trouvés`);
    
    let updatedCount = 0;
    let imagesAdded = 0;
    
    for (const item of menuItemsList) {
      let hasUpdates = false;
      const updates: unknown = {};
      
      // Mettre à jour la description si elle existe
      const enhancedDesc = ENHANCED_DESCRIPTIONS[item.name];
      if (enhancedDesc && enhancedDesc !== item.description) {
        updates.description = enhancedDesc;
        hasUpdates = true;
      }
      
      // Augmenter légèrement les prix pour être plus réalistes
      const currentPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      if (currentPrice < 3) {
        updates.price = currentPrice + 0.5; // +0.50€
        hasUpdates = true;
      } else if (currentPrice < 5) {
        updates.price = currentPrice + 0.3; // +0.30€
        hasUpdates = true;
      }
      
      // Appliquer les mises à jour si nécessaire
      if (hasUpdates) {
        await db.update(menuItems)
          .set(updates)
          .where(eq(menuItems.id, item.id));
        
        console.log(`✅ Mis à jour: ${item.name} - Nouvelle description et prix`);
        updatedCount++;
      }
      
      // Ajouter une image si elle n'existe pas
      const existingImages = await db.select()
        .from(menuItemImages)
        .where(eq(menuItemImages.menuItemId, item.id));
      
      if (existingImages.length === 0) {
        const imageUrl = getItemImageUrl(item.name);
        await db.insert(menuItemImages).values({
          menuItemId: item.id,
          imageUrl: imageUrl,
          altText: `Image de ${item.name}`,
          isPrimary: true,
          uploadMethod: 'unsplash'
        });
        
        console.log(`🖼️ Image ajoutée pour: ${item.name}`);
        imagesAdded++;
      }
    }
    
    console.log(`\n🎉 Mise à jour terminée !`);
    console.log(`📊 ${updatedCount} descriptions/prix mis à jour`);
    console.log(`🖼️ ${imagesAdded} images ajoutées`);
    
    // Afficher un échantillon du nouveau menu
    console.log('\n📋 Aperçu du menu enrichi:');
    const sampleItems = await db.select().from(menuItems).limit(3);
    for (const item of sampleItems) {
      console.log(`   • ${item.name)} - ${item.price}€`);
      console.log(`     ${item.description}`);
    }
    
  } catch (error) {
    logger.error('❌ Erreur lors de la mise à jour:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.main) {
  updateMenuDescriptions()
    .then(() => {
      console.log('✅ Mise à jour terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Échec de la mise à jour:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
      process.exit(1);
    });
}

export default updateMenuDescriptions;