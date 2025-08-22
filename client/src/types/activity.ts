
export interface ActivityLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  category: ActivityCategory;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  affectedResource?: string;
  previousValue?: string;
  newValue?: string;
}

export type ActivityCategory = 
  | 'auth'
  | 'user_management' 
  | 'menu'
  | 'order'
  | 'reservation'
  | 'settings'
  | 'security'
  | 'system';

export interface ActivityFilter {
  category: ActivityCategory | 'all';
  severity: ActivityLog['severity'] | 'all';
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  searchTerm: string;
}

export interface CategoryConfig {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface SeverityConfig {
  label: string;
  color: string;
  icon: React.ComponentType<any>;
}
