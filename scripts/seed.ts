
import { getDb } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, customers, employees,
  menuItemImages, reservations, orders, orderItems
} from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';

interface SeedOptions {
  environment: 'development' | 'production' | 'test';
  includeImages?: boolean;
  includeSampleReservations?: boolean;
}

export async function seedDatabase(options: SeedOptions) {
  const { environment, includeImages = true, includeSampleReservations = true } = options;
  
  console.log(`🌱 Seeding database pour l'environnement: ${environment}`);
  
  if (environment === 'production') {
    console.log('🚫 Seeding interdit en production');
    return;
  }

  const db = await getDb();

  try {
    // Vérifier si la base est déjà peuplée
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Base de données déjà peuplée');
      return;
    }

    // Créer les utilisateurs
    await seedUsers(db);
    
    // Créer les catégories et items de menu
    const categories = await seedMenuCategories(db);
    const menuItemsData = await seedMenuItems(db, categories);
    
    // Ajouter les images si demandé
    if (includeImages) {
      await seedMenuItemImages(db, menuItemsData);
    }
    
    // Créer les tables et clients
    await seedTables(db);
    const customersData = await seedCustomers(db);
    
    // Créer les employés
    await seedEmployees(db);
    
    // Ajouter des réservations d'exemple si demandé
    if (includeSampleReservations && environment === 'development') {
      await seedSampleReservations(db, customersData, menuItemsData);
    }

    console.log('✅ Seeding terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

async function seedUsers(db: any) {
  const adminPassword = await hashPassword('admin123');
  const employeePassword = await hashPassword('employee123');
  
  await db.insert(users).values([
    {
      username: 'admin',
      password: adminPassword,
      role: 'directeur',
      firstName: 'Admin',
      lastName: 'Barista',
      email: 'admin@barista-cafe.com'
    },
    {
      username: 'employee',
      password: employeePassword,
      role: 'employe',
      firstName: 'Employee',
      lastName: 'Barista',
      email: 'employee@barista-cafe.com'
    },
    {
      username: 'manager',
      password: await hashPassword('manager123'),
      role: 'gerant',
      firstName: 'Manager',
      lastName: 'Barista',
      email: 'manager@barista-cafe.com'
    }
  ]);
  
  console.log('✅ Utilisateurs créés');
}

async function seedMenuCategories(db: any) {
  const categories = await db.insert(menuCategories).values([
    { name: 'Cafés', description: 'Nos cafés artisanaux premium', slug: 'cafes', displayOrder: 1 },
    { name: 'Boissons chaudes', description: 'Thés, chocolats et boissons réconfortantes', slug: 'boissons-chaudes', displayOrder: 2 },
    { name: 'Boissons froides', description: 'Smoothies, jus frais et boissons glacées', slug: 'boissons-froides', displayOrder: 3 },
    { name: 'Pâtisseries', description: 'Viennoiseries et desserts maison', slug: 'patisseries', displayOrder: 4 },
    { name: 'Sandwichs', description: 'Sandwichs et plats légers', slug: 'sandwichs', displayOrder: 5 },
    { name: 'Salades', description: 'Salades fraîches et équilibrées', slug: 'salades', displayOrder: 6 }
  ]).returning();
  
  console.log('✅ Catégories de menu créées');
  return categories;
}

async function seedMenuItems(db: any, categories: any[]) {
  const menuItemsData = [
    // Cafés
    { name: 'Espresso', description: 'Café espresso italien authentique, corsé et aromatique', price: 2.50, categoryId: categories[0].id },
    { name: 'Cappuccino', description: 'Espresso avec mousse de lait crémeuse et saupoudrage de cacao', price: 3.80, categoryId: categories[0].id },
    { name: 'Latte', description: 'Café au lait avec art latte réalisé par nos baristas', price: 4.20, categoryId: categories[0].id },
    { name: 'Americano', description: 'Espresso allongé avec eau chaude, goût délicat', price: 3.00, categoryId: categories[0].id },
    { name: 'Macchiato', description: 'Espresso "taché" d\'une cuillère de mousse de lait', price: 3.20, categoryId: categories[0].id },
    
    // Boissons chaudes
    { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium, délicat et parfumé', price: 2.80, categoryId: categories[1].id },
    { name: 'Chocolat chaud', description: 'Chocolat belge avec chantilly maison', price: 3.50, categoryId: categories[1].id },
    { name: 'Thé vert Jasmin', description: 'Thé vert parfumé aux fleurs de jasmin', price: 3.00, categoryId: categories[1].id },
    { name: 'Chai Latte', description: 'Mélange d\'épices indiennes avec lait mousseux', price: 4.00, categoryId: categories[1].id },
    
    // Boissons froides
    { name: 'Smoothie mangue', description: 'Smoothie à la mangue fraîche et yaourt grec', price: 4.50, categoryId: categories[2].id },
    { name: 'Jus d\'orange frais', description: 'Jus d\'orange pressé à la demande', price: 3.20, categoryId: categories[2].id },
    { name: 'Iced Coffee', description: 'Café glacé avec glaçons et sirop au choix', price: 3.80, categoryId: categories[2].id },
    
    // Pâtisseries
    { name: 'Croissant beurre', description: 'Croissant artisanal au beurre de Normandie', price: 2.20, categoryId: categories[3].id },
    { name: 'Pain au chocolat', description: 'Viennoiserie feuilletée avec chocolat noir', price: 2.50, categoryId: categories[3].id },
    { name: 'Muffin myrtilles', description: 'Muffin fait maison aux myrtilles sauvages', price: 2.80, categoryId: categories[3].id },
    { name: 'Éclair au café', description: 'Éclair fourré à la crème pâtissière au café', price: 3.50, categoryId: categories[3].id },
    
    // Sandwichs
    { name: 'Sandwich jambon', description: 'Jambon de Bayonne, fromage et salade sur pain artisanal', price: 6.50, categoryId: categories[4].id },
    { name: 'Croque-monsieur', description: 'Croque-monsieur traditionnel gratiné au four', price: 7.20, categoryId: categories[4].id },
    { name: 'Club sandwich', description: 'Poulet, bacon, tomate, salade sur pain de mie grillé', price: 8.50, categoryId: categories[4].id },
    
    // Salades
    { name: 'Salade César', description: 'Salade romaine, parmesan, croûtons, sauce césar maison', price: 7.80, categoryId: categories[5].id },
    { name: 'Salade de chèvre', description: 'Mesclun, chèvre chaud, noix, miel et vinaigrette', price: 8.20, categoryId: categories[5].id }
  ];

  const insertedMenuItems = await db.insert(menuItems).values(menuItemsData).returning();
  console.log('✅ Items de menu créés');
  return insertedMenuItems;
}

async function seedMenuItemImages(db: any, menuItemsData: any[]) {
  const imageUrls = [
    'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4109766/pexels-photo-4109766.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1030894/pexels-photo-1030894.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/734983/pexels-photo-734983.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1756464/pexels-photo-1756464.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  const imageMappings = menuItemsData.slice(0, 5).map((item, index) => ({
    menuItemId: item.id,
    imageUrl: imageUrls[index],
    altText: item.name,
    isPrimary: true,
    uploadMethod: 'pexels'
  }));

  await db.insert(menuItemImages).values(imageMappings);
  console.log('✅ Images de menu ajoutées');
}

async function seedTables(db: any) {
  await db.insert(tables).values([
    { number: 1, capacity: 2, available: true },
    { number: 2, capacity: 4, available: true },
    { number: 3, capacity: 6, available: true },
    { number: 4, capacity: 2, available: true },
    { number: 5, capacity: 8, available: true },
    { number: 6, capacity: 4, available: true },
    { number: 7, capacity: 2, available: true },
    { number: 8, capacity: 6, available: true }
  ]);
  
  console.log('✅ Tables créées');
}

async function seedCustomers(db: any) {
  const customersData = await db.insert(customers).values([
    { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com', phone: '+33123456789', loyaltyPoints: 120 },
    { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com', phone: '+33987654321', loyaltyPoints: 85 },
    { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@email.com', phone: '+33456789123', loyaltyPoints: 200 },
    { firstName: 'Sophie', lastName: 'Dubois', email: 'sophie.dubois@email.com', phone: '+33456123789', loyaltyPoints: 50 },
    { firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@email.com', phone: '+33789123456', loyaltyPoints: 150 }
  ]).returning();
  
  console.log('✅ Clients créés');
  return customersData;
}

async function seedEmployees(db: any) {
  const allUsers = await db.select().from(users);
  
  const employeesData = allUsers.map((user, index) => ({
    userId: user.id,
    firstName: user.firstName || 'Employee',
    lastName: user.lastName || 'Barista',
    position: user.role === 'directeur' ? 'Directeur' : user.role === 'gerant' ? 'Gérant' : 'Serveur',
    hourlyRate: user.role === 'directeur' ? 25.0 : user.role === 'gerant' ? 20.0 : 15.0,
    hireDate: new Date(2023, index * 2, 1),
    isActive: true
  }));

  await db.insert(employees).values(employeesData);
  console.log('✅ Employés créés');
}

async function seedSampleReservations(db: any, customersData: any[], menuItemsData: any[]) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservationsData = [
    {
      customerId: customersData[0].id,
      tableId: 1,
      date: tomorrow.toISOString().split('T')[0],
      time: '12:00',
      partySize: 2,
      status: 'confirmed',
      notes: 'Anniversaire - demande une table près de la fenêtre'
    },
    {
      customerId: customersData[1].id,
      tableId: 3,
      date: tomorrow.toISOString().split('T')[0],
      time: '19:30',
      partySize: 4,
      status: 'confirmed',
      notes: 'Dîner d\'affaires'
    }
  ];

  await db.insert(reservations).values(reservationsData);
  console.log('✅ Réservations d\'exemple créées');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development';
  
  seedDatabase({ 
    environment,
    includeImages: true,
    includeSampleReservations: true
  }).catch((error) => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  });
}
