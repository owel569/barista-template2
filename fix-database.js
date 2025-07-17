
#!/usr/bin/env node

import { getDb, checkDatabaseHealth } from './server/db.js';
import { setupDatabase } from './scripts/init-database.js';

console.log('🔧 Diagnostic de la base de données...');

async function diagnoseAndFix() {
  try {
    // 1. Vérifier la santé de la DB
    console.log('1️⃣ Vérification de la santé...');
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      console.log('✅ Base de données en bonne santé');
      console.log('📊 Détails:', health);
      return;
    }
    
    console.log('❌ Problème détecté:', health.error);
    
    // 2. Tenter la reconnexion
    console.log('2️⃣ Tentative de reconnexion...');
    const db = await getDb();
    
    // 3. Test de requête simple
    console.log('3️⃣ Test de requête...');
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ Requête réussie:', result[0]);
    
    // 4. Réinitialiser si nécessaire
    console.log('4️⃣ Vérification des tables...');
    await setupDatabase();
    
    console.log('🎉 Base de données réparée avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur lors de la réparation:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Vérifiez que PostgreSQL est démarré sur Replit');
      console.log('💡 Allez dans l\'onglet "Database" et créez/redémarrez votre base');
    }
    
    process.exit(1);
  }
}

diagnoseAndFix();
