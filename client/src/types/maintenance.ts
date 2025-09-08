export interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  location: string;
  maintenanceSchedule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
}

export interface EquipmentFormData {
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  location: string;
  maintenanceSchedule?: string;
}

export interface MaintenanceStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent: number;
  averageCompletionTime: number;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type EquipmentStatus = 'operational' | 'maintenance' | 'broken' | 'retired';