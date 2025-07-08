import { storage } from './storage';
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function insertTestData() {
  console.log('📝 Insertion des données de test...');
  
  try {
    // 1. Création d'utilisateurs supplémentaires
    console.log('👥 Création d\'utilisateurs...');
    
    // Vérifier si les utilisateurs existent déjà
    const existingMarie = await storage.getUserByUsername('marie_manager');
    if (!existingMarie) {
      await storage.createUser({
        username: 'marie_manager',
        password: await hashPassword('marie123'),
        role: 'directeur'
      });
      console.log('✅ Utilisateur marie_manager créé');
    }
    
    const existingPierre = await storage.getUserByUsername('pierre_employe');
    if (!existingPierre) {
      await storage.createUser({
        username: 'pierre_employe',
        password: await hashPassword('pierre123'),
        role: 'employe'
      });
      console.log('✅ Utilisateur pierre_employe créé');
    }

    // 2. Création de clients de test
    console.log('👤 Création de clients...');
    const clients = [
      { 
        firstName: 'Sophie',
        lastName: 'Laurent',
        email: 'sophie.laurent@email.com', 
        phone: '+33612345678',
        address: '123 Rue de la Paix, Paris',
        loyaltyPoints: 150,
        totalSpent: 450.50,
        lastVisit: new Date('2024-07-05').toISOString(),
        preferredContactMethod: 'email' as const
      },
      { 
        firstName: 'Jean-Marc',
        lastName: 'Dubois',
        email: 'jm.dubois@email.com', 
        phone: '+33623456789',
        address: '456 Avenue des Champs, Lyon',
        loyaltyPoints: 85,
        totalSpent: 280.75,
        lastVisit: new Date('2024-07-03').toISOString(),
        preferredContactMethod: 'phone' as const
      },
      { 
        firstName: 'Emma',
        lastName: 'Martin',
        email: 'emma.martin@email.com', 
        phone: '+33634567890',
        address: '789 Boulevard Saint-Germain, Paris',
        loyaltyPoints: 220,
        totalSpent: 680.00,
        lastVisit: new Date('2024-07-06').toISOString(),
        preferredContactMethod: 'email' as const
      },
      { 
        firstName: 'Thomas',
        lastName: 'Petit',
        email: 'thomas.petit@email.com', 
        phone: '+33645678901',
        address: '321 Rue de Rivoli, Paris',
        loyaltyPoints: 45,
        totalSpent: 125.25,
        lastVisit: new Date('2024-07-01').toISOString(),
        preferredContactMethod: 'email' as const
      }
    ];

    for (const client of clients) {
      try {
        const existingClient = await storage.getCustomerByEmail(client.email);
        if (!existingClient) {
          await storage.createCustomer(client);
          console.log(`✅ Client ${client.firstName} ${client.lastName} créé`);
        }
      } catch (error) {
        console.log(`⚠️  Client ${client.firstName} ${client.lastName} existe déjà`);
      }
    }

    // 3. Création d'employés de test
    console.log('👨‍💼 Création d\'employés...');
    const employees = [
      {
        firstName: 'Alice',
        lastName: 'Moreau',
        email: 'alice.moreau@barista-cafe.com',
        phone: '+33656789012',
        position: 'Barista Senior',
        department: 'Service',
        salary: '2800',
        hireDate: new Date('2023-03-15').toISOString(),
        status: 'active' as const,
        address: '12 rue de la République, Paris'
      },
      {
        firstName: 'Nicolas',
        lastName: 'Rousseau',
        email: 'nicolas.rousseau@barista-cafe.com',
        phone: '+33667890123',
        position: 'Serveur',
        department: 'Service',
        salary: '2200',
        hireDate: new Date('2023-08-20').toISOString(),
        status: 'active' as const,
        address: '25 avenue Montaigne, Paris'
      },
      {
        firstName: 'Camille',
        lastName: 'Leroy',
        email: 'camille.leroy@barista-cafe.com',
        phone: '+33678901234',
        position: 'Pâtissier',
        department: 'Cuisine',
        salary: '2500',
        hireDate: new Date('2024-01-10').toISOString(),
        status: 'active' as const,
        address: '8 place Vendôme, Paris'
      }
    ];

    for (const employee of employees) {
      try {
        const existingEmployee = await storage.getEmployeeByEmail(employee.email);
        if (!existingEmployee) {
          await storage.createEmployee(employee);
          console.log(`✅ Employé ${employee.firstName} ${employee.lastName} créé`);
        }
      } catch (error) {
        console.log(`⚠️  Employé ${employee.firstName} ${employee.lastName} existe déjà`);
      }
    }

    // 4. Création de réservations variées
    console.log('📅 Création de réservations...');
    const reservations = [
      {
        customerName: 'Sophie Laurent',
        customerEmail: 'sophie.laurent@email.com',
        customerPhone: '+33612345678',
        date: new Date('2024-07-10').toISOString(),
        time: '10:00',
        guests: 2,
        status: 'confirmed' as const,
        notes: 'Table près de la fenêtre si possible'
      },
      {
        customerName: 'Jean-Marc Dubois',
        customerEmail: 'jm.dubois@email.com',
        customerPhone: '+33623456789',
        date: new Date('2024-07-10').toISOString(),
        time: '14:30',
        guests: 4,
        status: 'pending' as const,
        notes: 'Réunion d\'affaires'
      },
      {
        customerName: 'Emma Martin',
        customerEmail: 'emma.martin@email.com',
        customerPhone: '+33634567890',
        date: new Date('2024-07-11').toISOString(),
        time: '09:00',
        guests: 1,
        status: 'confirmed' as const,
        notes: 'Petit-déjeuner de travail'
      },
      {
        customerName: 'Thomas Petit',
        customerEmail: 'thomas.petit@email.com',
        customerPhone: '+33645678901',
        date: new Date('2024-07-12').toISOString(),
        time: '16:00',
        guests: 3,
        status: 'cancelled' as const,
        notes: 'Annulé pour cause de maladie'
      }
    ];

    for (const reservation of reservations) {
      try {
        await storage.createReservation(reservation);
        console.log(`✅ Réservation pour ${reservation.customerName} créée`);
      } catch (error) {
        console.log(`⚠️  Réservation pour ${reservation.customerName} - erreur ou existe déjà`);
      }
    }

    // 5. Création de commandes
    console.log('🛒 Création de commandes...');
    const orders = [
      {
        customerName: 'Sophie Laurent',
        customerEmail: 'sophie.laurent@email.com',
        customerPhone: '+33612345678',
        total: 23.50,
        status: 'completed' as const,
        type: 'dine-in' as const,
        notes: 'Sans sucre pour le café'
      },
      {
        customerName: 'Jean-Marc Dubois',
        customerEmail: 'jm.dubois@email.com',
        customerPhone: '+33623456789',
        total: 45.75,
        status: 'preparing' as const,
        type: 'takeaway' as const,
        notes: 'Commande à emporter'
      },
      {
        customerName: 'Emma Martin',
        customerEmail: 'emma.martin@email.com',
        customerPhone: '+33634567890',
        total: 18.00,
        status: 'pending' as const,
        type: 'delivery' as const,
        notes: 'Livraison rapide demandée'
      }
    ];

    for (const order of orders) {
      try {
        await storage.createOrder(order);
        console.log(`✅ Commande pour ${order.customerName} créée`);
      } catch (error) {
        console.log(`⚠️  Commande pour ${order.customerName} - erreur ou existe déjà`);
      }
    }

    // 6. Création de messages de contact
    console.log('📧 Création de messages...');
    const messages = [
      {
        name: 'Julie Garnier',
        email: 'julie.garnier@email.com',
        phone: '+33689012345',
        subject: 'Demande de privatisation',
        message: 'Bonjour, je souhaiterais privatiser votre café pour un événement d\'entreprise le 25 juillet. Pouvez-vous me faire un devis pour 30 personnes ?',
        status: 'unread' as const
      },
      {
        name: 'Michel Durand',
        email: 'michel.durand@email.com',
        phone: '+33690123456',
        subject: 'Compliments',
        message: 'Excellent service hier soir ! Le café était parfait et l\'équipe très accueillante. Merci beaucoup !',
        status: 'read' as const
      },
      {
        name: 'Léa Bonnet',
        email: 'lea.bonnet@email.com',
        phone: '+33601234567',
        subject: 'Allergie alimentaire',
        message: 'Bonjour, j\'ai une allergie aux noix. Pouvez-vous me dire quels sont les produits sans noix dans votre menu ?',
        status: 'unread' as const
      }
    ];

    for (const message of messages) {
      try {
        await storage.createContactMessage(message);
        console.log(`✅ Message de ${message.name} créé`);
      } catch (error) {
        console.log(`⚠️  Message de ${message.name} - erreur ou existe déjà`);
      }
    }

    // 7. Création d'horaires de travail
    console.log('⏰ Création d\'horaires...');
    const workShifts = [
      {
        employeeId: 1,
        date: new Date('2024-07-08').toISOString(),
        startTime: '08:00',
        endTime: '16:00',
        position: 'Barista'
      },
      {
        employeeId: 2,
        date: new Date('2024-07-08').toISOString(),
        startTime: '10:00',
        endTime: '18:00',
        position: 'Serveur'
      },
      {
        employeeId: 3,
        date: new Date('2024-07-09').toISOString(),
        startTime: '06:00',
        endTime: '14:00',
        position: 'Pâtissier'
      }
    ];

    for (const shift of workShifts) {
      try {
        await storage.createWorkShift(shift);
        console.log(`✅ Horaire pour employé ${shift.employeeId} créé`);
      } catch (error) {
        console.log(`⚠️  Horaire pour employé ${shift.employeeId} - erreur ou existe déjà`);
      }
    }

    // 8. Création de logs d'activité
    console.log('📊 Création de logs...');
    const activityLogs = [
      {
        userId: 1,
        action: 'Création de réservation',
        entity: 'reservation',
        entityId: 1,
        details: 'Réservation créée pour Sophie Laurent'
      },
      {
        userId: 2,
        action: 'Modification de commande',
        entity: 'order',
        entityId: 1,
        details: 'Statut modifié en "terminé"'
      },
      {
        userId: 1,
        action: 'Création d\'employé',
        entity: 'employee',
        entityId: 1,
        details: 'Nouvel employé Alice Moreau ajouté'
      }
    ];

    for (const log of activityLogs) {
      try {
        await storage.createActivityLog(log);
        console.log(`✅ Log d'activité créé: ${log.action}`);
      } catch (error) {
        console.log(`⚠️  Log d'activité - erreur ou existe déjà`);
      }
    }

    console.log('✅ Données de test insérées avec succès!');
    console.log('📈 Résumé des données créées:');
    console.log('- 2 utilisateurs supplémentaires');
    console.log('- 4 clients avec points de fidélité');
    console.log('- 3 employés avec salaires');
    console.log('- 4 réservations (confirmées, en attente, annulées)');
    console.log('- 3 commandes (terminées, en préparation, en attente)');
    console.log('- 3 messages de contact');
    console.log('- 3 horaires de travail');
    console.log('- 3 logs d\'activité');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
  }
}

// Fonction pour nettoyer les données de test
export async function clearTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    // Cette fonction peut être utilisée pour nettoyer les données de test
    // Pour l'instant, on ne l'implémente pas pour éviter la suppression accidentelle
    console.log('⚠️  Nettoyage non implémenté pour éviter la suppression accidentelle');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}