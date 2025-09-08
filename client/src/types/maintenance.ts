export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  assignedToId?: number | null;
  scheduledDate: string;
  dueDate?: string;
  estimatedDuration: number;
  cost?: number;
  notes?: string;
  equipmentId?: number | null;
  createdAt: string;
  updatedAt: string;
  securityLevel?: 'public' | 'restricted' | 'confidential';
  auditTrail?: Array<{
    timestamp: string;
    userId: string;
    action: string;
    details?: Record<string, unknown>;
  }>;
}

export interface SecureMaintenanceFilter {
  userRole: string;
  accessLevel: number;
  allowedStatuses: MaintenanceTask['status'][];
  maxPriorityLevel: MaintenanceTask['priority'];
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