
import { getDb } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, customers
} from '../shared/schema';

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
      console.log('📊 Données déjà présentes - initialisation ignorée');
      return { success: true, message: 'Base de données déjà initialisée' };
    }

    console.log('📝 Création des données initiales...');

    // Transaction pour assurer la cohérence
    const result = await db.transaction(async (tx) => {
      // 1. Créer l'utilisateur admin
      const adminPassword = await hashPassword('admin123');
      const [admin] = await tx.insert(users).values({
        username: 'admin',
        password: adminPassword,
        role: 'directeur',
        firstName: 'Admin',
        lastName: 'Barista',
        email: 'admin@barista-cafe.com'
      }).returning();

      // 2. Créer les catégories
      const categories = await tx.insert(menuCategories).values([
        { name: 'Cafés', description: 'Nos cafés artisanaux', slug: 'cafes', displayOrder: 1 },
        { name: 'Boissons', description: 'Boissons chaudes et froides', slug: 'boissons', displayOrder: 2 },
        { name: 'Pâtisseries', description: 'Pâtisseries fraîches', slug: 'patisseries', displayOrder: 3 },
        { name: 'Plats', description: 'Plats et sandwichs', slug: 'plats', displayOrder: 4 }
      ]).returning();

      // 3. Créer les articles de menu
      const menuItemsData = [
        // Cafés
        { name: 'Espresso', description: 'Café espresso italien traditionnel', price: 2.50, categoryId: categories[0].id },
        { name: 'Cappuccino', description: 'Espresso avec mousse de lait onctueux', price: 3.80, categoryId: categories[0].id },
        { name: 'Latte', description: 'Café au lait avec art latte', price: 4.20, categoryId: categories[0].id },
        { name: 'Americano', description: 'Café allongé américain', price: 3.20, categoryId: categories[0].id },
        
        // Boissons
        { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium', price: 2.80, categoryId: categories[1].id },
        { name: 'Chocolat chaud', description: 'Chocolat belge artisanal', price: 3.50, categoryId: categories[1].id },
        { name: 'Smoothie fruits rouges', description: 'Mix de fruits frais', price: 4.80, categoryId: categories[1].id },
        
        // Pâtisseries
        { name: 'Croissant au beurre', description: 'Croissant traditionnel français', price: 2.20, categoryId: categories[2].id },
        { name: 'Cookies au chocolat', description: 'Cookies maison aux pépites', price: 2.80, categoryId: categories[2].id },
        { name: 'Muffin myrtilles', description: 'Muffin moelleux aux myrtilles', price: 3.20, categoryId: categories[2].id },
        
        // Plats
        { name: 'Sandwich Club', description: 'Sandwich traditionnel complet', price: 6.50, categoryId: categories[3].id },
        { name: 'Salade César', description: 'Salade fraîche avec croûtons', price: 7.80, categoryId: categories[3].id }
      ];

      await tx.insert(menuItems).values(menuItemsData);

      // 4. Créer les tables
      await tx.insert(tables).values([
        { number: 1, capacity: 2 },
        { number: 2, capacity: 4 },
        { number: 3, capacity: 6 },
        { number: 4, capacity: 2 },
        { number: 5, capacity: 8 }
      ]);

      return {
        admin: admin.id,
        categories: categories.length,
        menuItems: menuItemsData.length,
        tables: 5
      };
    });

    console.log('✅ Base de données initialisée avec succès');
    console.log(`👤 Admin créé: admin/admin123`);
    console.log(`📂 ${result.categories} catégories créées`);
    console.log(`🍽️ ${result.menuItems} articles de menu créés`);
    console.log(`🪑 ${result.tables} tables créées`);

    return { success: true, message: 'Initialisation terminée', data: result };
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Initialisation terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de l\'initialisation:', error);
      process.exit(1);
    });
}
