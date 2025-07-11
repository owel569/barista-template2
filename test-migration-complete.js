/**
 * Test complet de migration - Barista Café
 * Valide que toutes les fonctionnalités inactives sont maintenant fonctionnelles
 */

const baseUrl = 'http://localhost:5000';

async function authenticate() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  return data.token;
}

async function testAPI(endpoint, token, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ ${description}: OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
}

async function testPOSTAPI(endpoint, token, body, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ ${description}: OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
}

async function runMigrationTest() {
  console.log('🔍 Test de migration complète - Barista Café');
  console.log('='.repeat(50));
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Authentification
    console.log('\n📋 Authentification...');
    const token = await authenticate();
    console.log('✅ Authentification réussie');
    
    // Test des statistiques principales
    console.log('\n📊 Test des statistiques...');
    const statsTests = [
      ['/api/admin/stats/today-reservations', 'Réservations du jour'],
      ['/api/admin/stats/monthly-revenue', 'Revenus mensuels'],
      ['/api/admin/stats/active-orders', 'Commandes actives'],
      ['/api/admin/stats/occupancy-rate', 'Taux d\'occupation'],
      ['/api/admin/stats/daily-reservations', 'Réservations quotidiennes'],
      ['/api/admin/stats/orders-by-status', 'Commandes par statut'],
      ['/api/admin/stats/reservation-status', 'Statut des réservations']
    ];
    
    for (const [endpoint, description] of statsTests) {
      if (await testAPI(endpoint, token, description)) passedTests++;
      totalTests++;
    }
    
    // Test des modules admin
    console.log('\n👥 Test des modules admin...');
    const adminTests = [
      ['/api/admin/customers', 'Gestion des clients'],
      ['/api/admin/employees', 'Gestion des employés'],
      ['/api/admin/reservations', 'Gestion des réservations'],
      ['/api/admin/orders', 'Gestion des commandes'],
      ['/api/admin/messages', 'Messages de contact'],
      ['/api/admin/work-shifts', 'Horaires de travail'],
      ['/api/admin/work-shifts/stats', 'Statistiques horaires']
    ];
    
    for (const [endpoint, description] of adminTests) {
      if (await testAPI(endpoint, token, description)) passedTests++;
      totalTests++;
    }
    
    // Test des nouvelles APIs ajoutées
    console.log('\n🔧 Test des nouvelles fonctionnalités...');
    const newFeatureTests = [
      ['/api/admin/backups', 'Système de sauvegarde'],
      ['/api/admin/backups/settings', 'Paramètres de sauvegarde'],
      ['/api/admin/permissions', 'Gestion des permissions'],
      ['/api/admin/users', 'Gestion des utilisateurs'],
      ['/api/admin/accounting/transactions', 'Transactions comptables'],
      ['/api/admin/accounting/stats', 'Statistiques comptables'],
      ['/api/admin/inventory/items', 'Articles d\'inventaire'],
      ['/api/admin/inventory/alerts', 'Alertes de stock'],
      ['/api/admin/loyalty/customers', 'Clients fidélité'],
      ['/api/admin/loyalty/rewards', 'Récompenses fidélité'],
      ['/api/admin/calendar/events', 'Événements du calendrier'],
      ['/api/admin/calendar/stats', 'Statistiques du calendrier'],
      ['/api/admin/settings', 'Paramètres du restaurant'],
      ['/api/admin/reports/sales', 'Rapports de ventes'],
      ['/api/admin/reports/customers', 'Rapports clients'],
      ['/api/admin/reports/products', 'Rapports produits']
    ];
    
    for (const [endpoint, description] of newFeatureTests) {
      if (await testAPI(endpoint, token, description)) passedTests++;
      totalTests++;
    }
    
    // Test des notifications
    console.log('\n🔔 Test des notifications...');
    if (await testAPI('/api/admin/notifications/count', token, 'Compteur de notifications')) passedTests++;
    totalTests++;
    
    // Test de création de données
    console.log('\n✏️ Test de création de données...');
    const createTests = [
      ['/api/admin/customers', {
        firstName: 'Test',
        lastName: 'Migration',
        email: 'test.migration@example.com',
        phone: '+33612345678',
        loyaltyPoints: 50,
        totalSpent: 125.50
      }, 'Création de client'],
      ['/api/admin/employees', {
        firstName: 'Employé',
        lastName: 'Test',
        email: 'employe.test@example.com',
        phone: '+33623456789',
        department: 'Service',
        salary: 1800
      }, 'Création d\'employé'],
      ['/api/admin/backups/create', {
        name: 'Test Migration',
        type: 'manual'
      }, 'Création de sauvegarde'],
      ['/api/admin/accounting/transactions', {
        type: 'recette',
        amount: 999.99,
        description: 'Test migration',
        category: 'test'
      }, 'Création de transaction']
    ];
    
    for (const [endpoint, body, description] of createTests) {
      if (await testPOSTAPI(endpoint, token, body, description)) passedTests++;
      totalTests++;
    }
    
    // Test des APIs publiques
    console.log('\n🌐 Test des APIs publiques...');
    const publicTests = [
      ['/api/menu/categories', 'Catégories du menu'],
      ['/api/menu/items', 'Articles du menu'],
      ['/api/tables', 'Tables disponibles']
    ];
    
    for (const [endpoint, description] of publicTests) {
      if (await testAPI(endpoint, '', description)) passedTests++;
      totalTests++;
    }
    
    // Résultats finaux
    console.log('\n' + '='.repeat(50));
    console.log(`📊 RÉSULTATS DE LA MIGRATION`);
    console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`);
    console.log(`📈 Taux de réussite: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
      console.log('✅ Toutes les fonctionnalités sont maintenant opérationnelles');
    } else {
      console.log('⚠️  Migration partiellement réussie');
      console.log(`❌ ${totalTests - passedTests} fonctionnalités nécessitent encore des corrections`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
runMigrationTest().catch(console.error);