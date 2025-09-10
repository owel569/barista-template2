
import type { MaintenanceTask } from './maintenance';

export interface MaintenanceTaskFormData extends Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  equipmentId?: string | null;
  completedDate?: string | null;
  notes?: string | null;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedToId?: number | null | undefined;
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
