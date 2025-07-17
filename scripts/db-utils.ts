
import { getDb, checkDatabaseHealth } from '../server/db';
import { sql } from 'drizzle-orm';

export async function resetDatabase() {
  console.log('🔄 Reset complet de la base de données...');
  
  const db = await getDb();
  
  // Liste des tables dans l'ordre de suppression (inverse des dépendances)
  const tables = [
    'reservation_items', 'order_items', 'work_shifts', 'activity_logs',
    'permissions', 'menu_item_images', 'reservations', 'orders',
    'menu_items', 'menu_categories', 'employees', 'customers',
    'tables', 'contact_messages', 'users'
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE`));
      console.log(`✅ Table ${table} supprimée`);
    } catch (error) {
      console.warn(`⚠️ Erreur suppression ${table}:`, error);
    }
  }
  
  console.log('✅ Reset terminé');
}

export async function backupDatabase(outputPath?: string) {
  console.log('💾 Sauvegarde de la base de données...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = outputPath || `backup-${timestamp}.sql`;
  
  // Note: En production, utiliser pg_dump
  console.log(`📁 Fichier de sauvegarde: ${backupFile}`);
  console.log('⚠️ Implémentation de sauvegarde à compléter avec pg_dump');
  
  return backupFile;
}

export async function getDatabaseStats() {
  console.log('📊 Statistiques de la base de données...');
  
  const db = await getDb();
  
  const stats = {
    health: await checkDatabaseHealth(),
    tables: {} as Record<string, number>
  };

  // Compter les enregistrements par table
  const tableQueries = [
    { name: 'users', query: sql`SELECT COUNT(*) as count FROM users` },
    { name: 'menu_categories', query: sql`SELECT COUNT(*) as count FROM menu_categories` },
    { name: 'menu_items', query: sql`SELECT COUNT(*) as count FROM menu_items` },
    { name: 'tables', query: sql`SELECT COUNT(*) as count FROM tables` },
    { name: 'customers', query: sql`SELECT COUNT(*) as count FROM customers` },
    { name: 'reservations', query: sql`SELECT COUNT(*) as count FROM reservations` },
    { name: 'orders', query: sql`SELECT COUNT(*) as count FROM orders` }
  ];

  for (const { name, query } of tableQueries) {
    try {
      const result = await db.execute(query);
      stats.tables[name] = Number(result[0]?.count || 0);
    } catch (error) {
      console.warn(`⚠️ Erreur comptage ${name}:`, error);
      stats.tables[name] = -1;
    }
  }

  return stats;
}

export async function validateDatabaseIntegrity() {
  console.log('🔍 Validation de l\'intégrité de la base de données...');
  
  const db = await getDb();
  const issues: string[] = [];

  try {
    // Vérifier les contraintes de clés étrangères
    const foreignKeyChecks = [
      {
        name: 'menu_items -> menu_categories',
        query: sql`
          SELECT mi.id, mi.name 
          FROM menu_items mi 
          LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
          WHERE mc.id IS NULL
        `
      },
      {
        name: 'reservations -> customers',
        query: sql`
          SELECT r.id 
          FROM reservations r 
          LEFT JOIN customers c ON r.customer_id = c.id 
          WHERE c.id IS NULL
        `
      },
      {
        name: 'reservations -> tables',
        query: sql`
          SELECT r.id 
          FROM reservations r 
          LEFT JOIN tables t ON r.table_id = t.id 
          WHERE t.id IS NULL
        `
      }
    ];

    for (const check of foreignKeyChecks) {
      const result = await db.execute(check.query);
      if (result.length > 0) {
        issues.push(`${check.name}: ${result.length} enregistrements orphelins`);
      }
    }

    // Vérifier les données cohérentes
    const dataChecks = [
      {
        name: 'Prix négatifs dans menu_items',
        query: sql`SELECT COUNT(*) as count FROM menu_items WHERE price < 0`
      },
      {
        name: 'Capacité négative dans tables',
        query: sql`SELECT COUNT(*) as count FROM tables WHERE capacity < 1`
      }
    ];

    for (const check of dataChecks) {
      const result = await db.execute(check.query);
      const count = Number(result[0]?.count || 0);
      if (count > 0) {
        issues.push(`${check.name}: ${count} enregistrements problématiques`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ Base de données intègre');
    } else {
      console.log('⚠️ Problèmes détectés:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return { valid: issues.length === 0, issues };

  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    return { valid: false, issues: ['Erreur lors de la validation'] };
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'reset':
      resetDatabase().catch(console.error);
      break;
    case 'backup':
      backupDatabase(process.argv[3]).catch(console.error);
      break;
    case 'stats':
      getDatabaseStats().then(stats => {
        console.log('📊 Statistiques:');
        console.log('Santé:', stats.health.healthy ? '✅' : '❌');
        console.log('Tables:');
        Object.entries(stats.tables).forEach(([name, count]) => {
          console.log(`  ${name}: ${count}`);
        });
      }).catch(console.error);
      break;
    case 'validate':
      validateDatabaseIntegrity().catch(console.error);
      break;
    default:
      console.log('Commandes disponibles:');
      console.log('  reset    - Supprimer toutes les tables');
      console.log('  backup   - Sauvegarder la base');
      console.log('  stats    - Afficher les statistiques');
      console.log('  validate - Valider l\'intégrité');
  }
}
