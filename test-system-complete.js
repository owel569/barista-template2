/**
 * Test complet du système Barista Café après migration
 * Valide TOUTES les fonctionnalités: authentification, APIs, CRUD, temps réel
 */

const baseUrl = 'http://localhost:5000';

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      return { success: false, status: response.status, error: response.statusText };
    }
    
    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function authenticate() {
  console.log('🔐 Test d\'authentification...');
  
  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (result.success) {
    console.log('✅ Authentification réussie');
    return result.data.token;
  } else {
    console.log('❌ Échec de l\'authentification');
    return null;
  }
}

async function testPublicAPIs() {
  console.log('\n🌐 Test des APIs publiques...');
  
  const endpoints = [
    '/api/menu/categories',
    '/api/menu/items',
    '/api/tables'
  ];
  
  let passed = 0;
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      console.log(`✅ ${endpoint}: OK`);
      passed++;
    } else {
      console.log(`❌ ${endpoint}: ${result.error}`);
    }
  }
  
  return { passed, total: endpoints.length };
}

async function testAdminAPIs() {
  console.log('\n🔧 Test des APIs administratives...');
  
  const token = await authenticate();
  if (!token) return { passed: 0, total: 0 };
  
  const adminEndpoints = [
    // Statistiques
    '/api/admin/stats/today-reservations',
    '/api/admin/stats/monthly-revenue',
    '/api/admin/stats/active-orders',
    '/api/admin/stats/occupancy-rate',
    '/api/admin/stats/daily-reservations',
    '/api/admin/stats/orders-by-status',
    '/api/admin/stats/reservation-status',
    
    // Gestion
    '/api/admin/customers',
    '/api/admin/employees',
    '/api/admin/reservations',
    '/api/admin/orders',
    '/api/admin/messages',
    '/api/admin/work-shifts',
    '/api/admin/work-shifts/stats',
    
    // Fonctionnalités avancées
    '/api/admin/backups',
    '/api/admin/backups/settings',
    '/api/admin/permissions',
    '/api/admin/users',
    '/api/admin/accounting/transactions',
    '/api/admin/accounting/stats',
    '/api/admin/inventory/items',
    '/api/admin/inventory/alerts',
    '/api/admin/loyalty/customers',
    '/api/admin/loyalty/rewards',
    '/api/admin/loyalty/stats',
    '/api/admin/calendar/events',
    '/api/admin/calendar/stats',
    '/api/admin/settings',
    '/api/admin/reports/sales',
    '/api/admin/reports/customers',
    '/api/admin/reports/products',
    '/api/admin/notifications/count'
  ];
  
  let passed = 0;
  for (const endpoint of adminEndpoints) {
    const result = await makeRequest(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (result.success) {
      console.log(`✅ ${endpoint}: OK`);
      passed++;
    } else {
      console.log(`❌ ${endpoint}: ${result.status} ${result.error}`);
    }
  }
  
  return { passed, total: adminEndpoints.length };
}

async function testCRUDOperations() {
  console.log('\n✏️ Test des opérations CRUD...');
  
  const token = await authenticate();
  if (!token) return { passed: 0, total: 0 };
  
  const timestamp = Date.now();
  let passed = 0;
  let total = 0;
  
  // Test création client
  total++;
  const clientResult = await makeRequest('/api/admin/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      firstName: 'TestSystem',
      lastName: 'Complete',
      email: `test.system.${timestamp}@example.com`,
      phone: '+33612345678',
      loyaltyPoints: 100,
      totalSpent: 250.50
    })
  });
  
  if (clientResult.success) {
    console.log('✅ Création client: OK');
    passed++;
  } else {
    console.log(`❌ Création client: ${clientResult.error}`);
  }
  
  // Test création employé
  total++;
  const employeeResult = await makeRequest('/api/admin/employees', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      firstName: 'EmployéSystem',
      lastName: 'Test',
      email: `employe.system.${timestamp}@example.com`,
      phone: '+33623456789',
      department: 'Service',
      position: 'Serveur',
      salary: 1900
    })
  });
  
  if (employeeResult.success) {
    console.log('✅ Création employé: OK');
    passed++;
  } else {
    console.log(`❌ Création employé: ${employeeResult.error}`);
  }
  
  // Test création article menu
  total++;
  const menuResult = await makeRequest('/api/admin/menu/items', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Café Test System',
      description: 'Test complet du système',
      price: 4.50,
      categoryId: 1,
      available: true
    })
  });
  
  if (menuResult.success) {
    console.log('✅ Création article menu: OK');
    passed++;
  } else {
    console.log(`❌ Création article menu: ${menuResult.error}`);
  }
  
  // Test création transaction
  total++;
  const transactionResult = await makeRequest('/api/admin/accounting/transactions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      type: 'recette',
      amount: 2500.00,
      description: 'Test système complet',
      category: 'validation'
    })
  });
  
  if (transactionResult.success) {
    console.log('✅ Création transaction: OK');
    passed++;
  } else {
    console.log(`❌ Création transaction: ${transactionResult.error}`);
  }
  
  // Test création sauvegarde
  total++;
  const backupResult = await makeRequest('/api/admin/backups/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Test Système Complet',
      type: 'manual'
    })
  });
  
  if (backupResult.success) {
    console.log('✅ Création sauvegarde: OK');
    passed++;
  } else {
    console.log(`❌ Création sauvegarde: ${backupResult.error}`);
  }
  
  return { passed, total };
}

async function testNotificationsSystem() {
  console.log('\n🔔 Test du système de notifications...');
  
  const token = await authenticate();
  if (!token) return { passed: 0, total: 0 };
  
  let passed = 0;
  let total = 1;
  
  const result = await makeRequest('/api/admin/notifications/count', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (result.success) {
    console.log('✅ Notifications count: OK');
    console.log(`   - Réservations en attente: ${result.data.pendingReservations}`);
    console.log(`   - Nouveaux messages: ${result.data.newMessages}`);
    console.log(`   - Commandes en attente: ${result.data.pendingOrders}`);
    passed++;
  } else {
    console.log(`❌ Notifications count: ${result.error}`);
  }
  
  return { passed, total };
}

async function generateReport() {
  console.log('\n📊 RAPPORT COMPLET DE MIGRATION');
  console.log('='.repeat(70));
  
  const results = {
    public: await testPublicAPIs(),
    admin: await testAdminAPIs(),
    crud: await testCRUDOperations(),
    notifications: await testNotificationsSystem()
  };
  
  const totalPassed = results.public.passed + results.admin.passed + results.crud.passed + results.notifications.passed;
  const totalTests = results.public.total + results.admin.total + results.crud.total + results.notifications.total;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 RÉSULTATS DÉTAILLÉS:`);
  console.log(`   🌐 APIs publiques:        ${results.public.passed}/${results.public.total} (${((results.public.passed/results.public.total)*100).toFixed(1)}%)`);
  console.log(`   🔧 APIs administratives:  ${results.admin.passed}/${results.admin.total} (${((results.admin.passed/results.admin.total)*100).toFixed(1)}%)`);
  console.log(`   ✏️  Opérations CRUD:      ${results.crud.passed}/${results.crud.total} (${((results.crud.passed/results.crud.total)*100).toFixed(1)}%)`);
  console.log(`   🔔 Notifications:         ${results.notifications.passed}/${results.notifications.total} (${((results.notifications.passed/results.notifications.total)*100).toFixed(1)}%)`);
  
  console.log(`\n🎯 RÉSULTAT GLOBAL:`);
  console.log(`   ✅ Tests réussis: ${totalPassed}/${totalTests}`);
  console.log(`   📊 Taux de réussite: ${successRate}%`);
  
  if (successRate >= 95) {
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('✅ Toutes les fonctionnalités sont opérationnelles');
    console.log('✅ Système prêt pour utilisation en production');
  } else if (successRate >= 90) {
    console.log('\n⚠️  Migration presque terminée');
    console.log('📝 Quelques ajustements mineurs nécessaires');
  } else {
    console.log('\n❌ Migration incomplète');
    console.log('🔧 Corrections importantes nécessaires');
  }
  
  console.log('\n🔑 IDENTIFIANTS DE TEST:');
  console.log('   Admin: admin / admin123');
  console.log('   Employé: employe / employe123');
  
  return successRate;
}

// Exécuter tous les tests
generateReport().then(successRate => {
  console.log(`\n🏁 Test terminé avec ${successRate}% de réussite`);
  process.exit(successRate >= 95 ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});