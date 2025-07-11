/**
 * Test final complet de toutes les APIs après corrections
 */

const BASE_URL = 'http://localhost:5000';

async function authenticate() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const data = await response.json();
  return data.token;
}

async function testAPI(endpoint, token, description) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const result = Array.isArray(data) ? `Array[${data.length}]` : 'Object';
      console.log(`✅ ${description}: ${result}`);
      return true;
    } else {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🧪 Test final complet - Barista Café APIs\n');
  
  const token = await authenticate();
  console.log('🔐 Authentification réussie\n');
  
  const apis = [
    // APIs de base
    ['/api/admin/customers', 'Clients'],
    ['/api/admin/employees', 'Employés'], 
    ['/api/admin/reservations', 'Réservations'],
    ['/api/admin/messages', 'Messages'],
    ['/api/admin/work-shifts', 'Horaires'],
    
    // APIs menu (problématiques)
    ['/api/admin/menu/items', 'Articles Menu'],
    ['/api/admin/menu/categories', 'Catégories Menu'],
    
    // APIs avancées
    ['/api/admin/inventory/items', 'Inventaire'],
    ['/api/admin/loyalty/customers', 'Fidélité Clients'],
    ['/api/admin/accounting/transactions', 'Transactions'],
    ['/api/admin/backups', 'Sauvegardes'],
    ['/api/admin/reports/sales', 'Rapports Ventes'],
    ['/api/admin/calendar/events', 'Événements'],
    ['/api/admin/settings', 'Paramètres'],
    ['/api/admin/permissions', 'Permissions'],
    ['/api/admin/users', 'Utilisateurs'],
    
    // APIs ultra-avancées
    ['/api/admin/analytics/revenue-detailed', 'Analytics Revenus'],
    ['/api/admin/pos/menu-items', 'POS Menu'],
    ['/api/admin/quality/checks', 'Contrôle Qualité'],
    ['/api/admin/feedback', 'Feedback Clients'],
    ['/api/admin/schedule/auto-generate', 'Planning Auto'],
    
    // APIs notifications
    ['/api/admin/notifications/count', 'Notifications']
  ];
  
  let successCount = 0;
  
  for (const [endpoint, description] of apis) {
    const success = await testAPI(endpoint, token, description);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Résultats: ${successCount}/${apis.length} APIs fonctionnelles (${Math.round(successCount/apis.length*100)}%)`);
  
  if (successCount === apis.length) {
    console.log('🎉 TOUS LES MODULES SONT MAINTENANT ACTIFS ET FONCTIONNELS !');
  } else {
    console.log('⚠️  Certains modules nécessitent encore des corrections');
  }
}

runCompleteTest().catch(console.error);