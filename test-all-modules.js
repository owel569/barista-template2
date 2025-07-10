#!/usr/bin/env node

import http from 'http';
import { URL } from 'url';

const BASE_URL = 'http://localhost:5000';

// Test authentication and get token
async function authenticate() {
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.token);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Test API endpoint
async function testEndpoint(endpoint, token, method = 'GET', data = null) {
  const url = new URL(endpoint, BASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (data && method !== 'GET') {
    const postData = JSON.stringify(data);
    options.headers['Content-Length'] = Buffer.byteLength(postData);
  }

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ ${endpoint}: ${res.statusCode} - ${Object.keys(parsed).length} keys`);
          resolve({ success: true, status: res.statusCode, data: parsed });
        } catch (e) {
          if (responseData.includes('<!DOCTYPE html>')) {
            console.log(`❌ ${endpoint}: ${res.statusCode} - HTML instead of JSON (route missing)`);
          } else {
            console.log(`❌ ${endpoint}: ${res.statusCode} - Invalid JSON: ${responseData.substring(0, 100)}...`);
          }
          resolve({ success: false, status: res.statusCode, error: responseData });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${endpoint}: Network error - ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Main test function
async function testAllModules() {
  console.log('🚀 Test complet de tous les modules Barista Café\n');
  
  try {
    // Authentication
    console.log('🔐 Test authentification...');
    const token = await authenticate();
    console.log('✅ Authentification réussie\n');

    // Test all endpoints
    const endpoints = [
      // Dashboard & Stats
      '/api/admin/stats/today-reservations',
      '/api/admin/stats/monthly-revenue', 
      '/api/admin/stats/active-orders',
      '/api/admin/stats/occupancy-rate',
      '/api/admin/stats/reservation-status',
      '/api/admin/stats/revenue-detailed',
      '/api/admin/stats/customer-analytics',
      '/api/admin/stats/category-analytics',
      
      // Loyalty system
      '/api/admin/loyalty/stats',
      '/api/admin/loyalty/customers',
      '/api/admin/loyalty/rewards',
      '/api/admin/loyalty/overview',
      
      // Inventory
      '/api/admin/inventory/items',
      '/api/admin/inventory/alerts',
      
      // Accounting
      '/api/admin/accounting/summary',
      '/api/admin/accounting/transactions',
      
      // Management
      '/api/admin/employees',
      '/api/admin/customers',
      '/api/admin/work-shifts',
      '/api/admin/permissions',
      '/api/admin/users',
      
      // Business Operations
      '/api/admin/backups',
      '/api/admin/reports',
      '/api/admin/calendar/events',
      '/api/admin/calendar/stats',
      '/api/admin/suppliers',
      '/api/admin/suppliers/stats',
      
      // Menu & Categories
      '/api/menu/categories',
      '/api/menu/items',
      
      // Public APIs
      '/api/reservations',
      '/api/orders',
      '/api/contact'
    ];

    console.log(`📊 Test de ${endpoints.length} endpoints...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint, token);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Résultats du test:');
    console.log(`✅ Succès: ${successCount}/${endpoints.length}`);
    console.log(`❌ Échecs: ${failCount}/${endpoints.length}`);
    console.log(`📊 Taux de réussite: ${Math.round((successCount/endpoints.length)*100)}%`);
    
    // Test data creation
    console.log('\n🧪 Test création de données...');
    
    const testData = [
      {
        endpoint: '/api/admin/customers',
        method: 'POST',
        data: {
          firstName: 'Test',
          lastName: 'Complete',
          email: 'test.complete@email.com',
          phone: '+33612345678',
          address: '123 Rue Test, Paris',
          totalSpent: '150.00'
        }
      },
      {
        endpoint: '/api/admin/menu/items',
        method: 'POST', 
        data: {
          name: 'Café Test Final',
          description: 'Test final des modules',
          price: '4.00',
          categoryId: 1,
          imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
          available: true
        }
      },
      {
        endpoint: '/api/reservations',
        method: 'POST',
        data: {
          customerName: 'Test Final',
          customerEmail: 'test.final@email.com',
          customerPhone: '+33687654321',
          date: '2025-01-15',
          time: '20:00',
          guests: 4,
          specialRequests: 'Test final de tous les modules'
        }
      }
    ];

    for (const test of testData) {
      const result = await testEndpoint(test.endpoint, token, test.method, test.data);
      if (result.success) {
        console.log(`✅ Création ${test.endpoint}: Succès`);
      } else {
        console.log(`❌ Création ${test.endpoint}: Échec`);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 Test complet terminé !');
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error.message);
  }
}

// Run tests
testAllModules().catch(console.error);