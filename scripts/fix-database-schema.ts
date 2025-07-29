
import { execSync } from 'child_process';
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixDatabaseSchema() {
  console.log('🔧 Correction du schéma de base de données...');
  
  try {
    const db = await getDb();
    
    // Ajouter les colonnes manquantes à activity_logs
    await db.execute(sql`
      ALTER TABLE activity_logs 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)
    `);
    
    // Ajouter les colonnes manquantes à customers
    await db.execute(sql`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(125),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(125),
      ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0
    `);
    
    // Ajouter la colonne manquante à menu_items
    await db.execute(sql`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES menu_categories(id)
    `);
    
    // Créer les tables manquantes si nécessaire
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_shifts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        position VARCHAR(100),
        status VARCHAR(20) DEFAULT 'scheduled',
        overtime_hours DECIMAL(4,2) DEFAULT 0,
        total_hours DECIMAL(4,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        current_stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER,
        unit VARCHAR(50),
        supplier VARCHAR(255),
        last_restocked TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ok',
        cost DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Schéma de base de données corrigé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixDatabaseSchema();
}

export default fixDatabaseSchema;
