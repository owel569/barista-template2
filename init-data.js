import { Client } from 'pg';

// Configuration de la base de données
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/barista_cafe'
});

async function initializeData() {
  try {
    console.log('🌱 Initialisation des données...');

    await client.connect();

    // Créer un utilisateur admin
    await client.query(`
      INSERT INTO users (username, password, role, firstName, lastName, email, createdAt, updatedAt)
      VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'directeur', 'Admin', 'Système', 'admin@barista.com', NOW(), NOW())
      ON CONFLICT (username) DO NOTHING;
    `);

    // Créer des catégories de menu
    await client.query(`
      INSERT INTO menuCategories (name, description, slug, displayOrder, createdAt, updatedAt)
      VALUES 
        ('Cafés', 'Nos cafés artisanaux', 'cafes', 1, NOW(), NOW()),
        ('Boissons chaudes', 'Thés et boissons chaudes', 'boissons-chaudes', 2, NOW(), NOW()),
        ('Pâtisseries', 'Pâtisseries et desserts', 'patisseries', 3, NOW(), NOW()),
        ('Sandwichs', 'Sandwichs et plats légers', 'sandwichs', 4, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Obtenir les IDs des catégories
    const categoriesResult = await client.query('SELECT id, slug FROM menuCategories');
    const categories = {};
    categoriesResult.rows.forEach(row => {
      categories[row.slug] = row.id;
    });

    // Créer des éléments de menu
    await client.query(`
      INSERT INTO menuItems (name, description, price, categoryId, available, createdAt, updatedAt)
      VALUES 
        ('Espresso', 'Café espresso italien authentique', 2.50, $1, true, NOW(), NOW()),
        ('Cappuccino', 'Espresso avec mousse de lait crémeuse', 3.80, $1, true, NOW(), NOW()),
        ('Latte', 'Café au lait avec art latte', 4.20, $1, true, NOW(), NOW()),
        ('Thé Earl Grey', 'Thé noir bergamote premium', 2.80, $2, true, NOW(), NOW()),
        ('Chocolat chaud', 'Chocolat belge avec chantilly', 3.50, $2, true, NOW(), NOW()),
        ('Croissant', 'Croissant artisanal au beurre', 2.20, $3, true, NOW(), NOW()),
        ('Muffin myrtilles', 'Muffin fait maison aux myrtilles', 2.80, $3, true, NOW(), NOW()),
        ('Sandwich jambon', 'Sandwich jambon fromage sur pain artisanal', 6.50, $4, true, NOW(), NOW())
      ON CONFLICT (name, categoryId) DO NOTHING;
    `, [categories['cafes'], categories['boissons-chaudes'], categories['patisseries'], categories['sandwichs']]);

    // Créer des tables
    await client.query(`
      INSERT INTO tables (number, capacity, status, location, createdAt, updatedAt)
      VALUES 
        (1, 2, 'libre', 'Terrasse', NOW(), NOW()),
        (2, 4, 'libre', 'Salon principal', NOW(), NOW()),
        (3, 6, 'libre', 'Salon principal', NOW(), NOW()),
        (4, 2, 'libre', 'Coin lecture', NOW(), NOW()),
        (5, 8, 'libre', 'Salle privée', NOW(), NOW())
      ON CONFLICT (number) DO NOTHING;
    `);

    // Créer des clients
    await client.query(`
      INSERT INTO customers (firstName, lastName, email, phone, loyaltyPoints, createdAt, updatedAt)
      VALUES 
        ('Emma', 'Durand', 'emma.durand@email.com', '0123456789', 120, NOW(), NOW()),
        ('Julien', 'Petit', 'julien.petit@email.com', '0123456790', 85, NOW(), NOW()),
        ('Camille', 'Roux', 'camille.roux@email.com', '0123456791', 200, NOW(), NOW()),
        ('Thomas', 'Garcia', 'thomas.garcia@email.com', '0123456792', 50, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `);

    // Créer des employés (table employees n'existe pas dans le schéma, on va créer des utilisateurs employés)
    await client.query(`
      INSERT INTO users (username, password, role, firstName, lastName, email, createdAt, updatedAt)
      VALUES 
        ('sophie.dubois', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employe', 'Sophie', 'Dubois', 'sophie.dubois@barista-cafe.com', NOW(), NOW()),
        ('antoine.rousseau', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employe', 'Antoine', 'Rousseau', 'antoine.rousseau@barista-cafe.com', NOW(), NOW()),
        ('clara.moreau', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Clara', 'Moreau', 'clara.moreau@barista-cafe.com', NOW(), NOW())
      ON CONFLICT (username) DO NOTHING;
    `);

    // Créer quelques commandes d'exemple
    await client.query(`
      INSERT INTO orders (customerId, totalAmount, status, createdAt, updatedAt)
      VALUES 
        (1, 15.50, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        (2, 8.30, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
        (3, 22.75, 'pending', NOW(), NOW()),
        (1, 12.20, 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
      ON CONFLICT DO NOTHING;
    `);

    // Créer quelques réservations d'exemple
    await client.query(`
      INSERT INTO reservations (customerId, tableId, date, time, partySize, status, createdAt)
      VALUES 
        (1, 2, '2025-01-20', '19:00', 4, 'confirmed', NOW()),
        (2, 1, '2025-01-21', '12:30', 2, 'pending', NOW()),
        (3, 3, '2025-01-22', '20:00', 6, 'confirmed', NOW())
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Données initialisées avec succès !');
    console.log('🔐 Connexion admin : username=admin, password=admin123');
    console.log('👥 Employés créés : sophie.dubois, antoine.rousseau, clara.moreau');
    console.log('🍽️ Menu avec 8 articles dans 4 catégories');
    console.log('🪑 5 tables créées');
    console.log('👨‍👩‍👧‍👦 4 clients avec points de fidélité');
    console.log('📦 Commandes et réservations d\'exemple ajoutées');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Exécuter le script
if (require.main === module) {
  initializeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}