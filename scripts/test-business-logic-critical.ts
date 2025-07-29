#!/usr/bin/env tsx

/**
 * Tests automatisés pour la logique métier critique - Barista Café
 * Valide les calculs financiers, commandes, réservations
 * 
 * Usage: npm run test:business-logic
 */

import chalk from 'chalk';
import { z } from 'zod';

console.log(chalk.cyan('🧪 TESTS LOGIQUE MÉTIER CRITIQUE - BARISTA CAFÉ\n'));

// ===== INTERFACES ET TYPES =====

interface MenuItem {
  id: number;
  name: string;
  price: number;
  cost: number;
  preparationTime: number;
  category: string;
}

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface Reservation {
  id: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  tableId: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  duration: number; // minutes
}

interface Customer {
  id: number;
  name: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
}

// ===== VALIDATEURS =====

const MenuItemSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(100),
  price: z.number().positive().max(1000),
  cost: z.number().positive().max(500),
  preparationTime: z.number().int().positive().max(60),
  category: z.string().min(1)
});

const OrderItemSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().int().positive().max(50),
  price: z.number().positive(),
  name: z.string().min(1)
});

const ReservationSchema = z.object({
  customerName: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().positive().max(20),
  tableId: z.number().positive(),
  duration: z.number().int().positive().max(300)
});

// ===== FONCTIONS DE LOGIQUE MÉTIER =====

// Calculs financiers
function calculateSubtotal(items: OrderItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
}

function calculateTax(subtotal: number, taxRate: number = 0.20): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

function calculateTotal(subtotal: number, tax: number, deliveryFee: number = 0): number {
  return Math.round((subtotal + tax + deliveryFee) * 100) / 100;
}

function calculateLoyaltyPoints(total: number): number {
  return Math.floor(total); // 1 point par euro dépensé
}

function calculatePreparationTime(items: OrderItem[], menuItems: MenuItem[]): number {
  return items.reduce((total, item) => {
    const menuItem = menuItems.find(mi => mi.id === item.productId);
    return total + (menuItem?.preparationTime || 5) * item.quantity;
  }, 0);
}

// Validation des réservations
function isValidReservationDate(date: string): boolean {
  const reservationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return reservationDate >= today;
}

function isValidPartySize(size: number): boolean {
  return size >= 1 && size <= 20;
}

function hasReservationConflict(
  existing: Reservation,
  newReservation: Reservation
): boolean {
  if (existing.tableId !== newReservation.tableId) return false;
  if (existing.date !== newReservation.date) return false;

  const existingStart = new Date(`${existing.date}T${existing.time}`);
  const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);
  
  const newStart = new Date(`${newReservation.date}T${newReservation.time}`);
  const newEnd = new Date(newStart.getTime() + newReservation.duration * 60000);

  return existingStart < newEnd && existingEnd > newStart;
}

// Validation des commandes
function canTransitionStatus(current: string, target: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'pending': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  return validTransitions[current]?.includes(target) || false;
}

function hasSufficientStock(order: Order, stockLevels: Array<{productId: number, available: number}>): boolean {
  return order.items.every(item => {
    const stock = stockLevels.find(s => s.productId === item.productId);
    return stock && stock.available >= item.quantity;
  });
}

// ===== TESTS AUTOMATISÉS =====

class BusinessLogicTester {
  private testResults: Array<{name: string, passed: boolean, error?: string}> = [];
  private menuItems: MenuItem[] = [
    { id: 1, name: 'Cappuccino', price: 4.50, cost: 1.80, preparationTime: 3, category: 'boissons' },
    { id: 2, name: 'Croissant', price: 2.50, cost: 0.75, preparationTime: 1, category: 'patisseries' },
    { id: 3, name: 'Sandwich Jambon', price: 6.50, cost: 2.60, preparationTime: 5, category: 'plats' }
  ];

  // Test des calculs financiers
  testFinancialCalculations(): void {
    console.log(chalk.yellow('\n💰 TESTS CALCULS FINANCIERS'));
    
    // Test sous-total
    const items: OrderItem[] = [
      { productId: 1, quantity: 2, price: 4.50, name: 'Cappuccino' },
      { productId: 2, quantity: 1, price: 2.50, name: 'Croissant' }
    ];
    
    const subtotal = calculateSubtotal(items);
    this.assert(subtotal === 11.50, 'Calcul sous-total correct', 'Sous-total incorrect');
    
    // Test TVA
    const tax = calculateTax(subtotal);
    this.assert(tax === 2.30, 'Calcul TVA correct', 'TVA incorrecte');
    
    // Test total
    const total = calculateTotal(subtotal, tax);
    this.assert(total === 13.80, 'Calcul total correct', 'Total incorrect');
    
    // Test points fidélité
    const points = calculateLoyaltyPoints(total);
    this.assert(points === 13, 'Calcul points fidélité correct', 'Points fidélité incorrects');
  }

  // Test des réservations
  testReservations(): void {
    console.log(chalk.yellow('\n📅 TESTS RÉSERVATIONS'));
    
    // Test date valide
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const validDate = futureDate.toISOString().split('T')[0];
    
    this.assert(isValidReservationDate(validDate), 'Date future valide', 'Date future rejetée');
    
    // Test date passée
    const pastDate = '2020-01-01';
    this.assert(!isValidReservationDate(pastDate), 'Date passée rejetée', 'Date passée acceptée');
    
    // Test taille groupe
    this.assert(isValidPartySize(5), 'Taille groupe valide', 'Taille groupe valide rejetée');
    this.assert(!isValidPartySize(25), 'Taille groupe invalide rejetée', 'Taille groupe invalide acceptée');
    
    // Test conflit réservation
    const existing: Reservation = {
      id: '1',
      customerName: 'Jean Dupont',
      date: '2024-01-15',
      time: '19:00',
      partySize: 4,
      tableId: 1,
      status: 'confirmed',
      duration: 120
    };
    
    const conflicting: Reservation = {
      id: '2',
      customerName: 'Marie Martin',
      date: '2024-01-15',
      time: '20:00',
      partySize: 3,
      tableId: 1,
      status: 'pending',
      duration: 90
    };
    
    this.assert(hasReservationConflict(existing, conflicting), 'Conflit détecté', 'Conflit non détecté');
  }

  // Test des commandes
  testOrders(): void {
    console.log(chalk.yellow('\n🛒 TESTS COMMANDES'));
    
    // Test transition d'état
    this.assert(canTransitionStatus('pending', 'preparing'), 'Transition valide', 'Transition valide rejetée');
    this.assert(!canTransitionStatus('completed', 'pending'), 'Transition invalide rejetée', 'Transition invalide acceptée');
    
    // Test temps préparation
    const items: OrderItem[] = [
      { productId: 1, quantity: 2, price: 4.50, name: 'Cappuccino' },
      { productId: 3, quantity: 1, price: 6.50, name: 'Sandwich' }
    ];
    
    const prepTime = calculatePreparationTime(items, this.menuItems);
    this.assert(prepTime === 11, 'Temps préparation correct', 'Temps préparation incorrect');
    
    // Test stock suffisant
    const stockLevels = [
      { productId: 1, available: 5 },
      { productId: 3, available: 2 }
    ];
    
    const order: Order = {
      id: '1',
      items,
      subtotal: 15.50,
      tax: 3.10,
      total: 18.60,
      customerName: 'Test Client',
      status: 'pending',
      createdAt: new Date()
    };
    
    this.assert(hasSufficientStock(order, stockLevels), 'Stock suffisant', 'Stock insuffisant détecté');
  }

  // Test de validation des données
  testDataValidation(): void {
    console.log(chalk.yellow('\n✅ TESTS VALIDATION DONNÉES'));
    
    // Test validation menu item
    const validMenuItem = {
      id: 1,
      name: 'Test Item',
      price: 5.00,
      cost: 2.00,
      preparationTime: 5,
      category: 'test'
    };
    
    const result = MenuItemSchema.safeParse(validMenuItem);
    this.assert(result.success, 'Menu item valide', 'Menu item invalide');
    
    // Test validation réservation
    const validReservation = {
      customerName: 'Test Client',
      date: '2024-01-15',
      time: '19:00',
      partySize: 4,
      tableId: 1,
      duration: 120
    };
    
    const reservationResult = ReservationSchema.safeParse(validReservation);
    this.assert(reservationResult.success, 'Réservation valide', 'Réservation invalide');
  }

  // Méthodes utilitaires
  private assert(condition: boolean, successMessage: string, errorMessage: string): void {
    if (condition) {
      console.log(chalk.green(`  ✅ ${successMessage}`));
      this.testResults.push({ name: successMessage, passed: true });
    } else {
      console.log(chalk.red(`  ❌ ${errorMessage}`));
      this.testResults.push({ name: errorMessage, passed: false, error: errorMessage });
    }
  }

  // Exécution de tous les tests
  runAllTests(): void {
    console.log(chalk.blue('🚀 DÉMARRAGE DES TESTS LOGIQUE MÉTIER\n'));
    
    this.testFinancialCalculations();
    this.testReservations();
    this.testOrders();
    this.testDataValidation();
    
    this.printSummary();
  }

  private printSummary(): void {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;
    
    console.log(chalk.blue('\n' + '═'.repeat(60)));
    console.log(chalk.cyan('📊 RÉSUMÉ DES TESTS'));
    console.log(chalk.blue('═'.repeat(60)));
    console.log(chalk.green(`✅ Tests réussis: ${passed}`));
    console.log(chalk.red(`❌ Tests échoués: ${failed}`));
    console.log(chalk.blue(`📈 Taux de réussite: ${Math.round((passed / total) * 100)}%`));
    
    if (failed > 0) {
      console.log(chalk.red('\n🔍 Tests échoués:'));
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(chalk.red(`  - ${r.name}`)));
    }
    
    console.log(chalk.blue('\n🎯 RECOMMANDATIONS:'));
    if (failed === 0) {
      console.log(chalk.green('  ✅ Tous les tests critiques passent'));
      console.log(chalk.green('  ✅ La logique métier est valide'));
      console.log(chalk.green('  ✅ Prêt pour la production'));
    } else {
      console.log(chalk.red('  ⚠️  Corriger les tests échoués avant déploiement'));
      console.log(chalk.red('  ⚠️  Valider la logique métier avec l\'équipe'));
      console.log(chalk.red('  ⚠️  Effectuer des tests manuels supplémentaires'));
    }
  }
}

// ===== EXÉCUTION =====

const tester = new BusinessLogicTester();
tester.runAllTests();

export { BusinessLogicTester, calculateSubtotal, calculateTax, calculateTotal }; 