import { getDb } from './server/db.js';
import { menuItems, menuItemImages } from './shared/schema.js';

async function addMoreItems() {
  try {
    const db = await getDb();
    
    console.log('🍽️ Ajout d\'articles supplémentaires au menu...');
    
    // Nouveaux articles par catégorie
    const newMenuItems = [
      // Cafés (categoryId: 1)
      {
        name: 'Americano',
        description: 'Espresso allongé avec eau chaude, idéal pour ceux qui préfèrent un café moins intense',
        price: 2.80,
        categoryId: 1,
        available: true
      },
      {
        name: 'Café Mocha',
        description: 'Espresso avec chocolat chaud et chantilly, le parfait mélange café-chocolat',
        price: 4.20,
        categoryId: 1,
        available: true
      },
      {
        name: 'Café Frappé',
        description: 'Café glacé avec crème fouettée et sirop vanille',
        price: 4.80,
        categoryId: 1,
        available: true
      },
      {
        name: 'Flat White',
        description: 'Café à l\'australienne avec lait micro-moussé et espresso double',
        price: 4.10,
        categoryId: 1,
        available: true
      },
      
      // Thés (categoryId: 2)
      {
        name: 'Thé Vert Premium',
        description: 'Thé vert japonais de qualité supérieure, riche en antioxydants',
        price: 3.20,
        categoryId: 2,
        available: true
      },
      {
        name: 'Thé Chai Latte',
        description: 'Mélange épicé de thé noir aux épices traditionnelles indiennes',
        price: 3.80,
        categoryId: 2,
        available: true
      },
      {
        name: 'Thé Rooibos',
        description: 'Thé rouge d\'Afrique du Sud, naturellement sans caféine',
        price: 3.40,
        categoryId: 2,
        available: true
      },
      
      // Pâtisseries (categoryId: 3)
      {
        name: 'Éclair au Chocolat',
        description: 'Pâte à choux garnie de crème pâtissière et glaçage chocolat',
        price: 4.20,
        categoryId: 3,
        available: true
      },
      {
        name: 'Macarons Français',
        description: 'Assortiment de macarons colorés aux saveurs variées',
        price: 2.50,
        categoryId: 3,
        available: true
      },
      {
        name: 'Tarte aux Pommes',
        description: 'Tarte traditionnelle aux pommes avec pâte brisée maison',
        price: 4.80,
        categoryId: 3,
        available: true
      },
      {
        name: 'Cheesecake',
        description: 'Cheesecake new-yorkais avec coulis de fruits rouges',
        price: 5.20,
        categoryId: 3,
        available: true
      },
      
      // Boissons froides (categoryId: 4)
      {
        name: 'Jus d\'Orange Pressé',
        description: 'Jus d\'orange fraîchement pressé, 100% naturel',
        price: 3.80,
        categoryId: 4,
        available: true
      },
      {
        name: 'Smoothie Tropical',
        description: 'Mélange de mangue, ananas et noix de coco',
        price: 5.80,
        categoryId: 4,
        available: true
      },
      {
        name: 'Limonade Artisanale',
        description: 'Limonade maison avec citrons frais et menthe',
        price: 4.20,
        categoryId: 4,
        available: true
      },
      {
        name: 'Milk-shake Vanille',
        description: 'Milk-shake crémeux à la vanille avec chantilly',
        price: 5.40,
        categoryId: 4,
        available: true
      }
    ];
    
    // Insérer les nouveaux articles
    for (const item of newMenuItems) {
      try {
        const result = await db.insert(menuItems).values(item).onConflictDoNothing().returning();
        if (result.length > 0) {
          console.log(`✅ Ajouté: ${item.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Erreur pour ${item.name)}:`, error.message);
      }
    }
    
    console.log('🎉 Articles supplémentaires ajoutés avec succès!');
    
    // Vérifier le total
    const totalItems = await db.select().from(menuItems);
    console.log(`📊 Total d'articles maintenant: ${totalItems.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des articles:', error);
  }
}

addMoreItems();