
export interface TablePosition {
  x: number;
  y: number;
}

export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: 'main_floor' | 'terrace' | 'private_room' | 'bar';
  shape: 'round' | 'square' | 'rectangle';
  position: TablePosition;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableCreationData {
  number: number;
  capacity: number;
  location: RestaurantTable['location'];
  shape: RestaurantTable['shape'];
  position: TablePosition;
  notes?: string;
}
