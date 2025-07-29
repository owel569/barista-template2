
import fs from 'fs';
import fg from 'fast-glob';
import chalk from 'chalk';

// Corrections spécifiques pour la logique métier du restaurant
const businessTypeReplacements = [
  // Gestion des commandes
  { pattern: /order:\s*any/g, replacement: 'order: Order', desc: 'Order type' },
  { pattern: /orderData:\s*any/g, replacement: 'orderData: OrderData', desc: 'OrderData type' },
  { pattern: /orderItem:\s*any/g, replacement: 'orderItem: OrderItem', desc: 'OrderItem type' },
  { pattern: /orderItems:\s*any/g, replacement: 'orderItems: OrderItem[]', desc: 'OrderItem array' },
  
  // Gestion du menu
  { pattern: /menuItem:\s*any/g, replacement: 'menuItem: MenuItem', desc: 'MenuItem type' },
  { pattern: /menuData:\s*any/g, replacement: 'menuData: MenuData', desc: 'MenuData type' },
  { pattern: /category:\s*any/g, replacement: 'category: MenuCategory', desc: 'MenuCategory type' },
  
  // Gestion des réservations
  { pattern: /reservation:\s*any/g, replacement: 'reservation: Reservation', desc: 'Reservation type' },
  { pattern: /booking:\s*any/g, replacement: 'booking: Booking', desc: 'Booking type' },
  { pattern: /reservationData:\s*any/g, replacement: 'reservationData: ReservationData', desc: 'ReservationData type' },
  
  // Gestion des clients
  { pattern: /customer:\s*any/g, replacement: 'customer: Customer', desc: 'Customer type' },
  { pattern: /customerData:\s*any/g, replacement: 'customerData: CustomerData', desc: 'CustomerData type' },
  { pattern: /user:\s*any/g, replacement: 'user: User', desc: 'User type' },
  
  // Gestion des paiements
  { pattern: /payment:\s*any/g, replacement: 'payment: Payment', desc: 'Payment type' },
  { pattern: /paymentData:\s*any/g, replacement: 'paymentData: PaymentData', desc: 'PaymentData type' },
  { pattern: /transaction:\s*any/g, replacement: 'transaction: Transaction', desc: 'Transaction type' },
  
  // Gestion de l'inventaire
  { pattern: /inventory:\s*any/g, replacement: 'inventory: InventoryItem', desc: 'InventoryItem type' },
  { pattern: /stock:\s*any/g, replacement: 'stock: StockLevel', desc: 'StockLevel type' },
  { pattern: /product:\s*any/g, replacement: 'product: Product', desc: 'Product type' },
  
  // Gestion des employés
  { pattern: /employee:\s*any/g, replacement: 'employee: Employee', desc: 'Employee type' },
  { pattern: /staff:\s*any/g, replacement: 'staff: StaffMember', desc: 'StaffMember type' },
  { pattern: /schedule:\s*any/g, replacement: 'schedule: WorkSchedule', desc: 'WorkSchedule type' },
  
  // Gestion des tables
  { pattern: /table:\s*any/g, replacement: 'table: Table', desc: 'Table type' },
  { pattern: /tableData:\s*any/g, replacement: 'tableData: TableData', desc: 'TableData type' },
  
  // Analytics et rapports
  { pattern: /analytics:\s*any/g, replacement: 'analytics: AnalyticsData', desc: 'AnalyticsData type' },
  { pattern: /report:\s*any/g, replacement: 'report: ReportData', desc: 'ReportData type' },
  { pattern: /metric:\s*any/g, replacement: 'metric: MetricData', desc: 'MetricData type' },
  { pattern: /stats:\s*any/g, replacement: 'stats: Statistics', desc: 'Statistics type' },
];

async function fixBusinessLogicTypes(): Promise<void> {
  console.log(chalk.cyan('🔧 CORRECTION DES TYPES MÉTIER - RESTAURANT BARISTA CAFÉ\n'));

  try {
    const files = await fg([
      'server/**/*.ts',
      'client/**/*.tsx',
      'client/**/*.ts',
      'shared/**/*.ts'
    ], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    console.log(chalk.blue(`📁 ${files.length} fichiers à analyser\n`));

    let totalReplacements = 0;
    const modifiedFiles: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let fileReplacements = 0;

      for (const replacement of businessTypeReplacements) {
        const matches = content.match(replacement.pattern);
        if (matches) {
          newContent = newContent.replace(replacement.pattern, replacement.replacement);
          fileReplacements += matches.length;
          console.log(chalk.yellow(`  ⚡ ${replacement.desc}: ${matches.length} correction(s)`));
        }
      }

      if (fileReplacements > 0) {
        totalReplacements += fileReplacements;
        modifiedFiles.push(file);
        
        // Écrire les changements
        fs.writeFileSync(file, newContent);
        console.log(chalk.green(`✅ ${file}: ${fileReplacements} correction(s) appliquée(s)`));
        console.log();
      }
    }

    console.log(chalk.magenta(`\n📊 RÉSUMÉ CORRECTIONS MÉTIER:`));
    console.log(chalk.white(`  • ${totalReplacements} corrections de types métier`));
    console.log(chalk.white(`  • ${modifiedFiles.length} fichiers optimisés`));
    
    if (totalReplacements > 0) {
      console.log(chalk.green(`\n🎉 Types métier corrigés avec succès!`));
      console.log(chalk.green(`🏪 Votre restaurant Barista Café est maintenant plus sûr`));
    } else {
      console.log(chalk.green(`\n✅ Tous les types métier sont déjà optimaux!`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la correction:'), error);
    process.exit(1);
  }
}

fixBusinessLogicTypes();
