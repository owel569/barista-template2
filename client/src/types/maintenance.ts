export interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number;
  actualDuration?: number;
  cost?: number;
  assignedToId?: number | null;
  equipmentId?: number | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceTaskFormData {
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  estimatedDuration: number;
  cost?: number;
  assignedToId?: number | null;
  notes?: string;
  equipmentId?: number | null;
}

export type MaintenanceTaskCreateInput = Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>;
export type MaintenanceTaskUpdateInput = Partial<MaintenanceTaskCreateInput>;

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'read' | 'unread' | 'replied' | 'archived';
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  capacity: number;
  openingHours: Record<string, OpeningHours>;
  timezone: string;
  currency: string;
  specialDates: {
    closedDates: string[];
    specialHours: {
      date: string;
      openingHours: OpeningHours;
      note: string;
    }[];
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  purchaseDate: Date;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}