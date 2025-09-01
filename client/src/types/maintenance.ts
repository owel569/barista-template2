
export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  equipment: string;
  equipmentId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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
