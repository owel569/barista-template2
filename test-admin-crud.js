/**
 * Test des fonctionnalités CRUD admin après correction
 */

const baseUrl = 'http://localhost:5000';
let authToken = null;

async function testAdminAuth() {
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'admin', 
        password: 'admin123' 
      })
    });

    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      console.log('✅ Authentification admin réussie');
      return true;
    } else {
      console.log('❌ Authentification admin échouée');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur authentification:', error.message);
    return false;
  }
}

async function testReservationsAPI() {
  try {
    const response = await fetch(`${baseUrl}/api/admin/reservations`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réservations récupérées:', data.length, 'réservations');
      
      // Test création réservation
      const newReservation = {
        customerName: 'Test CRUD',
        customerEmail: 'test@crud.com',
        customerPhone: '+33123456789',
        date: '2024-07-15',
        time: '14:00',
        guests: 2,
        status: 'pending',
        notes: 'Test de création CRUD'
      };

      const createResponse = await fetch(`${baseUrl}/api/admin/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReservation)
      });

      if (createResponse.ok) {
        const responseText = await createResponse.text();
        console.log('✅ Réservation créée - réponse:', responseText.substring(0, 100));
        
        // Vérifier si c'est du JSON valide
        let createdRes;
        try {
          createdRes = JSON.parse(responseText);
          console.log('✅ Réservation créée:', createdRes.id);
        } catch (e) {
          console.log('❌ Réponse n\'est pas du JSON valide');
          return;
        }
        
        // Test modification
        const updateResponse = await fetch(`${baseUrl}/api/admin/reservations/${createdRes.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...newReservation,
            status: 'confirmed',
            notes: 'Test modifié'
          })
        });

        if (updateResponse.ok) {
          const updatedRes = await updateResponse.json();
          console.log('✅ Réservation modifiée:', updatedRes.id);
          
          // Test suppression
          const deleteResponse = await fetch(`${baseUrl}/api/admin/reservations/${createdRes.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (deleteResponse.ok) {
            const deleteRes = await deleteResponse.json();
            console.log('✅ Réservation supprimée:', deleteRes.message);
          } else {
            console.log('❌ Échec suppression réservation:', deleteResponse.status);
          }
        } else {
          console.log('❌ Échec modification réservation:', updateResponse.status);
        }
      } else {
        console.log('❌ Échec création réservation');
      }
    } else {
      console.log('❌ Échec récupération réservations');
    }
  } catch (error) {
    console.log('❌ Erreur test réservations:', error.message);
  }
}

async function testMenuAPI() {
  try {
    // Test création article menu
    const newItem = {
      name: 'Test Menu CRUD',
      description: 'Article de test pour CRUD',
      price: 5.50,
      categoryId: 1,
      available: true,
      imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg'
    };

    const createResponse = await fetch(`${baseUrl}/api/admin/menu/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newItem)
    });

    if (createResponse.ok) {
      const createdItem = await createResponse.json();
      console.log('✅ Article menu créé:', createdItem.id);
      
      // Test modification
      const updateResponse = await fetch(`${baseUrl}/api/admin/menu/items/${createdItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newItem,
          name: 'Test Menu CRUD Modifié',
          price: 6.00
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Article menu modifié');
        
        // Test suppression
        const deleteResponse = await fetch(`${baseUrl}/api/admin/menu/items/${createdItem.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (deleteResponse.ok) {
          console.log('✅ Article menu supprimé');
        } else {
          console.log('❌ Échec suppression article menu');
        }
      } else {
        console.log('❌ Échec modification article menu');
      }
    } else {
      console.log('❌ Échec création article menu');
    }
  } catch (error) {
    console.log('❌ Erreur test menu:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Test des fonctionnalités CRUD admin');
  
  const authSuccess = await testAdminAuth();
  if (!authSuccess) {
    console.log('❌ Impossible de continuer sans authentification');
    return;
  }

  console.log('\n📋 Test des réservations...');
  await testReservationsAPI();
  
  console.log('\n🍽️ Test du menu...');
  await testMenuAPI();
  
  console.log('\n✅ Tests terminés');
}

runTests().catch(console.error);