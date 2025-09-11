import type { MaintenanceTask } from './maintenance';

// Interface Equipment pour les formulaires (sans les timestamps)
export interface EquipmentFormData {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'operational' | 'maintenance' | 'out_of_order' | 'broken' | 'retired';
  purchaseDate?: Date | string;
  warrantyExpiry?: Date | string;
  lastMaintenanceDate?: Date | string;
  nextMaintenanceDate?: Date | string;
  notes?: string;
}

export interface MaintenanceTaskFormData {
  id?: string;
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  equipmentId?: number | string | null;
  assignedToId?: number | string | null;
  assignedTo?: string;
  scheduledDate: string;
  completedDate?: string | null;
  notes?: string;
  estimatedDuration: number;
  cost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAlert {
  id: number;
  itemId: number;
  itemName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  message: string;
  type: 'low_stock' | 'expired' | 'quality_issue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentStock: number;
  minStock: number;
}

export interface Backup {
  id: number;
  name: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  size: number;
  tables: any[];
}

export type CustomerFilterStatus = "active" | "inactive" | "vip" | "all";
export type CustomerSortBy = "name" | "totalSpent" | "lastVisit" | "createdAt";