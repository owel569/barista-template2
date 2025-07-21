import 'dotenv/config';
import { getDb } from '../server/db';
import { menuItems, menuCategories, menuItemImages } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkMenuContent() {
  try {
    console.log('📋 Vérification du contenu du menu...\n');

    const db = await getDb();

    // Récupérer toutes les catégories
    const categories = await db.select().from(menuCategories);
    console.log(`📂 Catégories (${categories.length}) :`);
    categories.forEach(cat => {
      console.log(`   • ${cat.name} (${cat.slug}) - Ordre: ${cat.displayOrder}`);
    });

    // Récupérer tous les articles avec leurs catégories
    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        available: menuItems.available,
        categoryName: menuCategories.name,
        categorySlug: menuCategories.slug
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id));

    console.log(`\n🍽️ Articles du menu (${items.length}) :`);

    // Grouper par catégorie
    const itemsByCategory = items.reduce((acc, item: unknown) => {
      const category = item.categoryName || 'Sans catégorie';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    for (const [category, categoryItems] of Object.entries(itemsByCategory)) {
      console.log(`\n   📋 ${category} (${categoryItems.length} articles):`);
      categoryItems.forEach(item => {
        const status = item.available ? '✅' : '❌';
        console.log(`      ${status} ${item.name} - ${item.price}€`);
        if (item.description) {
          console.log(`         "${item.description.substring(0, 80)}..."`);
        }
      });
    }

    // Vérifier les images
    const imagesCount = await db.select().from(menuItemImages);
    console.log(`\n🖼️ Images: ${imagesCount.length} images associées`);

    // Statistiques
    const availableItems = items.filter(item => (item as any).available).length;
    const unavailableItems = items.filter(item => !(item as any).available).length;

    console.log(`\n📊 Statistiques :`);
    console.log(`   • Articles disponibles: ${availableItems}`);
    console.log(`   • Articles indisponibles: ${unavailableItems}`);
    console.log(`   • Prix moyen: ${(items.reduce((sum, item) => sum + item.price, 0) / items.length).toFixed(2)}€`);
    console.log(`   • Prix min: ${Math.min(...items.map(item => item.price))}€`);
    console.log(`   • Prix max: ${Math.max(...items.map(item => item.price))}€`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécution directe du script
checkMenuContent().catch(console.error);

export default checkMenuContent;