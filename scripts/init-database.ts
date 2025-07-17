import { getDb } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, customers, orders, orderItems, contactMessages
} from '../shared/schema';
import { sql } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

export async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation de la base de données...');

    const db = await getDb();

    // Vérifier si des données existent déjà
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Données déjà présentes');
      return;
    }

    console.log('📝 Insertion des données initiales...');

    // Créer l'utilisateur admin
    const adminPassword = await hashPassword('admin123');
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      role: 'directeur',
      firstName: 'Admin',
      lastName: 'Barista',
      email: 'admin@barista-cafe.com'
    });

    // Créer les catégories
    const categories = await db.insert(menuCategories).values([
      { name: 'Cafés', description: 'Nos cafés artisanaux', slug: 'cafes', displayOrder: 1 },
      { name: 'Boissons', description: 'Boissons chaudes et froides', slug: 'boissons', displayOrder: 2 },
      { name: 'Pâtisseries', description: 'Pâtisseries et desserts', slug: 'patisseries', displayOrder: 3 },
      { name: 'Plats', description: 'Plats et sandwichs', slug: 'plats', displayOrder: 4 }
    ]).returning();

    // Créer les éléments de menu
    await db.insert(menuItems).values([
      { name: 'Espresso', description: 'Café espresso italien', price: 2.50, categoryId: categories[0].id },
      { name: 'Cappuccino', description: 'Espresso avec mousse de lait', price: 3.80, categoryId: categories[0].id },
      { name: 'Latte', description: 'Café au lait avec art latte', price: 4.20, categoryId: categories[0].id },
      { name: 'Thé Earl Grey', description: 'Thé noir bergamote', price: 2.80, categoryId: categories[1].id },
      { name: 'Chocolat chaud', description: 'Chocolat belge', price: 3.50, categoryId: categories[1].id },
      { name: 'Croissant', description: 'Croissant au beurre', price: 2.20, categoryId: categories[2].id },
      { name: 'Cookies au chocolat', description: 'Cookies fait maison', price: 2.80, categoryId: categories[2].id },
      { name: 'Sandwich Club', description: 'Sandwich traditionnel', price: 6.50, categoryId: categories[3].id }
    ]);

    // Créer les tables
    await db.insert(tables).values([
      { number: 1, capacity: 2 },
      { number: 2, capacity: 4 },
      { number: 3, capacity: 6 },
      { number: 4, capacity: 2 }
    ]);

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}