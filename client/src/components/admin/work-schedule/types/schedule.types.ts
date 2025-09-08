// Types pour le module Work Schedule

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: Position;
  department: Department;
  salary: number;
  hireDate: string;
  isActive: boolean;
  avatar?: string;
  skills: string[];
  availability: WeeklyAvailability;
  preferences: EmployeePreferences;
}

export interface Shift {
  id: number;
  employeeId: number;
  employee?: Employee;
  date: string;
  startTime: string;
  endTime: string;
  position: Position;
  department: Department;
  status: ShiftStatus;
  notes?: string;
  break?: BreakTime;
  overtimeHours?: number;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  available: boolean;
  startTime?: string;
  endTime?: string;
  preferredShift?: 'morning' | 'afternoon' | 'evening';
}

export interface EmployeePreferences {
  maxHoursPerWeek: number;
  preferredDepartments: string[];
  unavailableDates: string[];
  specialRequests: string[];
}

export interface BreakTime {
  startTime: string;
  endTime: string;
  duration: number; // en minutes
  paid: boolean;
}

export interface RecurringPattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
  daysOfWeek: number[]; // 0 = dimanche, 1 = lundi, etc.
}

export interface ScheduleStats {
  totalEmployees: number;
  activeEmployees: number;
  totalShifts: number;
  scheduledHours: number;
  overtimeHours: number;
  totalPayroll: number;
  averageHoursPerEmployee: number;
  departmentStats: DepartmentStats[];
  costAnalysis: CostAnalysis;
}

export interface DepartmentStats {
  department: string;
  employeeCount: number;
  scheduledHours: number;
  averageHourlyRate: number;
  totalCost: number;
}

export interface CostAnalysis {
  regularHours: number;
  overtimeHours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
  projectedMonthlyCost: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  employeeId?: number;
  employee?: Employee;
  position: Position;
  department: Department;
  status: ShiftStatus;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  employeeId: number;
  employee?: Employee;
  position: Position;
  department: Department;
  status: ShiftStatus;
  notes?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface ShiftConflict {
  type: 'overlap' | 'overtime' | 'availability' | 'break';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedShifts: number[];
  suggestions: string[];
}

export interface ScheduleTemplate {
  id: number;
  name: string;
  description: string;
  department: string;
  shifts: Omit<Shift, 'id' | 'employeeId' | 'date'>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRequest {
  id: number;
  employeeId: number;
  employee?: Employee;
  requestType: 'swap' | 'cover' | 'time_off' | 'overtime';
  originalShiftId?: number;
  requestedDate: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  notes?: string;
}

export interface ScheduleFilter {
  departments: string[];
  positions: string[];
  employees: number[];
  dateRange: {
    start: string;
    end: string;
  };
  status: ShiftStatus[];
  showConflicts: boolean;
  showOvertime: boolean;
}

export interface ScheduleViewMode {
  type: 'calendar' | 'list' | 'employee' | 'analytics';
  period: 'day' | 'week' | 'month';
  groupBy?: 'department' | 'position' | 'employee';
}

export interface BulkScheduleAction {
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  shiftIds: number[];
  data?: Partial<Shift>;
  reason?: string;
}

export interface ScheduleNotification {
  id: number;
  type: 'shift_reminder' | 'schedule_change' | 'overtime_alert' | 'conflict_detected';
  employeeId: number;
  shiftId?: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string;
}

export interface ScheduleRule {
  id: number;
  name: string;
  description: string;
  ruleType: 'min_hours' | 'max_hours' | 'min_break' | 'max_consecutive' | 'availability';
  value: number;
  unit: 'hours' | 'minutes' | 'days';
  department?: string;
  position?: string;
  isActive: boolean;
  priority: number;
}

export interface ScheduleReport {
  period: {
    start: string;
    end: string;
  };
  totalHours: number;
  totalCost: number;
  employeeBreakdown: EmployeeScheduleReport[];
  departmentBreakdown: DepartmentScheduleReport[];
  violations: RuleViolation[];
  recommendations: string[];
}

export interface EmployeeScheduleReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalPay: number;
  shiftsWorked: number;
  averageShiftLength: number;
  punctualityScore: number;
}

export interface DepartmentScheduleReport {
  department: string;
  totalHours: number;
  totalCost: number;
  employeeCount: number;
  averageHoursPerEmployee: number;
  costPerHour: number;
  efficiencyScore: number;
}

export interface RuleViolation {
  ruleId: number;
  ruleName: string;
  employeeId: number;
  employeeName: string;
  shiftId: number;
  violation: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

// String literal unions pour la sécurité des types
export type ShiftStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type ViewMode = 'calendar' | 'list' | 'employee' | 'analytics' | 'stats';

export type TimePeriod = 'day' | 'week' | 'month';

export type Department = 'service' | 'cuisine' | 'management' | 'maintenance' | 'all';

export type Position = 'serveur' | 'barista' | 'chef' | 'manager' | 'caissier' | 'nettoyage' | 'all';

export type InventoryStatus = 'ok' | 'low' | 'critical' | 'out';

export type UserRole = 'directeur' | 'manager' | 'employee' | 'admin';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ConflictSeverity = 'low' | 'medium' | 'high';

// Utilitaires pour la validation
export interface ScheduleValidation {
  isValid: boolean;
  conflicts: ShiftConflict[];
  warnings: string[];
  suggestions: string[];
}

// Props pour les composants
export interface WorkScheduleProps {
  userRole: 'directeur' | 'employe';
  selectedDate?: string;
  selectedEmployee?: number;
  viewMode?: ViewMode;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}

export interface CalendarViewProps {
  shifts: Shift[];
  employees: Employee[];
  onShiftClick: (shift: Shift) => void;
  onDateClick: (date: string) => void;
  onShiftCreate: (shift: Omit<Shift, 'id'>) => void;
  selectedDate?: string;
  viewMode: TimePeriod;
}

export interface ShiftListViewProps {
  shifts: Shift[];
  employees: Employee[];
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: number) => void;
  selectedFilters: ScheduleFilter;
  sorting: {
    field: keyof Shift;
    direction: 'asc' | 'desc';
  };
}

export interface EmployeeOverviewProps {
  employees: Employee[];
  shifts: Shift[];
  onEmployeeClick: (employee: Employee) => void;
  selectedPeriod: TimePeriod;
}

export interface AnalyticsViewProps {
  stats: ScheduleStats;
  reports: ScheduleReport[];
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  onExportData: () => void;
}

// Configuration et constantes
export const DEPARTMENTS = [
  { id: 'service', name: 'Service', color: '#3B82F6' },
  { id: 'cuisine', name: 'Cuisine', color: '#EF4444' },
  { id: 'management', name: 'Management', color: '#8B5CF6' },
  { id: 'maintenance', name: 'Maintenance', color: '#F59E0B' },
] as const;

export const POSITIONS = [
  { id: 'serveur', name: 'Serveur', department: 'service' },
  { id: 'barista', name: 'Barista', department: 'service' },
  { id: 'chef', name: 'Chef', department: 'cuisine' },
  { id: 'manager', name: 'Manager', department: 'management' },
  { id: 'caissier', name: 'Caissier', department: 'service' },
  { id: 'nettoyage', name: 'Nettoyage', department: 'maintenance' },
] as const;

export const SHIFT_STATUS_COLORS = {
  scheduled: '#6B7280',
  confirmed: '#10B981',
  in_progress: '#F59E0B',
  completed: '#059669',
  cancelled: '#EF4444',
  no_show: '#DC2626',
} as const;

export const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30',
] as const;

export const DEFAULT_WORK_HOURS = {
  start: '08:00',
  end: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
} as const;

export const OVERTIME_THRESHOLD = 40; // heures par semaine
export const BREAK_DURATION = 30; // minutes
export const MAX_SHIFT_HOURS = 12; // heures
export const MIN_BREAK_BETWEEN_SHIFTS = 11; // heures