import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  users, menuCategories, menuItems, tables, customers, employees,
  orders, orderItems, permissions, reservations, reservationItems,
  activityLogs, contactMessages, workShifts
} from '../shared/schema';

// Interface pour les statistiques de base de données
interface DatabaseStats {
  users: number;
  menuCategories: number;
  menuItems: number;
  tables: number;
  customers: number;
  employees: number;
  orders: number;
  orderItems: number;
  permissions: number;
  reservations: number;
  reservationItems: number;
  activityLogs: number;
  contactMessages: number;
  workShifts: number;
  totalRecords: number;
}

interface IntegrityIssue {
  table: string;
  issue: string;
  count: number;
  details?: string;
}

// Utilitaires pour la gestion de la base de données
export class DatabaseUtils {
  
  /**
   * Obtenir les statistiques complètes de la base de données
   */
  static async getStats(): Promise<DatabaseStats> {
    console.log('📊 Collecte des statistiques de la base de données...');
    
    const db = await getDb();
    
    const [
      usersCount,
      categoriesCount,
      menuItemsCount,
      tablesCount,
      customersCount,
      employeesCount,
      ordersCount,
      orderItemsCount,
      permissionsCount,
      reservationsCount,
      reservationItemsCount,
      activityLogsCount,
      contactMessagesCount,
      workShiftsCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(menuCategories),
      db.select({ count: sql<number>`count(*)` }).from(menuItems),
      db.select({ count: sql<number>`count(*)` }).from(tables),
      db.select({ count: sql<number>`count(*)` }).from(customers),
      db.select({ count: sql<number>`count(*)` }).from(employees),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(orderItems),
      db.select({ count: sql<number>`count(*)` }).from(permissions),
      db.select({ count: sql<number>`count(*)` }).from(reservations),
      db.select({ count: sql<number>`count(*)` }).from(reservationItems),
      db.select({ count: sql<number>`count(*)` }).from(activityLogs),
      db.select({ count: sql<number>`count(*)` }).from(contactMessages),
      db.select({ count: sql<number>`count(*)` }).from(workShifts)
    ]);
    
    const stats: DatabaseStats = {
      users: usersCount[0].count,
      menuCategories: categoriesCount[0].count,
      menuItems: menuItemsCount[0].count,
      tables: tablesCount[0].count,
      customers: customersCount[0].count,
      employees: employeesCount[0].count,
      orders: ordersCount[0].count,
      orderItems: orderItemsCount[0].count,
      permissions: permissionsCount[0].count,
      reservations: reservationsCount[0].count,
      reservationItems: reservationItemsCount[0].count,
      activityLogs: activityLogsCount[0].count,
      contactMessages: contactMessagesCount[0].count,
      workShifts: workShiftsCount[0].count,
      totalRecords: 0
    };
    
    stats.totalRecords = Object.values(stats).reduce((sum, count) => 
      typeof count === 'number' ? sum + count : sum, 0);
    
    return stats;
  }
  
  /**
   * Afficher les statistiques de façon formatée
   */
  static printStats(stats: DatabaseStats): void {
    console.log('\n📊 STATISTIQUES DE LA BASE DE DONNÉES');
    console.log('=====================================');
    console.log(`👥 Utilisateurs: ${stats.users.toLocaleString()}`);
    console.log(`👨‍💼 Employés: ${stats.employees.toLocaleString()}`);
    console.log(`🔐 Permissions: ${stats.permissions.toLocaleString()}`);
    console.log(`📂 Catégories de menu: ${stats.menuCategories.toLocaleString()}`);
    console.log(`🍽️ Éléments de menu: ${stats.menuItems.toLocaleString()}`);
    console.log(`🪑 Tables: ${stats.tables.toLocaleString()}`);
    console.log(`👤 Clients: ${stats.customers.toLocaleString()}`);
    console.log(`🛒 Commandes: ${stats.orders.toLocaleString()}`);
    console.log(`📦 Articles commandés: ${stats.orderItems.toLocaleString()}`);
    console.log(`📅 Réservations: ${stats.reservations.toLocaleString()}`);
    console.log(`📋 Items de réservation: ${stats.reservationItems.toLocaleString()}`);
    console.log(`📝 Messages de contact: ${stats.contactMessages.toLocaleString()}`);
    console.log(`⏰ Horaires de travail: ${stats.workShifts.toLocaleString()}`);
    console.log(`📊 Logs d'activité: ${stats.activityLogs.toLocaleString()}`);
    console.log('=====================================');
    console.log(`🗂️ TOTAL ENREGISTREMENTS: ${stats.totalRecords.toLocaleString()}`);
    console.log('=====================================\n');
  }
  
  /**
   * Vérifier l'intégrité de la base de données
   */
  static async validateIntegrity(): Promise<IntegrityIssue[]> {
    console.log('🔍 Vérification de l\'intégrité de la base de données...');
    
    const db = await getDb();
    const issues: IntegrityIssue[] = [];
    
    try {
      // Vérifier les clés étrangères orphelines dans menu_items
      const orphanedMenuItems = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM menu_items mi 
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
        WHERE mc.id IS NULL
      `);
      
      if (orphanedMenuItems[0]?.count > 0) {
        issues.push({
          table: 'menu_items',
          issue: 'Éléments de menu sans catégorie valide',
          count: Number(orphanedMenuItems[0].count),
          details: 'Des éléments de menu référencent des catégories inexistantes'
        });
      }
      
      // Vérifier les clés étrangères orphelines dans order_items
      const orphanedOrderItems = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM order_items oi 
        LEFT JOIN orders o ON oi.order_id = o.id 
        WHERE o.id IS NULL
      `);
      
      if (orphanedOrderItems[0]?.count > 0) {
        issues.push({
          table: 'order_items',
          issue: 'Articles de commande sans commande valide',
          count: Number(orphanedOrderItems[0].count),
          details: 'Des articles référencent des commandes inexistantes'
        });
      }
      
      // Vérifier les clés étrangères orphelines dans permissions
      const orphanedPermissions = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM permissions p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE u.id IS NULL
      `);
      
      if (orphanedPermissions[0]?.count > 0) {
        issues.push({
          table: 'permissions',
          issue: 'Permissions sans utilisateur valide',
          count: Number(orphanedPermissions[0].count),
          details: 'Des permissions référencent des utilisateurs inexistants'
        });
      }
      
      // Vérifier les incohérences de prix dans order_items
      const priceInconsistencies = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM order_items oi 
        JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.price != mi.price
      `);
      
      if (priceInconsistencies[0]?.count > 0) {
        issues.push({
          table: 'order_items',
          issue: 'Incohérences de prix avec le menu',
          count: Number(priceInconsistencies[0].count),
          details: 'Prix dans les commandes différent des prix actuels du menu'
        });
      }
      
      // Vérifier les utilisateurs sans permissions
      const usersWithoutPermissions = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM users u 
        LEFT JOIN permissions p ON u.id = p.user_id 
        WHERE p.user_id IS NULL
      `);
      
      if (usersWithoutPermissions[0]?.count > 0) {
        issues.push({
          table: 'users',
          issue: 'Utilisateurs sans permissions définies',
          count: Number(usersWithoutPermissions[0].count),
          details: 'Des utilisateurs n\'ont aucune permission assignée'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      issues.push({
        table: 'general',
        issue: 'Erreur lors de la validation',
        count: 0,
        details: error.message
      });
    }
    
    return issues;
  }
  
  /**
   * Afficher les problèmes d'intégrité
   */
  static printIntegrityIssues(issues: IntegrityIssue[]): void {
    if (issues.length === 0) {
      console.log('✅ Aucun problème d\'intégrité détecté');
      return;
    }
    
    console.log('\n⚠️ PROBLÈMES D\'INTÉGRITÉ DÉTECTÉS');
    console.log('================================');
    
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.table.toUpperCase()}`);
      console.log(`   📋 ${issue.issue}`);
      console.log(`   📊 Nombre: ${issue.count}`);
      if (issue.details) {
        console.log(`   💬 Détails: ${issue.details}`);
      }
      console.log('');
    });
    
    console.log('================================\n');
  }
  
  /**
   * Reset sécurisé de la base de données
   */
  static async safeReset(options: { confirmReset?: boolean } = {}): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('🚫 Reset interdit en production pour sécurité');
    }
    
    if (!options.confirmReset) {
      console.log('⚠️ Reset de la base de données demandé mais non confirmé');
      console.log('💡 Utilisez { confirmReset: true } pour confirmer');
      return false;
    }
    
    console.log('🗑️ Début du reset de la base de données...');
    
    try {
      const db = await getDb();
      
      // Suppression ordonnée pour respecter les clés étrangères
      await db.transaction(async (tx) => {
        console.log('🗑️ Suppression des données liées...');
        
        // Suppression dans l'ordre inverse des dépendances
        await tx.delete(reservationItems);
        await tx.delete(orderItems);
        await tx.delete(workShifts);
        await tx.delete(activityLogs);
        await tx.delete(permissions);
        await tx.delete(contactMessages);
        await tx.delete(reservations);
        await tx.delete(orders);
        await tx.delete(menuItems);
        await tx.delete(menuCategories);
        await tx.delete(employees);
        await tx.delete(customers);
        await tx.delete(tables);
        await tx.delete(users);
        
        console.log('✅ Toutes les données supprimées');
      });
      
      // Reset des séquences PostgreSQL
      await db.execute(sql`
        SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('menu_categories', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('menu_items', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('tables', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('customers', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('employees', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('orders', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('order_items', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('permissions', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('reservations', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('reservation_items', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('contact_messages', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('work_shifts', 'id'), 1, false);
      `);
      
      console.log('✅ Reset terminé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors du reset:', error);
      throw error;
    }
  }
  
  /**
   * Vérifier la santé de la base de données
   */
  static async checkHealth(): Promise<{
    healthy: boolean;
    version?: string;
    uptime?: string;
    connections?: number;
    errors?: string[];
  }> {
    try {
      const db = await getDb();
      
      // Informations sur la version PostgreSQL
      const versionResult = await db.execute(sql`SELECT version()`);
      const version = versionResult[0]?.version as string;
      
      // Informations sur les connexions
      const connectionsResult = await db.execute(sql`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      const connections = Number(connectionsResult[0]?.active_connections) || 0;
      
      // Uptime de la base de données
      const uptimeResult = await db.execute(sql`
        SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
      `);
      const uptime = uptimeResult[0]?.uptime as string;
      
      return {
        healthy: true,
        version: version?.split(',')[0],
        uptime,
        connections
      };
      
    } catch (error) {
      return {
        healthy: false,
        errors: [error.message]
      };
    }
  }
}

// Interface CLI pour les utilitaires
async function runCLI() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'stats':
        const stats = await DatabaseUtils.getStats();
        DatabaseUtils.printStats(stats);
        break;
        
      case 'validate':
        const issues = await DatabaseUtils.validateIntegrity();
        DatabaseUtils.printIntegrityIssues(issues);
        break;
        
      case 'health':
        const health = await DatabaseUtils.checkHealth();
        console.log('🏥 État de santé de la base de données:');
        console.log('=====================================');
        console.log(`✅ Statut: ${health.healthy ? 'Saine' : 'Problème détecté'}`);
        if (health.version) console.log(`📋 Version: ${health.version}`);
        if (health.uptime) console.log(`⏰ Uptime: ${health.uptime}`);
        if (health.connections !== undefined) console.log(`🔗 Connexions actives: ${health.connections}`);
        if (health.errors) {
          console.log('❌ Erreurs:');
          health.errors.forEach(error => console.log(`   - ${error}`));
        }
        break;
        
      case 'reset':
        await DatabaseUtils.safeReset({ confirmReset: true });
        break;
        
      default:
        console.log('🛠️ Utilitaires de base de données Barista Café');
        console.log('===============================================');
        console.log('Commandes disponibles:');
        console.log('  stats    - Afficher les statistiques');
        console.log('  validate - Vérifier l\'intégrité');
        console.log('  health   - État de santé de la DB');
        console.log('  reset    - Reset sécurisé (dev only)');
        console.log('');
        console.log('Utilisation: tsx scripts/db-utils.ts <commande>');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécution CLI si appelé directement
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  runCLI();
}