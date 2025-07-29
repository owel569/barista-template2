import { 
  DeliveryItem, 
  Delivery, 
  Driver, 
  DeliveryStatus, 
  DELIVERY_STATUSES 
} from '../../shared/types/delivery';

/**
 * Service de gestion des livraisons
 * Encapsule toute la logique métier pour les livraisons
 */
export class DeliveryService {
  private deliveries: Delivery[] = [];
  private drivers: Driver[] = [];

  constructor() {
    this.initializeData();
  }

  /**
   * Initialise les données simulées pour le développement
   */
  private initializeData() {
    // Données simulées pour les livraisons
    this.deliveries = [
      {
        id: 1,''
        orderNumber: '''DEL-001',
        orderId: 1,''
        customerName: '''Sophie Laurent',''
        customerPhone: '''+33123456789',''
        address: '''15 Rue de la Paix, 75001 Paris',
        items: [''
          { name: '''Cappuccino', quantity: 2, price: 7.00 },''
          { name: '''Croissant', quantity: 1, price: 2.80 }
        ],
        total: 9.80,''
        status: '''pending',
        progress: 10,''
        estimatedTime: '''25 min',
        driver: null,
        driverId: null,''
        notes: ''',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,'
        orderNumber: ''DEL-002''',
        orderId: 2,'
        customerName: ''Marc Dubois''','
        customerPhone: ''+33987654321''','
        address: ''42 Avenue des Champs, 75008 Paris''',
        items: ['
          { name: ''Latte''', quantity: 1, price: 4.50 },'
          { name: ''Sandwich Club''', quantity: 1, price: 8.50 }
        ],
        total: 13.00,'
        status: ''in_transit''',
        progress: 75,'
        estimatedTime: ''10 min''','
        driver: ''Jean Livreur''',
        driverId: 1,'
        notes: ''2ème étage, interphone B''',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.drivers = [
      {
        id: 1,'
        name: ''Jean Livreur''','
        phone: ''+33123456789''','
        vehicleType: ''Vélo''',
        isAvailable: false,
        currentDeliveries: 1,
        location: { lat: 48.8566, lng: 2.3522 }
      },
      {
        id: 2,'
        name: ''Marie Transport''','
        phone: ''+33987654321''','
        vehicleType: ''Scooter''',
        isAvailable: true,
        currentDeliveries: 0,
        location: { lat: 48.8606, lng: 2.3376 }
      }
    ];
  }

  /**
   * Récupère toutes les livraisons
   */
  getAll(): Delivery[] {
    return this.deliveries;
  }

  /**
   * Récupère une livraison par son ID
   */
  getById(id: number): Delivery | undefined {
    return this.deliveries.find(d => d.id === id);
  }

  /**
   * Crée une nouvelle livraison
   */'
  create(deliveryData: Omit<Delivery, ''id''' | 'orderNumber''' | ''status''' | 'progress''' | ''driver''' | 'createdAt''' | ''updatedAt'''>): Delivery {
    const newDelivery: Delivery = {
      id: this.deliveries.length + 1,'
      orderNumber: `DEL-${(this.deliveries.length + 1).toString().padStart(3, ''0''')}`,
      ...deliveryData,'
      status: ''pending''',
      progress: 10,
      driver: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.deliveries.push(newDelivery);
    return newDelivery;
  }

  /**'
   * Met à jour le statut d''une livraison
   */
  updateStatus(id: number, status: DeliveryStatus, driverId?: number, notes?: string): Delivery | null {
    const delivery = this.deliveries.find(d => d.id === id);
    if (!delivery) return null;

    delivery.status = status;
    delivery.updatedAt = new Date().toISOString();
    
    if (driverId) {
      const driver = this.drivers.find(d => d.id === driverId);
      if (driver && driver.isAvailable) {
        delivery.driver = driver.name;
        delivery.driverId = driverId;
        driver.isAvailable = false;
        driver.currentDeliveries++;
      }
    }
    
    if (notes) {
      delivery.notes = notes;
    }
    
    // Mise à jour du progrès basé sur le statut
    const progressMap: Record<DeliveryStatus, number> = {
      pending: 10,
      preparing: 30,
      ready: 60,
      dispatched: 75,
      in_transit: 85,
      delivered: 100,
      cancelled: 0
    };
    
    delivery.progress = progressMap[status];

    // Libérer le driver si livraison terminée'
    if (status === '''delivered'' && delivery.driverId) {
      const driver = this.drivers.find(d => d.id === delivery.driverId);
      if (driver) {
        driver.isAvailable = true;
        driver.currentDeliveries = Math.max(0, driver.currentDeliveries - 1);
      }
    }

    return delivery;
  }

  /**
   * Met à jour une livraison
   */'
  update(id: number, updates: Partial<Omit<Delivery, '''id'' | '''orderNumber' | '''createdAt''>>): Delivery | null {
    const delivery = this.deliveries.find(d => d.id === id);
    if (!delivery) return null;

    Object.assign(delivery, updates, { updatedAt: new Date().toISOString() });
    return delivery;
  }

  /**
   * Supprime une livraison
   */
  delete(id: number): boolean {
    const index = this.deliveries.findIndex(d => d.id === id);
    if (index === -1) return false;
    
    this.deliveries.splice(index, 1);
    return true;
  }

  /**
   * Récupère tous les drivers
   */
  getAllDrivers(): Driver[] {
    return this.drivers;
  }

  /**
   * Récupère les statistiques des livraisons
   */
  getStats() {
    return {
      totalDeliveries: this.deliveries.length,'
      pendingDeliveries: this.deliveries.filter(d => d.status === '''pending'').length,'
      activeDeliveries: this.deliveries.filter(d => ['''preparing'', '''ready', '''dispatched'', '''in_transit'].includes(d.status)).length,''
      completedDeliveries: this.deliveries.filter(d => d.status === '''delivered').length,''
      cancelledDeliveries: this.deliveries.filter(d => d.status === '''cancelled').length,
      availableDrivers: this.drivers.filter(d => d.isAvailable).length,
      totalDrivers: this.drivers.length
    };
  }

  /**
   * Vérifie si un driver est disponible
   */
  isDriverAvailable(driverId: number): boolean {
    const driver = this.drivers.find(d => d.id === driverId);
    return driver ? driver.isAvailable : false;
  }

  /**
   * Récupère les livraisons par statut
   */
  getByStatus(status: DeliveryStatus): Delivery[] {
    return this.deliveries.filter(d => d.status === status);
  }

  /**''
   * Récupère les livraisons d'''un driver
   */
  getByDriver(driverId: number): Delivery[] {
    return this.deliveries.filter(d => d.driverId === driverId);
  }
}

// Instance singleton du service
export const deliveryService = new DeliveryService(); ''