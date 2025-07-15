import { getDb } from './server/db.js';
import { menuItems, menuCategories } from './shared/schema.js';

async function checkMenu() {
  try {
    const db = await getDb();
    const items = await db.select().from(menuItems);
    const categories = await db.select().from(menuCategories);

    console.log('=== CATÉGORIES ===');
    categories.forEach(cat => console.log(`${cat.id}: ${cat.name} (${cat.slug})`));

    console.log('\n=== ARTICLES ===');
    items.forEach(item => console.log(`${item.id}: ${item.name} - ${item.price}€ (cat: ${item.categoryId})`));

    console.log(`\nTotal: ${items.length} articles dans ${categories.length} catégories`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkMenu();