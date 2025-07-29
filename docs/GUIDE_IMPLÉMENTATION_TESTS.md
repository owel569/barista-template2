# GUIDE D'IMPLÉMENTATION DES TESTS AUTOMATISÉS - BARISTA CAFÉ

## 🎯 OBJECTIF

Ce guide vous accompagne dans l'implémentation de tests automatisés pour valider la logique métier critique de votre application Barista Café.

## 📋 PRÉREQUIS

### 1. **Installation des Dépendances**
```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
```

### 2. **Configuration Jest**
Créez un fichier `jest.config.js` :
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🧪 TESTS DES FONCTIONNALITÉS CRITIQUES

### **1. TESTS DES CALCULS FINANCIERS**

#### Test de Validation des Prix
```typescript
// tests/financial/price-validation.test.ts
import { validatePrice, calculateTax, roundToCents } from '../../src/utils/financial';

describe('Validation des prix', () => {
  test('Prix ne peut pas être négatif', () => {
    expect(validatePrice(-5)).toBeFalsy();
    expect(validatePrice(0)).toBeFalsy();
    expect(validatePrice(10)).toBeTruthy();
  });

  test('Calcul TVA correct', () => {
    expect(calculateTax(100, 0.20)).toBe(20);
    expect(calculateTax(50, 0.10)).toBe(5);
    expect(calculateTax(0, 0.20)).toBe(0);
  });

  test('Arrondi correct des totaux', () => {
    expect(roundToCents(10.999)).toBe(11.00);
    expect(roundToCents(10.001)).toBe(10.00);
    expect(roundToCents(10.555)).toBe(10.56);
  });
});
```

#### Test des Calculs de Commandes
```typescript
// tests/financial/order-calculations.test.ts
import { calculateSubtotal, calculateTotal, calculateLoyaltyPoints } from '../../src/utils/orders';

describe('Calculs de commandes', () => {
  const mockItems = [
    { price: 5.50, quantity: 2 },
    { price: 3.00, quantity: 1 },
    { price: 8.75, quantity: 3 }
  ];

  test('Sous-total correct', () => {
    const subtotal = calculateSubtotal(mockItems);
    expect(subtotal).toBe(37.75); // 5.50*2 + 3.00*1 + 8.75*3
  });

  test('Total avec TVA et livraison', () => {
    const subtotal = 37.75;
    const tax = 7.55; // 20% TVA
    const deliveryFee = 2.50;
    const total = calculateTotal(subtotal, tax, deliveryFee);
    expect(total).toBe(47.80);
  });

  test('Points de fidélité corrects', () => {
    expect(calculateLoyaltyPoints(50.00)).toBe(50);
    expect(calculateLoyaltyPoints(25.50)).toBe(25);
    expect(calculateLoyaltyPoints(0)).toBe(0);
  });
});
```

### **2. TESTS DE GESTION DES RÉSERVATIONS**

#### Test de Validation des Réservations
```typescript
// tests/reservations/validation.test.ts
import { 
  isValidReservationDate, 
  isValidPartySize, 
  hasReservationConflict 
} from '../../src/utils/reservations';

describe('Validation des réservations', () => {
  test('Date de réservation dans le futur', () => {
    const pastDate = new Date('2020-01-01');
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 1);

    expect(isValidReservationDate(pastDate)).toBeFalsy();
    expect(isValidReservationDate(today)).toBeTruthy();
    expect(isValidReservationDate(futureDate)).toBeTruthy();
  });

  test('Taille de groupe valide', () => {
    expect(isValidPartySize(0)).toBeFalsy();
    expect(isValidPartySize(1)).toBeTruthy();
    expect(isValidPartySize(10)).toBeTruthy();
    expect(isValidPartySize(20)).toBeTruthy();
    expect(isValidPartySize(25)).toBeFalsy();
  });

  test('Conflit de réservation', () => {
    const existingReservation = {
      tableId: 1,
      date: '2024-01-15',
      time: '19:00',
      duration: 120
    };

    const conflictingReservation = {
      tableId: 1,
      date: '2024-01-15',
      time: '20:00',
      duration: 90
    };

    const nonConflictingReservation = {
      tableId: 2,
      date: '2024-01-15',
      time: '20:00',
      duration: 90
    };

    expect(hasReservationConflict(existingReservation, conflictingReservation)).toBeTruthy();
    expect(hasReservationConflict(existingReservation, nonConflictingReservation)).toBeFalsy();
  });
});
```

### **3. TESTS DE GESTION DES COMMANDES**

#### Test du Workflow des Commandes
```typescript
// tests/orders/workflow.test.ts
import { 
  canTransitionStatus, 
  calculatePreparationTime, 
  hasSufficientStock 
} from '../../src/utils/orders';

describe('Workflow des commandes', () => {
  test('Transition d\'état valide', () => {
    expect(canTransitionStatus('pending', 'preparing')).toBeTruthy();
    expect(canTransitionStatus('preparing', 'ready')).toBeTruthy();
    expect(canTransitionStatus('ready', 'completed')).toBeTruthy();
    expect(canTransitionStatus('completed', 'pending')).toBeFalsy();
    expect(canTransitionStatus('cancelled', 'preparing')).toBeFalsy();
  });

  test('Calcul du temps de préparation', () => {
    const items = [
      { preparationTime: 5, quantity: 2 },
      { preparationTime: 3, quantity: 1 },
      { preparationTime: 8, quantity: 1 }
    ];

    const totalTime = calculatePreparationTime(items);
    expect(totalTime).toBe(21); // 5*2 + 3*1 + 8*1
  });

  test('Validation du stock', () => {
    const order = {
      items: [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 }
      ]
    };

    const stockLevels = [
      { productId: 1, available: 10 },
      { productId: 2, available: 2 }
    ];

    expect(hasSufficientStock(order, stockLevels)).toBeFalsy(); // Produit 2 insuffisant
  });
});
```

## 🔒 TESTS DE SÉCURITÉ

### **1. Validation des Entrées**
```typescript
// tests/security/input-validation.test.ts
import { validateOrderInput, sanitizeUserInput } from '../../src/utils/security';

describe('Validation des entrées', () => {
  test('Validation des données de commande', () => {
    const validOrder = {
      customerName: 'Jean Dupont',
      items: [
        { productId: 1, quantity: 2 }
      ],
      paymentMethod: 'card'
    };

    const invalidOrder = {
      customerName: '', // Nom vide
      items: [], // Panier vide
      paymentMethod: 'invalid' // Méthode invalide
    };

    expect(() => validateOrderInput(validOrder)).not.toThrow();
    expect(() => validateOrderInput(invalidOrder)).toThrow();
  });

  test('Sanitisation des entrées utilisateur', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizeUserInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
  });
});
```

## 📊 TESTS D'INTÉGRATION

### **1. Tests API**
```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('API Endpoints', () => {
  test('GET /api/orders - Liste des commandes', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('POST /api/orders - Création de commande', async () => {
    const newOrder = {
      customerName: 'Test Client',
      items: [
        { productId: 1, quantity: 2 }
      ],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post('/api/orders')
      .send(newOrder)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.customerName).toBe('Test Client');
  });
});
```

## 🚀 EXÉCUTION DES TESTS

### **1. Scripts de Test**
Ajoutez ces scripts dans votre `package.json` :

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:business-logic": "jest --testPathPattern=financial|reservations|orders",
    "test:security": "jest --testPathPattern=security",
    "test:integration": "jest --testPathPattern=integration",
    "test:critical": "jest --testPathPattern=critical"
  }
}
```

### **2. Exécution**
```bash
# Tous les tests
npm test

# Tests de logique métier uniquement
npm run test:business-logic

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📈 MÉTRIQUES DE QUALITÉ

### **1. Couverture de Code**
- **Objectif minimum :** 80%
- **Critique :** 95% pour les calculs financiers
- **Mesure :** `npm run test:coverage`

### **2. Performance des Tests**
- **Temps d'exécution total :** < 30 secondes
- **Tests unitaires :** < 100ms chacun
- **Tests d'intégration :** < 2s chacun

### **3. Qualité des Tests**
- **Tests déterministes** : Pas de dépendances externes
- **Tests isolés** : Chaque test indépendant
- **Tests expressifs** : Noms clairs et descriptifs

## 🔄 INTÉGRATION CONTINUE

### **1. Configuration CI/CD**
```yaml
# .github/workflows/test.yml
name: Tests Automatisés

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Run business logic tests
      run: npm run test:business-logic
      
    - name: Check coverage
      run: npm run test:coverage
```

### **2. Seuils de Qualité**
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/financial.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

## 🎯 RECOMMANDATIONS FINALES

### **1. Priorités**
1. **Tests des calculs financiers** (CRITIQUE)
2. **Tests de validation des réservations** (CRITIQUE)
3. **Tests de workflow des commandes** (CRITIQUE)
4. **Tests de sécurité** (IMPORTANT)
5. **Tests d'intégration** (IMPORTANT)

### **2. Maintenance**
- **Exécuter les tests quotidiennement**
- **Analyser les rapports de couverture**
- **Mettre à jour les tests avec les nouvelles fonctionnalités**
- **Refactoriser les tests régulièrement**

### **3. Formation**
- **Former l'équipe aux bonnes pratiques de test**
- **Documenter les cas de test complexes**
- **Partager les connaissances sur la logique métier**

## 📞 SUPPORT

Pour toute question sur l'implémentation des tests :
- Consultez la documentation Jest
- Vérifiez les exemples dans le dossier `tests/`
- Contactez l'équipe de développement

**Rappel :** Les tests de logique métier sont critiques pour la fiabilité de votre application. Ne déployez jamais sans avoir validé les tests critiques. 