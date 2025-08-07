import { getDb } from '../server/db.js';
import { customers, orders, orderItems, reservations, menuItems } from '../shared/schema.js';

async function populateDatabase() {
  console.log('🌱 Début du peuplement de la base de données...');
  
  try {
    const db = await getDb();
    
    // Ajouter des clients
    console.log('👥 Ajout des clients...');
    const clientsData = [
      {
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-06-15'),
        loyaltyPoints: 250
      },
      {
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@email.com',
        phone: '+33234567890',
        dateOfBirth: new Date('1978-03-22'),
        loyaltyPoints: 180
      },
      {
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie.bernard@email.com',
        phone: '+33345678901',
        dateOfBirth: new Date('1992-11-08'),
        loyaltyPoints: 320
      },
      {
        firstName: 'Thomas',
        lastName: 'Petit',
        email: 'thomas.petit@email.com',
        phone: '+33456789012',
        dateOfBirth: new Date('1989-07-04'),
        loyaltyPoints: 95
      },
      {
        firstName: 'Julie',
        lastName: 'Moreau',
        email: 'julie.moreau@email.com',
        phone: '+33567890123',
        dateOfBirth: new Date('1995-02-18'),
        loyaltyPoints: 420
      }
    ];

    const insertedCustomers = await db.insert(customers).values(clientsData).returning();
    console.log(`✅ ${insertedCustomers.length} clients ajoutés`);

    // Ajouter des réservations
    console.log('📅 Ajout des réservations...');
    const reservationsData = [
      {
        customerId: insertedCustomers[0].id,
        tableId: 1,
        date: new Date('2025-07-20'),
        time: '19:30',
        partySize: 2,
        status: 'confirmed',
        specialRequests: 'Table près de la fenêtre'
      },
      {
        customerId: insertedCustomers[1].id,
        tableId: 2,
        date: new Date('2025-07-21'),
        time: '20:00',
        partySize: 4,
        status: 'confirmed',
        specialRequests: null
      },
      {
        customerId: insertedCustomers[2].id,
        tableId: 3,
        date: new Date('2025-07-22'),
        time: '18:00',
        partySize: 3,
        status: 'pending',
        specialRequests: 'Anniversaire - gâteau'
      },
      {
        customerId: insertedCustomers[3].id,
        tableId: 4,
        date: new Date('2025-07-19'),
        time: '12:30',
        partySize: 2,
        status: 'completed',
        specialRequests: 'Repas d\'affaires'
      }
    ];

    const insertedReservations = await db.insert(reservations).values(reservationsData).returning();
    console.log(`✅ ${insertedReservations.length} réservations ajoutées`);

    // Ajouter des commandes
    console.log('🛒 Ajout des commandes...');
    const ordersData = [
      {
        customerId: insertedCustomers[0].id,
        tableId: 1,
        type: 'dine_in',
        status: 'completed',
        totalAmount: 24.50,
        paymentMethod: 'card',
        notes: 'Service rapide demandé'
      },
      {
        customerId: insertedCustomers[1].id,
        tableId: null,
        type: 'takeaway',
        status: 'preparing',
        totalAmount: 15.80,
        paymentMethod: 'cash',
        notes: null
      },
      {
        customerId: insertedCustomers[2].id,
        tableId: 2,
        type: 'dine_in',
        status: 'served',
        totalAmount: 42.30,
        paymentMethod: 'card',
        notes: 'Menu spécial végétarien'
      },
      {
        customerId: null,
        tableId: null,
        type: 'takeaway',
        status: 'completed',
        totalAmount: 8.90,
        paymentMethod: 'mobile',
        notes: 'Commande express'
      }
    ];

    const insertedOrders = await db.insert(orders).values(ordersData).returning();
    console.log(`✅ ${insertedOrders.length} commandes ajoutées`);

    // Ajouter des items aux commandes
    console.log('📋 Ajout des items aux commandes...');
    const orderItemsData = [
      // Commande 1 (Marie)
      { orderId: insertedOrders[0].id, menuItemId: 1, quantity: 2, unitPrice: 2.50, totalPrice: 5.00, notes: 'Sucre en plus' },
      { orderId: insertedOrders[0].id, menuItemId: 8, quantity: 2, unitPrice: 2.20, totalPrice: 4.40, notes: null },
      { orderId: insertedOrders[0].id, menuItemId: 3, quantity: 1, unitPrice: 4.20, totalPrice: 4.20, notes: 'Lait d\'avoine' },
      
      // Commande 2 (Pierre)
      { orderId: insertedOrders[1].id, menuItemId: 2, quantity: 1, unitPrice: 3.80, totalPrice: 3.80, notes: null },
      { orderId: insertedOrders[1].id, menuItemId: 9, quantity: 2, unitPrice: 2.80, totalPrice: 5.60, notes: 'À emporter' },
      
      // Commande 3 (Sophie)
      { orderId: insertedOrders[2].id, menuItemId: 4, quantity: 2, unitPrice: 3.20, totalPrice: 6.40, notes: null },
      { orderId: insertedOrders[2].id, menuItemId: 12, quantity: 1, unitPrice: 7.80, totalPrice: 7.80, notes: 'Sans croûtons' },
      { orderId: insertedOrders[2].id, menuItemId: 6, quantity: 2, unitPrice: 3.50, totalPrice: 7.00, notes: 'Chantilly' },
      { orderId: insertedOrders[2].id, menuItemId: 10, quantity: 1, unitPrice: 3.20, totalPrice: 3.20, notes: null },
      
      // Commande 4 (Anonyme)
      { orderId: insertedOrders[3].id, menuItemId: 1, quantity: 1, unitPrice: 2.50, totalPrice: 2.50, notes: null },
      { orderId: insertedOrders[3].id, menuItemId: 8, quantity: 1, unitPrice: 2.20, totalPrice: 2.20, notes: null }
    ];

    const insertedOrderItems = await db.insert(orderItems).values(orderItemsData).returning();
    console.log(`✅ ${insertedOrderItems.length} items de commande ajoutés`);

    console.log('🎉 Base de données peuplée avec succès !');
    console.log(`
📊 Résumé des données ajoutées :
- ${insertedCustomers.length} clients
- ${insertedReservations.length} réservations  
- ${insertedOrders.length} commandes
- ${insertedOrderItems.length} items de commande
    `);

  } catch (error) {
    logger.error('❌ Erreur lors du peuplement :', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    throw error;
  }
}

// Exécuter le script
populateDatabase()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erreur fatale :', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    process.exit(1);
  });