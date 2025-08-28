
#!/usr/bin/env tsx
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

const logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️  ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`❌ ${msg}`, data || ''),
  success: (msg: string, data?: any) => console.log(`✅ ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`⚠️  ${msg}`, data || '')
};

async function testDatabaseConnection() {
  logger.info('Test de connexion à la base de données...');
  
  try {
    const db = getDb();
    
    // Test de connexion basique
    const result = await db.execute(sql`SELECT 1 as test`);
    logger.success('Connexion à la base de données réussie');
    
    return true;
  } catch (error) {
    logger.error('Échec de la connexion à la base de données:', error);
    return false;
  }
}

async function checkTablesStructure() {
  logger.info('Vérification de la structure des tables...');
  
  try {
    const db = getDb();
    
    // Vérifier les tables existantes
    const tablesResult = await db.execute(sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.map(row => row.table_name);
    logger.info(`Tables trouvées (${tables.length}):`, tables);
    
    // Vérifier spécifiquement la table users
    if (tables.includes('users')) {
      const usersColumns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      logger.info('Colonnes de la table users:', usersColumns);
      
      // Compter les utilisateurs
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      logger.info(`Nombre d'utilisateurs: ${userCount[0]?.count || 0}`);
    } else {
      logger.warn('Table users non trouvée');
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la vérification des tables:', error);
    return false;
  }
}

async function checkDrizzleMetadata() {
  logger.info('Vérification des métadonnées Drizzle...');
  
  try {
    const db = getDb();
    
    // Vérifier si la table de migrations Drizzle existe
    const migrationsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
    
    if (migrationsTableExists[0]?.exists) {
      const migrations = await db.execute(sql`
        SELECT id, hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      logger.info(`Migrations Drizzle trouvées (${migrations.length}):`, migrations);
    } else {
      logger.warn('Table de migrations Drizzle non trouvée');
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la vérification des métadonnées Drizzle:', error);
    return false;
  }
}

async function fixDatabaseIssues() {
  logger.info('Tentative de correction des problèmes de base de données...');
  
  try {
    const db = getDb();
    
    // Nettoyer les connexions suspendues
    await db.execute(sql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state = 'idle'
      AND state_change < current_timestamp - INTERVAL '5 minutes'
    `);
    
    logger.success('Connexions suspendues nettoyées');
    
    // Rafraîchir les statistiques
    await db.execute(sql`ANALYZE`);
    logger.success('Statistiques de base de données rafraîchies');
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la correction:', error);
    return false;
  }
}

async function generateDatabaseReport() {
  logger.info('Génération du rapport de base de données...');
  
  try {
    const db = getDb();
    
    // Informations générales de la base de données
    const dbInfo = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgresql_version
    `);
    
    // Taille de la base de données
    const dbSize = await db.execute(sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    
    // Statistiques des connexions
    const connectionStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const report = {
      database: dbInfo[0],
      size: dbSize[0],
      connections: connectionStats[0],
      timestamp: new Date().toISOString()
    };
    
    logger.success('Rapport de base de données:', report);
    return report;
    
  } catch (error) {
    logger.error('Erreur lors de la génération du rapport:', error);
    return null;
  }
}

async function main() {
  console.log('🔧 Diagnostic et correction de la base de données\n');
  
  const steps = [
    { name: 'Test de connexion', fn: testDatabaseConnection },
    { name: 'Vérification des tables', fn: checkTablesStructure },
    { name: 'Vérification des métadonnées Drizzle', fn: checkDrizzleMetadata },
    { name: 'Correction des problèmes', fn: fixDatabaseIssues },
    { name: 'Génération du rapport', fn: generateDatabaseReport }
  ];
  
  let allSuccess = true;
  
  for (const step of steps) {
    logger.info(`--- ${step.name} ---`);
    const result = await step.fn();
    if (!result) {
      allSuccess = false;
      logger.error(`Échec: ${step.name}`);
    }
    console.log('');
  }
  
  if (allSuccess) {
    logger.success('🎉 Tous les diagnostics sont passés avec succès!');
    logger.info('💡 Suggestions:');
    console.log('  - Redémarrez Drizzle Studio si nécessaire');
    console.log('  - Vérifiez que DATABASE_URL est correctement configuré');
    console.log('  - Essayez de rafraîchir la page Drizzle Studio');
  } else {
    logger.error('❌ Certains problèmes ont été détectés');
    logger.info('💡 Actions recommandées:');
    console.log('  - Vérifiez la configuration DATABASE_URL');
    console.log('  - Redémarrez le serveur de base de données');
    console.log('  - Exécutez les migrations si nécessaire');
  }
  
  process.exit(allSuccess ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Erreur critique:', error);
    process.exit(1);
  });
}
