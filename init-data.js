
const { Client } = require('pg');

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
    
    // Créer des employés
    await client.query(`
      INSERT INTO employees (firstName, lastName, position, phone, email, hireDate, salary, createdAt, updatedAt)
      VALUES 
        ('Sophie', 'Dubois', 'Barista senior', '0123456789', 'sophie.dubois@barista-cafe.com', '2023-01-15', 2200, NOW(), NOW()),
        ('Antoine', 'Rousseau', 'Serveur', '0123456790', 'antoine.rousseau@barista-cafe.com', '2023-03-22', 1800, NOW(), NOW()),
        ('Clara', 'Moreau', 'Pâtissière', '0123456791', 'clara.moreau@barista-cafe.com', '2023-06-10', 2000, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `);
    
    console.log('✅ Données initialisées avec succès !');
    console.log('🔐 Connexion admin : username=admin, password=admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await client.end();
  }
}

initializeData();
