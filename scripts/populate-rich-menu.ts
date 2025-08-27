#!/usr/bin/env tsx
import 'dotenv/config';
import { db, getDb } from '../server/db';
import { menuItems, menuCategories, menuItemImages } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getItemImageUrl } from '../client/src/lib/image-mapping';

const logger = console;

// Données enrichies du menu Barista Café avec vraies descriptions
const RICH_MENU_DATA = {
  cafes: [
    {
      name: 'Espresso Classique',
      description: 'Un espresso authentique aux arômes intenses et à la crema parfaite, préparé avec nos grains torréfiés artisanalement',
      price: 3.50
    },
    {
      name: 'Cappuccino Premium',
      description: 'Équilibre parfait entre espresso corsé, lait vapeur et mousse veloutée, saupoudré de cacao',
      price: 4.20
    },
    {
      name: 'Latte Art',
      description: 'Café latte avec mousse de lait onctueuse et motifs artistiques dessinés par nos baristas experts',
      price: 4.80
    },
    {
      name: 'Americano Long',
      description: 'Double espresso allongé à l\'eau chaude pour un café intense mais délicat',
      price: 3.80
    },
    {
      name: 'Macchiato Caramel',
      description: 'Espresso macchiato avec une pointe de caramel et mousse de lait crémeuse',
      price: 4.90
    }
  ],
  boissons: [
    {
      name: 'Thé Earl Grey Premium',
      description: 'Thé noir Ceylon aux bergamotes naturelles, servi avec miel et citron',
      price: 3.20
    },
    {
      name: 'Chocolat Chaud Artisanal',
      description: 'Chocolat belge fondu avec lait entier, chantilly maison et copeaux de chocolat noir',
      price: 4.50
    },
    {
      name: 'Smoothie Fruits Rouges',
      description: 'Mélange onctueux de fruits rouges frais, yaourt grec et miel de lavande',
      price: 5.20
    },
    {
      name: 'Thé Vert Jasmin',
      description: 'Thé vert chinois parfumé aux fleurs de jasmin, aux propriétés antioxydantes',
      price: 3.00
    }
  ],
  patisseries: [
    {
      name: 'Croissant Beurre',
      description: 'Viennoiserie française traditionnelle, pâte feuilletée au beurre AOP, cuite au four',
      price: 2.80
    },
    {
      name: 'Muffin Myrtilles',
      description: 'Muffin moelleux aux myrtilles fraîches et pépites de chocolat blanc, fait maison',
      price: 3.50
    },
    {
      name: 'Éclair Café',
      description: 'Pâte à choux garnie de crème pâtissière au café et glaçage fondant au mokaccino',
      price: 4.20
    },
    {
      name: 'Tarte Tatin',
      description: 'Tarte aux pommes caramélisées, pâte brisée maison, servie tiède avec glace vanille',
      price: 5.80
    },
    {
      name: 'Macarons Assortis',
      description: 'Assortiment de 6 macarons aux saveurs variées : vanille, chocolat, framboise, pistache',
      price: 12.00
    }
  ],
  plats: [
    {
      name: 'Quiche Lorraine',
      description: 'Quiche traditionnelle aux lardons fumés, œufs fermiers et crème fraîche, salade verte',
      price: 8.50
    },
    {
      name: 'Sandwich Club Poulet',
      description: 'Pain de mie grillé, blanc de poulet rôti, bacon croustillant, avocat, tomate, salade',
      price: 9.20
    },
    {
      name: 'Salade César Revisitée',
      description: 'Salade romaine, croûtons maison, parmesan, blanc de poulet mariné, sauce César authentique',
      price: 11.50
    },
    {
      name: 'Burger Artisanal',
      description: 'Pain brioche maison, steak haché 180g, cheddar affiné, tomate, salade, frites maison',
      price: 13.80
    }
  ]
};

async function populateRichMenu() {
  console.log('🍽️ Enrichissement du menu Barista Café...');
  
  try {
    const db = await getDb();
    
    // Récupérer les catégories existantes
    const categories = await db.select().from(menuCategories);
    const categoryMap = categories.reduce((acc, cat: unknown) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📂 Catégories trouvées:', Object.keys(categoryMap));
    
    // Supprimer et recréer les éléments de menu
    await db.delete(menuItemImages);
    await db.delete(menuItems);
    console.log('🗑️ Ancien menu supprimé');
    
    let totalInserted = 0;
    
    // Insérer les nouveaux éléments enrichis
    for (const [categorySlug, items] of Object.entries(RICH_MENU_DATA)) {
      const categoryId = categoryMap[categorySlug];
      
      if (!categoryId) {
        console.warn(`⚠️ Catégorie non trouvée: ${categorySlug}`);
        continue;
      }
      
      console.log(`\n📋 Ajout des éléments pour: ${categorySlug}`);
      
      for (const item of items) {
        try {
          // Insérer l'élément de menu
          const [insertedItem] = await db.insert(menuItems).values({
            name: item.name,
            description: item.description,
            price: item.price,
            categoryId: categoryId,
            available: true,
            imageUrl: null // Sera géré par le système d'images
          }).returning();
          
          // Ajouter l'image associée
          const imageUrl = getItemImageUrl(item.name, categorySlug);
          await db.insert(menuItemImages).values({
            menuItemId: insertedItem.id,
            imageUrl: imageUrl,
            altText: `Image de ${item.name}`,
            isPrimary: true,
            uploadMethod: 'unsplash'
          });
          
          console.log(`✅ ${item.name} - ${item.price}€`);
          totalInserted++;
          
        } catch (error) {
          logger.error(`❌ Erreur pour ${item.name}:`, { error: error instanceof Error ? error.message : 'Erreur inconnue' });
        }
      }
    }
    
    console.log(`\n🎉 Menu enrichi avec succès !`);
    console.log(`📊 Total: ${totalInserted} éléments ajoutés`);
    console.log(`🖼️ Toutes les images associées aux éléments`);
    
    // Vérification finale
    const finalCount = await db.select().from(menuItems);
    console.log(`✅ Vérification: ${finalCount.length} éléments en base`);
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'enrichissement:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.main) {
  populateRichMenu()
    .then(() => {
      console.log('✅ Enrichissement terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Échec de l\'enrichissement:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      process.exit(1);
    });
}

export default populateRichMenu;