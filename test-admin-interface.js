/**
 * Test complet de l'interface admin Barista Café
 * Vérifie que tous les composants admin fonctionnent correctement
 */

const BASE_URL = 'http://localhost:5000';

// Fonction pour tester une connexion admin
async function testAdminLogin() {
    console.log('🔐 Test de connexion admin...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
        })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
        console.log('✅ Connexion admin réussie');
        return data.token;
    } else {
        console.log('❌ Échec de la connexion admin');
        return null;
    }
}

// Fonction pour tester tous les endpoints admin
async function testAllAdminEndpoints(token) {
    console.log('📊 Test des endpoints admin...');
    
    const endpoints = [
        // Statistiques
        '/api/admin/stats/today-reservations',
        '/api/admin/stats/monthly-revenue',
        '/api/admin/stats/active-orders',
        '/api/admin/stats/occupancy-rate',
        '/api/admin/stats/reservation-status',
        '/api/admin/stats/daily-reservations',
        '/api/admin/stats/orders-by-status',
        
        // Gestion des données
        '/api/admin/customers',
        '/api/admin/employees',
        '/api/admin/reservations',
        '/api/admin/orders',
        '/api/admin/menu',
        '/api/admin/messages',
        '/api/admin/work-shifts',
        
        // Fonctionnalités avancées
        '/api/admin/inventory',
        '/api/admin/inventory/items',
        '/api/admin/inventory/alerts',
        '/api/admin/loyalty',
        '/api/admin/loyalty/customers',
        '/api/admin/loyalty/rewards',
        '/api/admin/accounting',
        '/api/admin/accounting/transactions',
        '/api/admin/notifications',
        '/api/admin/notifications/pending-reservations',
        '/api/admin/notifications/new-messages',
        '/api/admin/settings',
        '/api/admin/permissions',
        '/api/admin/activity-logs',
        '/api/admin/reports',
        '/api/admin/calendar/events',
        '/api/admin/suppliers',
        '/api/admin/maintenance',
        '/api/admin/backups'
    ];
    
    let successful = 0;
    let failed = 0;
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint} - OK`);
                successful++;
            } else {
                console.log(`❌ ${endpoint} - Status: ${response.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${endpoint} - Erreur: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n📈 Résultats: ${successful} succès, ${failed} échecs`);
    return { successful, failed, total: endpoints.length };
}

// Test de création de données
async function testDataCreation(token) {
    console.log('🏗️ Test de création de données...');
    
    const tests = [
        {
            name: 'Création client',
            endpoint: '/api/admin/customers',
            data: {
                firstName: 'Test',
                lastName: 'Admin Interface',
                email: 'test.admin@barista-cafe.com',
                phone: '+33612345678',
                address: '123 rue de Test',
                notes: 'Client de test interface admin'
            }
        },
        {
            name: 'Création employé',
            endpoint: '/api/admin/employees',
            data: {
                firstName: 'Employé',
                lastName: 'Test Interface',
                email: 'employe.test@barista-cafe.com',
                position: 'Testeur',
                department: 'Qualité',
                phone: '+33623456789',
                hireDate: '2024-07-11',
                salary: 2500,
                status: 'active'
            }
        },
        {
            name: 'Création article menu',
            endpoint: '/api/admin/menu',
            data: {
                name: 'Café Test Interface',
                description: 'Un café spécialement créé pour tester l\'interface admin',
                price: 3.50,
                categoryId: 1,
                available: true
            }
        }
    ];
    
    let successful = 0;
    
    for (const test of tests) {
        try {
            const response = await fetch(`${BASE_URL}${test.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(test.data)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${test.name} - Créé avec ID: ${data.id}`);
                successful++;
            } else {
                const error = await response.json();
                console.log(`❌ ${test.name} - Erreur: ${error.error || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Erreur: ${error.message}`);
        }
    }
    
    console.log(`\n🎯 Création de données: ${successful}/${tests.length} réussies`);
    return successful;
}

// Test des fonctionnalités WebSocket
async function testWebSocketConnection() {
    console.log('🌐 Test de connexion WebSocket...');
    
    return new Promise((resolve) => {
        try {
            const ws = new WebSocket('ws://localhost:5000/api/ws');
            
            ws.onopen = () => {
                console.log('✅ WebSocket connecté');
                ws.close();
                resolve(true);
            };
            
            ws.onerror = (error) => {
                console.log('❌ Erreur WebSocket:', error);
                resolve(false);
            };
            
            ws.onclose = () => {
                console.log('🔌 WebSocket fermé');
            };
            
            // Timeout après 5 secondes
            setTimeout(() => {
                ws.close();
                resolve(false);
            }, 5000);
            
        } catch (error) {
            console.log('❌ Erreur lors de la création WebSocket:', error);
            resolve(false);
        }
    });
}

// Test principal
async function runCompleteAdminTest() {
    console.log('🎯 DÉBUT DU TEST COMPLET DE L\'INTERFACE ADMIN');
    console.log('================================================');
    
    try {
        // 1. Test de connexion
        const token = await testAdminLogin();
        if (!token) {
            console.log('❌ Impossible de continuer sans token d\'authentification');
            return;
        }
        
        // 2. Test des endpoints
        const endpointResults = await testAllAdminEndpoints(token);
        
        // 3. Test de création de données
        const creationResults = await testDataCreation(token);
        
        // 4. Test WebSocket
        const wsResult = await testWebSocketConnection();
        
        // 5. Résumé final
        console.log('\n🎉 RÉSUMÉ DU TEST COMPLET');
        console.log('========================');
        console.log(`✅ Authentification: OK`);
        console.log(`📊 Endpoints: ${endpointResults.successful}/${endpointResults.total} (${((endpointResults.successful/endpointResults.total)*100).toFixed(1)}%)`);
        console.log(`🏗️ Création de données: ${creationResults}/3`);
        console.log(`🌐 WebSocket: ${wsResult ? 'OK' : 'Erreur'}`);
        
        const overallSuccess = endpointResults.successful >= endpointResults.total * 0.9 && 
                              creationResults >= 2 && 
                              wsResult;
        
        console.log(`\n${overallSuccess ? '✅ INTERFACE ADMIN FONCTIONNELLE' : '⚠️ INTERFACE ADMIN NÉCESSITE DES CORRECTIONS'}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

// Exécuter le test
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCompleteAdminTest };
} else {
    runCompleteAdminTest();
}