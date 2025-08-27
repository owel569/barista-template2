
#!/usr/bin/env tsx

import { getDb } from '../server/db';
import { users, menuCategories, menuItems, tables } from '../shared/schema';

async function verifyDatabase() {
  console.log('🗄️ Vérification de la base de données...\n');

  try {
    const db = await getDb();

    // Vérifier les tables principales
    const tableChecks = [
      { name: 'users', schema: users },
      { name: 'menuCategories', schema: menuCategories },
      { name: 'menuItems', schema: menuItems },
      { name: 'tables', schema: tables }
    ];

    for (const table of tableChecks) {
      try {
        const count = await db.select().from(table.schema);
        console.log(`✅ Table ${table.name}: ${count.length} enregistrements`);
      } catch (error) {
        console.log(`❌ Table ${table.name}: ${error}`);
      }
    }

    // Tester la connectivité admin
    console.log('\n👤 Test utilisateur admin...');
    const adminUsers = await db.select().from(users).where({ role: 'admin' } as any);
    if (adminUsers.length > 0) {
      console.log(`✅ ${adminUsers.length} utilisateur(s) admin trouvé(s)`);
    } else {
      console.log('⚠️ Aucun utilisateur admin trouvé');
    }

    console.log('\n🎉 Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur de base de données:', error);
  }
}

verifyDatabase().catch(console.error);
