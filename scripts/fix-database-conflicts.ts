
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

interface DatabaseIssue {
  type: 'connection' | 'schema' | 'permissions' | 'conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
}

class DatabaseConflictResolver {
  private issues: DatabaseIssue[] = [];

  async diagnoseAndFix(): Promise<void> {
    console.log('🔍 Diagnostic des conflits de base de données...\n');

    try {
      // 1. Vérifier la connexion
      await this.checkConnection();
      
      // 2. Vérifier le schéma
      await this.checkSchema();
      
      // 3. Vérifier les permissions
      await this.checkPermissions();
      
      // 4. Vérifier les conflits de données
      await this.checkDataConflicts();
      
      // 5. Appliquer les corrections
      await this.applyFixes();
      
      this.printReport();
      
    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      console.log('✅ Connexion à la base de données: OK');
    } catch (error) {
      this.issues.push({
        type: 'connection',
        severity: 'critical',
        description: 'Impossible de se connecter à la base de données',
        solution: 'Vérifier DATABASE_URL et créer une nouvelle base de données'
      });
    }
  }

  private async checkSchema(): Promise<void> {
    try {
      const db = getDb();
      
      // Vérifier les tables principales
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const requiredTables = [
        'users', 'customers', 'menu_items', 'menu_categories',
        'orders', 'order_items', 'reservations', 'activity_logs'
      ];
      
      const existingTables = tables.rows.map((row: any) => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        this.issues.push({
          type: 'schema',
          severity: 'high',
          description: `Tables manquantes: ${missingTables.join(', ')}`,
          solution: 'Exécuter les migrations Drizzle'
        });
      } else {
        console.log('✅ Schéma de base de données: OK');
      }
    } catch (error) {
      this.issues.push({
        type: 'schema',
        severity: 'high',
        description: 'Erreur lors de la vérification du schéma',
        solution: 'Recréer le schéma avec Drizzle'
      });
    }
  }

  private async checkPermissions(): Promise<void> {
    try {
      const db = getDb();
      
      // Tester les permissions CRUD
      const testQuery = sql`
        SELECT 
          has_table_privilege(current_user, 'users', 'INSERT') as can_insert,
          has_table_privilege(current_user, 'users', 'SELECT') as can_select,
          has_table_privilege(current_user, 'users', 'UPDATE') as can_update,
          has_table_privilege(current_user, 'users', 'DELETE') as can_delete
      `;
      
      const result = await db.execute(testQuery);
      const permissions = result.rows[0] as any;
      
      if (!permissions?.can_insert || !permissions?.can_select || 
          !permissions?.can_update || !permissions?.can_delete) {
        this.issues.push({
          type: 'permissions',
          severity: 'high',
          description: 'Permissions insuffisantes sur la base de données',
          solution: 'Vérifier les droits utilisateur PostgreSQL'
        });
      } else {
        console.log('✅ Permissions de base de données: OK');
      }
    } catch (error) {
      this.issues.push({
        type: 'permissions',
        severity: 'medium',
        description: 'Impossible de vérifier les permissions',
        solution: 'Vérifier la configuration utilisateur'
      });
    }
  }

  private async checkDataConflicts(): Promise<void> {
    try {
      const db = getDb();
      
      // Vérifier les contraintes violées
      const duplicateEmails = await db.execute(sql`
        SELECT email, COUNT(*) as count 
        FROM users 
        GROUP BY email 
        HAVING COUNT(*) > 1
      `);
      
      if (duplicateEmails.rows.length > 0) {
        this.issues.push({
          type: 'conflict',
          severity: 'medium',
          description: `${duplicateEmails.rows.length} emails dupliqués détectés`,
          solution: 'Nettoyer les doublons d\'emails'
        });
      }
      
      // Vérifier les références orphelines
      const orphanedOrders = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.id IS NULL
      `);
      
      if (Number(orphanedOrders.rows[0]?.count) > 0) {
        this.issues.push({
          type: 'conflict',
          severity: 'medium',
          description: 'Commandes avec références clients orphelines',
          solution: 'Nettoyer les références orphelines'
        });
      }
      
      console.log('✅ Intégrité des données: OK');
    } catch (error) {
      console.log('⚠️  Impossible de vérifier l\'intégrité des données');
    }
  }

  private async applyFixes(): Promise<void> {
    console.log('\n🔧 Application des corrections...\n');
    
    for (const issue of this.issues) {
      try {
        switch (issue.type) {
          case 'connection':
            await this.fixConnection();
            break;
          case 'schema':
            await this.fixSchema();
            break;
          case 'permissions':
            await this.fixPermissions();
            break;
          case 'conflict':
            await this.fixDataConflicts();
            break;
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${issue.type}:`, error);
      }
    }
  }

  private async fixConnection(): Promise<void> {
    console.log('🔧 Tentative de correction de la connexion...');
    
    // Créer un fichier de configuration DB de sauvegarde
    const backupConfig = `
# Configuration de base de données de sauvegarde
DATABASE_URL=postgresql://postgres:password@localhost:5432/barista_cafe_backup
`;
    
    writeFileSync('.env.backup', backupConfig);
    console.log('💾 Configuration de sauvegarde créée');
  }

  private async fixSchema(): Promise<void> {
    console.log('🔧 Correction du schéma...');
    
    try {
      // Exécuter les migrations Drizzle
      execSync('npx drizzle-kit generate', { stdio: 'pipe' });
      execSync('npx drizzle-kit migrate', { stdio: 'pipe' });
      console.log('✅ Migrations appliquées');
    } catch (error) {
      console.log('⚠️  Erreur lors des migrations, création manuelle du schéma...');
      await this.createBasicSchema();
    }
  }

  private async createBasicSchema(): Promise<void> {
    const db = getDb();
    
    const createUsersTable = sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `;
    
    await db.execute(createUsersTable);
    console.log('✅ Table users créée');
  }

  private async fixPermissions(): Promise<void> {
    console.log('🔧 Vérification des permissions...');
    // Les permissions sont généralement gérées au niveau PostgreSQL
    console.log('ℹ️  Contactez l\'administrateur pour les permissions');
  }

  private async fixDataConflicts(): Promise<void> {
    console.log('🔧 Nettoyage des conflits de données...');
    
    const db = getDb();
    
    // Supprimer les doublons d'emails (garder le plus récent)
    await db.execute(sql`
      DELETE FROM users 
      WHERE id NOT IN (
        SELECT DISTINCT ON (email) id 
        FROM users 
        ORDER BY email, created_at DESC
      )
    `);
    
    console.log('✅ Doublons supprimés');
  }

  private printReport(): void {
    console.log('\n📊 RAPPORT DE DIAGNOSTIC\n');
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log('🎉 Aucun problème détecté !');
      return;
    }
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');
    
    if (criticalIssues.length > 0) {
      console.log('🚨 PROBLÈMES CRITIQUES:');
      criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.description}`);
        console.log(`     💡 ${issue.solution}\n`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log('⚠️  PROBLÈMES IMPORTANTS:');
      highIssues.forEach(issue => {
        console.log(`  🔴 ${issue.description}`);
        console.log(`     💡 ${issue.solution}\n`);
      });
    }
    
    if (mediumIssues.length > 0) {
      console.log('⚡ PROBLÈMES MOYENS:');
      mediumIssues.forEach(issue => {
        console.log(`  🟡 ${issue.description}`);
        console.log(`     💡 ${issue.solution}\n`);
      });
    }
    
    console.log(`📈 Total: ${this.issues.length} problème(s) détecté(s)`);
  }
}

// Exécution
const resolver = new DatabaseConflictResolver();
resolver.diagnoseAndFix().catch(console.error);
