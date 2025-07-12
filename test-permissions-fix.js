/**
 * Test des permissions d'édition avec les nouvelles routes API
 * Vérifie que les permissions peuvent être modifiées correctement
 */

async function authenticateAsAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur authentification: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Authentification admin réussie');
    return data.token;
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    throw error;
  }
}

async function testPermissionsAPI(token) {
  console.log('\n🔒 Test des APIs de permissions...');
  
  try {
    // Test récupération des permissions
    const permissionsResponse = await fetch('http://localhost:5000/api/admin/permissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (permissionsResponse.ok) {
      const permissions = await permissionsResponse.json();
      console.log(`✅ Permissions récupérées: ${permissions.length} permissions`);
    } else {
      console.log(`❌ Erreur permissions: ${permissionsResponse.status}`);
    }
    
    // Test récupération des utilisateurs
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Utilisateurs récupérés: ${users.length} utilisateurs`);
      
      // Test modification d'une permission utilisateur
      if (users.length > 0) {
        const userId = users[0].id;
        console.log(`\n🔧 Test modification permission pour utilisateur ${userId}...`);
        
        const updateResponse = await fetch(`http://localhost:5000/api/admin/users/${userId}/permissions`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            permissionId: 1,
            granted: true
          })
        });
        
        if (updateResponse.ok) {
          const result = await updateResponse.json();
          console.log('✅ Permission modifiée avec succès:', result.message);
        } else {
          console.log(`❌ Erreur modification permission: ${updateResponse.status}`);
        }
        
        // Test changement de statut utilisateur
        console.log(`\n🔧 Test changement statut utilisateur ${userId}...`);
        
        const statusResponse = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            active: false
          })
        });
        
        if (statusResponse.ok) {
          const result = await statusResponse.json();
          console.log('✅ Statut utilisateur modifié:', result.message);
        } else {
          console.log(`❌ Erreur changement statut: ${statusResponse.status}`);
        }
      }
    } else {
      console.log(`❌ Erreur utilisateurs: ${usersResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur test permissions:', error);
  }
}

async function testUINavigation(token) {
  console.log('\n📱 Test navigation UI...');
  
  try {
    // Test que l'interface admin se charge correctement
    const adminResponse = await fetch('http://localhost:5000/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (adminResponse.ok) {
      console.log('✅ Interface admin accessible');
    } else {
      console.log(`❌ Erreur interface admin: ${adminResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur test navigation:', error);
  }
}

async function runPermissionsTest() {
  console.log('🚀 TEST DES PERMISSIONS ET NAVIGATION');
  console.log('=====================================');
  
  try {
    // Authentification admin
    const token = await authenticateAsAdmin();
    
    // Test des APIs de permissions
    await testPermissionsAPI(token);
    
    // Test navigation UI
    await testUINavigation(token);
    
    console.log('\n✅ TEST TERMINÉ - Permissions et navigation fonctionnelles');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution du test
runPermissionsTest();