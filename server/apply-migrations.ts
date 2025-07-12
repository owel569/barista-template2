import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function applyMigrations(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe',
  });

  try {
    console.log('🔄 Application des migrations pour améliorer le schéma de base de données...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations/0001_improve_database_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Diviser en plusieurs commandes pour éviter les erreurs de syntaxe
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await pool.query(command);
          console.log('✅ Migration appliquée:', command.substring(0, 50) + '...');
        } catch (error: any) {
          // Ignorer les erreurs de type "already exists" mais logger les autres
          if (error.code === '42P07' || error.code === '23505' || error.code === '42701') {
            console.log('⚠️  Élément déjà existant, ignoré:', error.message);
          } else {
            console.error('❌ Erreur lors de l\'application de la migration:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migrations appliquées avec succès!');
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'application des migrations:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter les migrations si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigrations().catch(console.error);
}