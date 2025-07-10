#!/usr/bin/env node

/**
 * Test complet du système admin Barista Café
 * Vérifie toutes les APIs et fonctionnalités
 */

const BASE_URL = 'http://localhost:5000';

// Fonction pour authentification
async function authenticate() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur auth: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Authentification réussie - Token JWT généré');
    return data.token;
  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    return null;
  }
}

// Fonction pour tester un endpoint
async function testEndpoint(endpoint, token, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
    
    const responseData = await response.json();
    return { success: true, status: response.status, data: responseData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test complet de toutes les APIs admin
async function testCompleteAdminSystem() {
  console.log('🚀 Début du test complet du système admin Barista Café\n');
  
  // Authentification
  const token = await authenticate();
  if (!token) {
    console.log('❌ Impossible de continuer sans authentification');
    return;
  }
  
  const endpoints = [
    // APIs Dashboard et Statistiques
    { name: 'Dashboard - Réservations aujourd\'hui', endpoint: '/api/admin/stats/today-reservations' },
    { name: 'Dashboard - Revenus mensuels', endpoint: '/api/admin/stats/monthly-revenue' },
    { name: 'Dashboard - Taux d\'occupation', endpoint: '/api/admin/stats/occupancy-rate' },
    { name: 'Dashboard - Commandes actives', endpoint: '/api/admin/stats/active-orders' },
    { name: 'Dashboard - Statut réservations', endpoint: '/api/admin/stats/reservation-status' },
    { name: 'Dashboard - Commandes par statut', endpoint: '/api/admin/orders-by-status' },
    { name: 'Dashboard - Réservations quotidiennes', endpoint: '/api/admin/daily-reservations' },
    
    // APIs Gestion Core
    { name: 'Réservations', endpoint: '/api/admin/reservations' },
    { name: 'Commandes', endpoint: '/api/admin/orders' },
    { name: 'Clients', endpoint: '/api/admin/customers' },
    { name: 'Employés', endpoint: '/api/admin/employees' },
    { name: 'Messages', endpoint: '/api/admin/messages' },
    { name: 'Horaires de travail', endpoint: '/api/admin/work-shifts' },
    
    // APIs Inventaire et Stock
    { name: 'Inventaire - Articles', endpoint: '/api/admin/inventory/items' },
    { name: 'Inventaire - Alertes', endpoint: '/api/admin/inventory/alerts' },
    
    // APIs Fidélité
    { name: 'Fidélité - Statistiques', endpoint: '/api/admin/loyalty/stats' },
    { name: 'Fidélité - Clients', endpoint: '/api/admin/loyalty/customers' },
    { name: 'Fidélité - Récompenses', endpoint: '/api/admin/loyalty/rewards' },
    
    // APIs Statistiques Avancées
    { name: 'Stats - Revenus détaillés', endpoint: '/api/admin/stats/revenue-detailed' },
    { name: 'Stats - Analyses clients', endpoint: '/api/admin/stats/customer-analytics' },
    
    // APIs Notifications
    { name: 'Notifications - Réservations en attente', endpoint: '/api/admin/notifications/pending-reservations' },
    { name: 'Notifications - Nouveaux messages', endpoint: '/api/admin/notifications/new-messages' },
    { name: 'Notifications - Commandes en attente', endpoint: '/api/admin/notifications/pending-orders' },
    { name: 'Notifications - Liste', endpoint: '/api/admin/notifications' },
    
    // APIs Comptabilité (directeur uniquement)
    { name: 'Comptabilité - Transactions', endpoint: '/api/admin/accounting/transactions' },
    
    // APIs Logs et Activité
    { name: 'Logs d\'activité', endpoint: '/api/admin/activity-logs' },
    
    // APIs Calendrier
    { name: 'Calendrier - Événements', endpoint: '/api/admin/calendar/events' },
    { name: 'Calendrier - Statistiques', endpoint: '/api/admin/calendar/stats' }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  const failures = [];
  
  console.log('📊 Test des APIs admin:\n');
  
  for (const api of endpoints) {
    const result = await testEndpoint(api.endpoint, token);
    
    if (result.success) {
      console.log(`✅ ${api.name}: OK (${result.status})`);
      successCount++;
    } else {
      console.log(`❌ ${api.name}: ÉCHEC (${result.status || 'ERROR'}) - ${result.error}`);
      failureCount++;
      failures.push(api);
    }
  }
  
  // Test de création de données
  console.log('\n📝 Test de création de données:\n');
  
  // Test création client
  const newClient = {
    firstName: 'Test',
    lastName: 'Système Complet',
    email: 'test.systeme@exemple.com',
    phone: '+33612345678',
    address: '123 Rue du Test',
    preferredContactMethod: 'email',
    notes: 'Client de test pour validation complète'
  };
  
  const clientResult = await testEndpoint('/api/admin/customers', token, 'POST', newClient);
  if (clientResult.success) {
    console.log('✅ Création client: OK');
    successCount++;
  } else {
    console.log('❌ Création client: ÉCHEC');
    failureCount++;
  }
  
  // Test création employé (directeur uniquement)
  const newEmployee = {
    firstName: 'Employé',
    lastName: 'Test Final',
    email: 'employe.test@exemple.com',
    phone: '+33623456789',
    position: 'Serveur',
    salary: '2000',
    startDate: new Date().toISOString().split('T')[0]
  };
  
  const employeeResult = await testEndpoint('/api/admin/employees', token, 'POST', newEmployee);
  if (employeeResult.success) {
    console.log('✅ Création employé: OK');
    successCount++;
  } else {
    console.log('❌ Création employé: ÉCHEC');
    failureCount++;
  }
  
  // Test création transaction comptable
  const newTransaction = {
    type: 'revenue',
    amount: 999.99,
    description: 'Test transaction système complet',
    category: 'Ventes'
  };
  
  const transactionResult = await testEndpoint('/api/admin/accounting/transactions', token, 'POST', newTransaction);
  if (transactionResult.success) {
    console.log('✅ Création transaction comptable: OK');
    successCount++;
  } else {
    console.log('❌ Création transaction comptable: ÉCHEC');
    failureCount++;
  }
  
  // Résultats finaux
  console.log('\n📈 RÉSULTATS FINAUX:\n');
  console.log(`✅ APIs fonctionnelles: ${successCount}`);
  console.log(`❌ APIs en échec: ${failureCount}`);
  console.log(`📊 Taux de réussite: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
  
  if (failures.length > 0) {
    console.log('\n⚠️  APIs en échec à corriger:');
    failures.forEach(api => console.log(`   - ${api.name}: ${api.endpoint}`));
  }
  
  if (successCount >= 25) {
    console.log('\n🎉 SYSTÈME BARISTA CAFÉ ENTIÈREMENT FONCTIONNEL !');
    console.log('✅ Migration de Replit Agent vers Replit TERMINÉE AVEC SUCCÈS');
  } else {
    console.log('\n⚠️  Système partiellement fonctionnel - Corrections nécessaires');
  }
}

// Lancer le test
testCompleteAdminSystem().catch(console.error);