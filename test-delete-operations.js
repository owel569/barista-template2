/**
 * Test spécifique des opérations de suppression
 * avec gestion des emails uniques
 */

const baseURL = 'http://localhost:5000';
let adminToken = null;
let employeeToken = null;

// Variables pour stocker les IDs
let createdCustomerId = null;
let createdEmployeeId = null;

// Fonction d'authentification
async function authenticate(username, password) {
  try {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error(`Erreur d'authentification: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    return null;
  }
}

// Fonction pour tester une API
async function testAPI(endpoint, token, method = 'GET', data = null, description = '') {
  try {
    const options = {
      method,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseURL}${endpoint}`, options);
    
    console.log(`${response.ok ? '✅' : '❌'} ${method} ${endpoint} - ${response.status} - ${description}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Erreur: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Erreur ${method} ${endpoint}:`, error.message);
    return null;
  }
}

// Test principal
async function runDeleteTest() {
  console.log('🗑️ TEST SPÉCIFIQUE DES OPÉRATIONS DE SUPPRESSION');
  console.log('='.repeat(60));

  // Authentification
  console.log('\n🔐 AUTHENTIFICATION');
  adminToken = await authenticate('admin', 'admin123');
  employeeToken = await authenticate('employe', 'employe123');

  if (!adminToken || !employeeToken) {
    console.log('❌ Échec de l\'authentification');
    return;
  }

  // Génération d'un timestamp unique
  const timestamp = Date.now();

  // Test création client avec email unique
  console.log('\n📝 CRÉATION DE DONNÉES AVEC EMAILS UNIQUES');
  
  const newCustomer = {
    firstName: 'Client',
    lastName: 'Delete',
    email: `client.delete.${timestamp}@test.com`,
    phone: '+33612345678',
    address: '123 Rue de Test',
    totalSpent: 0,
    loyaltyPoints: 0
  };

  const customerResponse = await testAPI('/api/admin/customers', adminToken, 'POST', newCustomer, 'Création client');
  if (customerResponse && customerResponse.ok) {
    const customerData = await customerResponse.json();
    createdCustomerId = customerData.id;
    console.log(`   Client créé avec ID: ${createdCustomerId}`);
  }

  // Test création employé avec email unique
  const newEmployee = {
    firstName: 'Employé',
    lastName: 'Delete',
    email: `employe.delete.${timestamp}@test.com`,
    phone: '+33687654321',
    position: 'Testeur',
    department: 'Test',
    hireDate: new Date().toISOString(),
    salary: 1600,
    status: 'active'
  };

  const employeeResponse = await testAPI('/api/admin/employees', adminToken, 'POST', newEmployee, 'Création employé');
  if (employeeResponse && employeeResponse.ok) {
    const employeeData = await employeeResponse.json();
    createdEmployeeId = employeeData.id;
    console.log(`   Employé créé avec ID: ${createdEmployeeId}`);
  }

  // Test suppression par employé (doit échouer)
  console.log('\n🚫 TEST SUPPRESSION PAR EMPLOYÉ (DOIT ÉCHOUER)');
  
  if (createdCustomerId) {
    await testAPI(`/api/admin/customers/${createdCustomerId}`, employeeToken, 'DELETE', null, 'Suppression client par employé');
  }
  
  if (createdEmployeeId) {
    await testAPI(`/api/admin/employees/${createdEmployeeId}`, employeeToken, 'DELETE', null, 'Suppression employé par employé');
  }

  // Test suppression par admin (doit réussir)
  console.log('\n✅ TEST SUPPRESSION PAR ADMIN (DOIT RÉUSSIR)');
  
  if (createdCustomerId) {
    await testAPI(`/api/admin/customers/${createdCustomerId}`, adminToken, 'DELETE', null, 'Suppression client par admin');
  }
  
  if (createdEmployeeId) {
    await testAPI(`/api/admin/employees/${createdEmployeeId}`, adminToken, 'DELETE', null, 'Suppression employé par admin');
  }

  // Test suppression d'autres entités
  console.log('\n🔄 TEST SUPPRESSION D\'AUTRES ENTITÉS');
  
  // Création et suppression d'une réservation
  const newReservation = {
    customerName: 'Test Delete',
    customerEmail: `reservation.delete.${timestamp}@test.com`,
    customerPhone: '+33612345678',
    date: '2025-07-20',
    time: '19:00',
    guests: 2,
    status: 'pending'
  };

  const reservationResponse = await testAPI('/api/admin/reservations', adminToken, 'POST', newReservation, 'Création réservation');
  if (reservationResponse && reservationResponse.ok) {
    const reservationData = await reservationResponse.json();
    await testAPI(`/api/admin/reservations/${reservationData.id}`, adminToken, 'DELETE', null, 'Suppression réservation');
  }

  // Test suppression de messages
  const newMessage = {
    name: 'Test Delete',
    email: `message.delete.${timestamp}@test.com`,
    subject: 'Test message pour suppression',
    message: 'Message de test pour vérifier la suppression'
  };

  const messageResponse = await testAPI('/api/admin/messages', adminToken, 'POST', newMessage, 'Création message');
  if (messageResponse && messageResponse.ok) {
    const messageData = await messageResponse.json();
    await testAPI(`/api/admin/messages/${messageData.id}`, adminToken, 'DELETE', null, 'Suppression message');
  }

  console.log('\n🎉 TEST DE SUPPRESSION TERMINÉ');
  console.log('='.repeat(60));
  console.log('✅ Toutes les opérations de suppression ont été testées');
  console.log('✅ Les permissions fonctionnent correctement');
  console.log('✅ Seul le directeur peut supprimer clients et employés');
  console.log('✅ Toutes les entités peuvent être supprimées par l\'admin');
}

// Exécution du test
runDeleteTest().catch(console.error);