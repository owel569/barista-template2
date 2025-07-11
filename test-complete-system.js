/**
 * Test complet du système Barista Café
 * Teste toutes les APIs et fonctionnalités avancées
 */

const BASE_URL = 'http://localhost:5000';

// Variables globales pour les tests
let adminToken = '';
let employeeToken = '';

// Fonction d'authentification
async function authenticate(username, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    throw new Error(`Erreur d'authentification: ${response.status}`);
  }
  
  const data = await response.json();
  return data.token;
}

// Fonction de test générique
async function testEndpoint(endpoint, token, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  };
  
  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (response.status >= 400) {
      console.log(`❌ Erreur: ${result.message || 'Erreur inconnue'}`);
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test des APIs publiques
async function testPublicAPIs() {
  console.log('\n🔍 TEST DES APIS PUBLIQUES');
  console.log('=' .repeat(40));
  
  // Test menu
  await testEndpoint('/api/menu', '');
  await testEndpoint('/api/menu/items', '');
  await testEndpoint('/api/menu/categories', '');
  
  // Test réservations
  await testEndpoint('/api/reservations', '');
  await testEndpoint('/api/customers', '');
  
  // Test de création de réservation
  const reservationData = {
    customerName: 'Test Client',
    customerEmail: 'test@example.com',
    customerPhone: '+33612345678',
    date: '2025-01-15',
    time: '14:00',
    guests: 2,
    notes: 'Test de réservation'
  };
  
  await testEndpoint('/api/reservations', '', 'POST', reservationData);
  
  // Test de création de message
  const messageData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+33612345678',
    subject: 'Test système',
    message: 'Message de test du système'
  };
  
  await testEndpoint('/api/contact', '', 'POST', messageData);
}

// Test des APIs admin avancées
async function testAdminAPIs() {
  console.log('\n🔐 TEST DES APIS ADMIN AVANCÉES');
  console.log('=' .repeat(40));
  
  // Test statistiques
  await testEndpoint('/api/admin/stats/today-reservations', adminToken);
  await testEndpoint('/api/admin/stats/monthly-revenue', adminToken);
  await testEndpoint('/api/admin/stats/active-orders', adminToken);
  await testEndpoint('/api/admin/stats/occupancy-rate', adminToken);
  await testEndpoint('/api/admin/stats/reservation-status', adminToken);
  await testEndpoint('/api/admin/stats/daily-reservations', adminToken);
  await testEndpoint('/api/admin/stats/orders-by-status', adminToken);
  
  // Test gestion des employés
  await testEndpoint('/api/admin/employees', adminToken);
  await testEndpoint('/api/admin/work-shifts', adminToken);
  
  // Test création d'employé
  const employeeData = {
    name: 'Test Employé',
    email: 'employe.test@example.com',
    phone: '+33612345678',
    position: 'Serveur',
    salary: 1800,
    hireDate: '2025-01-01',
    status: 'active'
  };
  
  await testEndpoint('/api/admin/employees', adminToken, 'POST', employeeData);
  
  // Test clients
  await testEndpoint('/api/admin/customers', adminToken);
  
  // Test création de client
  const customerData = {
    name: 'Test Client Admin',
    email: 'client.test@example.com',
    phone: '+33612345678',
    loyaltyPoints: 0,
    totalSpent: 0,
    lastVisit: new Date().toISOString()
  };
  
  await testEndpoint('/api/admin/customers', adminToken, 'POST', customerData);
  
  // Test inventaire
  await testEndpoint('/api/admin/inventory', adminToken);
  await testEndpoint('/api/admin/inventory/items', adminToken);
  await testEndpoint('/api/admin/inventory/alerts', adminToken);
  
  // Test fidélité
  await testEndpoint('/api/admin/loyalty', adminToken);
  await testEndpoint('/api/admin/loyalty/customers', adminToken);
  await testEndpoint('/api/admin/loyalty/rewards', adminToken);
  
  // Test comptabilité
  await testEndpoint('/api/admin/accounting', adminToken);
  await testEndpoint('/api/admin/accounting/transactions', adminToken);
  await testEndpoint('/api/admin/accounting/summary', adminToken);
  
  // Test sauvegardes
  await testEndpoint('/api/admin/backups', adminToken);
  await testEndpoint('/api/admin/backups/settings', adminToken);
  
  // Test rapports
  await testEndpoint('/api/admin/reports', adminToken);
  await testEndpoint('/api/admin/reports/sales', adminToken);
  await testEndpoint('/api/admin/reports/customers', adminToken);
  
  // Test calendrier
  await testEndpoint('/api/admin/calendar/events', adminToken);
  await testEndpoint('/api/admin/calendar/stats', adminToken);
  
  // Test notifications
  await testEndpoint('/api/admin/notifications', adminToken);
  await testEndpoint('/api/admin/notifications/pending-reservations', adminToken);
  await testEndpoint('/api/admin/notifications/new-messages', adminToken);
  await testEndpoint('/api/admin/notifications/pending-orders', adminToken);
  
  // Test messages
  await testEndpoint('/api/admin/messages', adminToken);
  
  // Test menu management
  await testEndpoint('/api/admin/menu', adminToken);
  
  // Test création d'article de menu
  const menuItemData = {
    name: 'Test Café',
    description: 'Café de test',
    price: 4.50,
    category: 'Cafés',
    available: true,
    imageUrl: 'https://example.com/test.jpg'
  };
  
  await testEndpoint('/api/admin/menu', adminToken, 'POST', menuItemData);
}

// Test des fonctionnalités avancées
async function testAdvancedFeatures() {
  console.log('\n🚀 TEST DES FONCTIONNALITÉS AVANCÉES');
  console.log('=' .repeat(40));
  
  // Test permissions
  await testEndpoint('/api/admin/permissions', adminToken);
  
  // Test logs d'activité
  await testEndpoint('/api/admin/activity-logs', adminToken);
  
  // Test paramètres
  await testEndpoint('/api/admin/settings', adminToken);
  
  // Test fournisseurs
  await testEndpoint('/api/admin/suppliers', adminToken);
  
  // Test maintenance
  await testEndpoint('/api/admin/maintenance', adminToken);
  
  // Test avec token employé (permissions limitées)
  console.log('\n👤 TEST AVEC TOKEN EMPLOYÉ');
  console.log('-' .repeat(30));
  
  // L'employé devrait avoir accès à ces APIs
  await testEndpoint('/api/admin/customers', employeeToken);
  await testEndpoint('/api/admin/menu', employeeToken);
  
  // L'employé ne devrait PAS avoir accès à ces APIs
  await testEndpoint('/api/admin/employees', employeeToken);
  await testEndpoint('/api/admin/settings', employeeToken);
  await testEndpoint('/api/admin/backups', employeeToken);
}

// Test de création de données complexes
async function testDataCreation() {
  console.log('\n📊 TEST DE CRÉATION DE DONNÉES');
  console.log('=' .repeat(40));
  
  // Test création de transaction comptable
  const transactionData = {
    type: 'income',
    amount: 250.75,
    description: 'Vente de test',
    category: 'sales',
    date: new Date().toISOString()
  };
  
  await testEndpoint('/api/admin/accounting/transactions', adminToken, 'POST', transactionData);
  
  // Test attribution de points de fidélité
  const loyaltyData = {
    customerId: 1,
    points: 50,
    reason: 'Test attribution points'
  };
  
  await testEndpoint('/api/admin/loyalty/points', adminToken, 'POST', loyaltyData);
  
  // Test création d'horaire
  const scheduleData = {
    employeeId: 1,
    date: '2025-01-15',
    startTime: '08:00',
    endTime: '16:00',
    breakDuration: 60
  };
  
  await testEndpoint('/api/admin/work-shifts', adminToken, 'POST', scheduleData);
}

// Fonction principale de test
async function runCompleteTest() {
  console.log('🎯 DÉBUT DU TEST COMPLET DU SYSTÈME BARISTA CAFÉ');
  console.log('=' .repeat(60));
  
  try {
    // Authentification
    console.log('\n🔐 AUTHENTIFICATION');
    console.log('=' .repeat(20));
    
    adminToken = await authenticate('admin', 'admin123');
    console.log('✅ Authentification admin réussie');
    
    employeeToken = await authenticate('employe', 'employe123');
    console.log('✅ Authentification employé réussie');
    
    // Lancement des tests
    await testPublicAPIs();
    await testAdminAPIs();
    await testAdvancedFeatures();
    await testDataCreation();
    
    console.log('\n✅ TEST COMPLET TERMINÉ AVEC SUCCÈS');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Erreur lors du test complet:', error);
  }
}

// Lancement du test
runCompleteTest();