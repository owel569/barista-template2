# API de Livraison - Documentation

## Vue d'ensemble

L'API de livraison permet de gérer les livraisons de commandes, les drivers et les statistiques associées.

## Structure des données

### Delivery (Livraison)
```typescript
interface Delivery {
  id: number;
  orderNumber: string;        // Format: DEL-001, DEL-002, etc.
  orderId: number;           // ID de la commande associée
  customerName: string;      // Nom du client
  customerPhone: string;     // Téléphone du client
  address: string;           // Adresse de livraison
  items: DeliveryItem[];     // Articles commandés
  total: number;             // Montant total
  status: DeliveryStatus;    // Statut de la livraison
  progress: number;          // Progression (0-100)
  estimatedTime: string;     // Temps estimé (ex: "25 min")
  driver: string | null;     // Nom du driver assigné
  driverId: number | null;   // ID du driver
  notes: string;             // Notes spéciales
  createdAt: string;         // Date de création
  updatedAt: string;         // Date de mise à jour
}
```

### Driver (Livreur)
```typescript
interface Driver {
  id: number;
  name: string;              // Nom du driver
  phone: string;             // Téléphone
  vehicleType: string;       // Type de véhicule
  isAvailable: boolean;      // Disponibilité
  currentDeliveries: number; // Nombre de livraisons en cours
  location: {                // Position GPS
    lat: number;
    lng: number;
  };
}
```

### Statuts de livraison
- `pending` : En attente
- `preparing` : En préparation
- `ready` : Prêt pour livraison
- `dispatched` : Expédié
- `in_transit` : En transit
- `delivered` : Livré
- `cancelled` : Annulé

## Endpoints

### 1. Récupérer toutes les livraisons
```http
GET /deliveries
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "DEL-001",
      "status": "pending",
      "progress": 10,
      // ... autres champs
    }
  ],
  "metadata": {
    "count": 2
  }
}
```

### 2. Récupérer une livraison par ID
```http
GET /deliveries/:id
```

**Paramètres :**
- `id` (number) : ID de la livraison

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "DEL-001",
    // ... tous les champs
  }
}
```

### 3. Créer une nouvelle livraison
```http
POST /deliveries
```

**Body :**
```json
{
  "orderId": 1,
  "customerName": "Jean Dupont",
  "customerPhone": "+33123456789",
  "address": "15 Rue de la Paix, 75001 Paris",
  "items": [
    {
      "name": "Cappuccino",
      "quantity": 2,
      "price": 7.00
    }
  ],
  "total": 14.00,
  "estimatedTime": "25 min",
  "notes": "2ème étage"
}
```

### 4. Mettre à jour le statut d'une livraison
```http
PATCH /deliveries/:id/status
```

**Paramètres :**
- `id` (number) : ID de la livraison

**Body :**
```json
{
  "status": "in_transit",
  "driverId": 1,
  "notes": "Livraison en cours"
}
```

### 5. Récupérer tous les drivers
```http
GET /deliveries/drivers
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jean Livreur",
      "isAvailable": true,
      "currentDeliveries": 0
    }
  ],
  "metadata": {
    "count": 2
  }
}
```

### 6. Récupérer les statistiques
```http
GET /deliveries/stats
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalDeliveries": 15,
    "pendingDeliveries": 3,
    "activeDeliveries": 8,
    "completedDeliveries": 4,
    "cancelledDeliveries": 0,
    "availableDrivers": 2,
    "totalDrivers": 3
  }
}
```

## Gestion des erreurs

Toutes les réponses d'erreur suivent ce format :
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

**Codes d'erreur courants :**
- `400` : Données invalides ou driver non disponible
- `404` : Livraison non trouvée
- `500` : Erreur serveur

## Logique métier

### Assignation automatique des drivers
- Un driver ne peut être assigné que s'il est disponible
- Quand une livraison est marquée comme "delivered", le driver redevient disponible
- Le compteur `currentDeliveries` est mis à jour automatiquement

### Progression automatique
La progression est mise à jour automatiquement selon le statut :
- `pending` : 10%
- `preparing` : 30%
- `ready` : 60%
- `dispatched` : 75%
- `in_transit` : 85%
- `delivered` : 100%
- `cancelled` : 0%

## Validation

Toutes les données sont validées avec Zod :
- Numéros de téléphone : minimum 8 caractères
- Adresses : minimum 5 caractères
- Prix : nombres positifs
- Quantités : nombres positifs

## Exemples d'utilisation

### Workflow complet d'une livraison

1. **Créer une livraison**
```bash
curl -X POST /deliveries \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "customerName": "Marie", ...}'
```

2. **Assigner un driver**
```bash
curl -X PATCH /deliveries/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "dispatched", "driverId": 1}'
```

3. **Marquer comme livré**
```bash
curl -X PATCH /deliveries/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}'
```

## Évolutions futures

- Intégration avec une base de données PostgreSQL
- Authentification et autorisation
- Notifications en temps réel
- Géolocalisation en temps réel
- Optimisation des routes de livraison 