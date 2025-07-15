#!/usr/bin/env tsx
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { getDb } from '../server/db';
import { users, menuCategories, menuItems, tables, menuItemImages } from '../shared/schema';

async function initializeDatabase() {
  console.log('🔧 Initialisation complète de la base de données...');
  
  try {
    const db = await getDb();
    
    // 1. Créer l'utilisateur admin
    console.log('👤 Création de l\'utilisateur admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'directeur',
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@barista-cafe.com'
    }).onConflictDoNothing();
    
    // 2. Créer les catégories de menu
    console.log('📂 Création des catégories de menu...');
    const categories = [
      { name: 'Cafés', description: 'Nos délicieux cafés artisanaux', slug: 'cafes', displayOrder: 1 },
      { name: 'Thés', description: 'Une sélection de thés premium', slug: 'thes', displayOrder: 2 },
      { name: 'Pâtisseries', description: 'Pâtisseries fraîches maison', slug: 'patisseries', displayOrder: 3 },
      { name: 'Boissons froides', description: 'Rafraîchissements et smoothies', slug: 'boissons-froides', displayOrder: 4 }
    ];
    
    for (const category of categories) {
      await db.insert(menuCategories).values(category).onConflictDoNothing();
    }
    
    // 3. Créer les éléments de menu
    console.log('☕ Création des éléments de menu...');
    const menuItemsData = [
      {
        name: 'Espresso Classique',
        description: 'Un espresso pur et intense, préparé avec nos grains arabica premium',
        price: '2.50',
        categoryId: 1,
        available: true
      },
      {
        name: 'Cappuccino',
        description: 'Espresso onctueux avec mousse de lait veloutée et une pincée de cacao',
        price: '3.50',
        categoryId: 1,
        available: true
      },
      {
        name: 'Latte Macchiato',
        description: 'Café doux avec lait chaud et mousse crémeuse, parfait pour commencer la journée',
        price: '4.00',
        categoryId: 1,
        available: true
      },
      {
        name: 'Thé Earl Grey',
        description: 'Thé noir premium aux notes de bergamote, servi avec du lait et du sucre',
        price: '3.00',
        categoryId: 2,
        available: true
      },
      {
        name: 'Croissant au Beurre',
        description: 'Croissant artisanal croustillant, feuilleté à souhait',
        price: '2.00',
        categoryId: 3,
        available: true
      },
      {
        name: 'Muffin Chocolat',
        description: 'Muffin moelleux aux pépites de chocolat noir belge',
        price: '3.50',
        categoryId: 3,
        available: true
      },
      {
        name: 'Smoothie Fruits Rouges',
        description: 'Mélange rafraîchissant de fruits rouges et yaourt grec',
        price: '5.50',
        categoryId: 4,
        available: true
      },
      {
        name: 'Chocolat Chaud',
        description: 'Chocolat chaud onctueux avec chantilly maison',
        price: '4.50',
        categoryId: 4,
        available: true
      }
    ];
    
    for (const item of menuItemsData) {
      await db.insert(menuItems).values(item).onConflictDoNothing();
    }
    
    // 4. Créer les tables
    console.log('🪑 Création des tables...');
    const tablesData = [
      { number: 1, capacity: 2, location: 'Terrasse', available: true },
      { number: 2, capacity: 4, location: 'Salle principale', available: true },
      { number: 3, capacity: 6, location: 'Salon privé', available: true },
      { number: 4, capacity: 2, location: 'Comptoir', available: true }
    ];
    
    for (const table of tablesData) {
      await db.insert(tables).values(table).onConflictDoNothing();
    }
    
    // 5. Ajouter des images Pexels HD par défaut
    console.log('🖼️ Ajout des images Pexels HD...');
    const imageData = [
      {
        menuItemId: 1,
        imageUrl: 'https://images.pexels.com/photos/28538132/pexels-photo-28538132.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Espresso Classique',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 2,
        imageUrl: 'https://images.pexels.com/photos/162947/pexels-photo-162947.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Cappuccino',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 3,
        imageUrl: 'https://images.pexels.com/photos/433145/pexels-photo-433145.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Latte Macchiato',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 4,
        imageUrl: 'https://images.pexels.com/photos/32754882/pexels-photo-32754882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Thé Earl Grey',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 5,
        imageUrl: 'https://images.pexels.com/photos/10560686/pexels-photo-10560686.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Croissant au Beurre',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 6,
        imageUrl: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Muffin Chocolat',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 7,
        imageUrl: 'https://images.pexels.com/photos/11160116/pexels-photo-11160116.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Smoothie Fruits Rouges',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      },
      {
        menuItemId: 8,
        imageUrl: 'https://images.pexels.com/photos/15529714/pexels-photo-15529714.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        altText: 'Chocolat Chaud',
        isPrimary: true,
        uploadMethod: 'pexels' as const
      }
    ];
    
    for (const image of imageData) {
      await db.insert(menuItemImages).values(image).onConflictDoNothing();
    }
    
    console.log('✅ Base de données initialisée avec succès !');
    console.log('📝 Compte admin créé: admin / admin123');
    console.log('🎯 Données de test ajoutées: 4 catégories, 8 éléments de menu, 4 tables');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initializeDatabase();