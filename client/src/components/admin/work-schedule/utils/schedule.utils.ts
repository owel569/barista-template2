import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Shift, Employee } from "../types/schedule.types";

// Types importés depuis ../types/schedule.types pour éviter les duplications

export interface ScheduleStats {
  totalShifts: number;
  activeEmployees: number;
  totalHours: number;
  averageHoursPerEmployee: number;
  departmentBreakdown: Record<string, number>;
  positionBreakdown: Record<string, number>;
}

// Constantes pour les couleurs des statuts
export const SHIFT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-red-100 text-red-800 border-red-200',
};

// Couleurs pour les départements
export const DEPARTMENT_COLORS: Record<string, string> = {
  service: 'bg-blue-500',
  kitchen: 'bg-green-500',
  management: 'bg-purple-500',
  cleaning: 'bg-orange-500',
  security: 'bg-red-500',
};

// Couleurs pour les positions
export const POSITION_COLORS: Record<string, string> = {
  barista: 'bg-amber-500',
  server: 'bg-blue-500',
  chef: 'bg-green-500',
  manager: 'bg-purple-500',
  cashier: 'bg-teal-500',
  cleaner: 'bg-orange-500',
};

// Modes d'affichage
export type ViewMode = 'calendar' | 'list' | 'timeline';
export type TimePeriod = 'day' | 'week' | 'month';

// Utilitaires pour les dates
export const formatDate = (date: string | Date, formatString: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: fr });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

export const formatDateTime = (date: string, time: string): string => {
  return `${formatDate(date)} à ${formatTime(time)}`;
};

// Génération des dates pour le calendrier
export const generateWeekDates = (startDate: Date = new Date()): Date[] => {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

export const generateMonthDates = (startDate: Date = new Date()): Date[] => {
  const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  return eachDayOfInterval({ start: monthStart, end: monthEnd });
};

// Filtrage des horaires
export const filterShiftsByDate = (shifts: Shift[], targetDate: Date): Shift[] => {
  return shifts.filter(shift => isSameDay(parseISO(shift.date), targetDate));
};

export const filterShiftsByEmployee = (shifts: Shift[], employeeId: number): Shift[] => {
  return shifts.filter(shift => shift.employeeId === employeeId);
};

export const filterShiftsByDepartment = (shifts: Shift[], employees: Employee[], department: string): Shift[] => {
  const departmentEmployeeIds = employees
    .filter(emp => emp.department === department)
    .map(emp => emp.id);
  return shifts.filter(shift => departmentEmployeeIds.includes(shift.employeeId));
};

export const filterShiftsByPosition = (shifts: Shift[], employees: Employee[], position: string): Shift[] => {
  const positionEmployeeIds = employees
    .filter(emp => emp.position === position)
    .map(emp => emp.id);
  return shifts.filter(shift => positionEmployeeIds.includes(shift.employeeId));
};

// Calcul des statistiques
export const calculateShiftDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const diff = end.getTime() - start.getTime();
  return diff / (1000 * 60 * 60); // Retourne en heures
};

export const calculateTotalHours = (shifts: Shift[]): number => {
  return shifts.reduce((total, shift) => {
    return total + calculateShiftDuration(shift.startTime, shift.endTime);
  }, 0);
};

export const calculateEmployeeHours = (shifts: Shift[], employeeId: number): number => {
  const employeeShifts = filterShiftsByEmployee(shifts, employeeId);
  return calculateTotalHours(employeeShifts);
};

export const calculateScheduleStats = (shifts: Shift[], employees: Employee[]): ScheduleStats => {
  const totalShifts = shifts.length;
  const activeEmployees = employees.filter(emp => (emp as any).status === 'active').length;
  const totalHours = calculateTotalHours(shifts);
  const averageHoursPerEmployee = activeEmployees > 0 ? totalHours / activeEmployees : 0;

  // Répartition par département
  const departmentBreakdown: Record<string, number> = {};
  employees.forEach(emp => {
    const empShifts = filterShiftsByEmployee(shifts, emp.id);
    const hours = calculateTotalHours(empShifts);
    if (hours > 0) {
      departmentBreakdown[String(emp.department)] = (departmentBreakdown[String(emp.department)] || 0) + hours;
    }
  });

  // Répartition par position
  const positionBreakdown: Record<string, number> = {};
  employees.forEach(emp => {
    const empShifts = filterShiftsByEmployee(shifts, emp.id);
    const hours = calculateTotalHours(empShifts);
    if (hours > 0) {
      positionBreakdown[String(emp.position)] = (positionBreakdown[String(emp.position)] || 0) + hours;
    }
  });

  return {
    totalShifts,
    activeEmployees,
    totalHours,
    averageHoursPerEmployee,
    departmentBreakdown,
    positionBreakdown,
  };
};

// Validation des horaires
export const validateShiftTime = (startTime: string, endTime: string): boolean => {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return start < end;
};

export const validateShiftDate = (date: string): boolean => {
  const shiftDate = parseISO(date);
  const today = new Date();
  return shiftDate >= today;
};

export const checkShiftConflict = (newShift: Partial<Shift>, existingShifts: Shift[]): boolean => {
  if (!newShift.employeeId || !newShift.date || !newShift.startTime || !newShift.endTime) {
    return false;
  }

  const employeeShifts = filterShiftsByEmployee(existingShifts, newShift.employeeId);
  const sameDayShifts = employeeShifts.filter(shift =>
    isSameDay(parseISO(shift.date), parseISO(newShift.date))
  );

  return sameDayShifts.some(shift => {
    const existingStart = new Date(`1970-01-01T${shift.startTime}`);
    const existingEnd = new Date(`1970-01-01T${shift.endTime}`);
    const newStart = new Date(`1970-01-01T${newShift.startTime}`);
    const newEnd = new Date(`1970-01-01T${newShift.endTime}`);

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};

// Utilitaires pour l'affichage
export const getStatusLabel = (status: Shift['status']): string => {
  const labels = {
    scheduled: 'Planifié',
    confirmed: 'Confirmé',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    no_show: 'Absent',
  };
  return (labels as Record<string, string>)[status] || (status as unknown as string);
};

export const getDepartmentLabel = (department: string): string => {
  const labels = {
    service: 'Service',
    kitchen: 'Cuisine',
    management: 'Direction',
    cleaning: 'Nettoyage',
    security: 'Sécurité',
  };
  return (labels as Record<string, string>)[department] || department;
};

export const getPositionLabel = (position: string): string => {
  const labels = {
    barista: 'Barista',
    server: 'Serveur',
    chef: 'Chef',
    manager: 'Manager',
    cashier: 'Caissier',
    cleaner: 'Agent d\'entretien',
  };
  return (labels as Record<string, string>)[position] || position;
};

// Constantes manquantes pour les composants
export const DEPARTMENTS = [
  { id: 'service', name: 'Service', color: '#3B82F6' },
  { id: 'kitchen', name: 'Cuisine', color: '#10B981' },
  { id: 'management', name: 'Direction', color: '#8B5CF6' },
  { id: 'cleaning', name: 'Nettoyage', color: '#F59E0B' },
  { id: 'security', name: 'Sécurité', color: '#EF4444' },
];

export const POSITIONS = [
  { id: 'barista', name: 'Barista', color: '#F59E0B' },
  { id: 'server', name: 'Serveur', color: '#3B82F6' },
  { id: 'chef', name: 'Chef', color: '#10B981' },
  { id: 'manager', name: 'Manager', color: '#8B5CF6' },
  { id: 'cashier', name: 'Caissier', color: '#14B8A6' },
  { id: 'cleaner', name: 'Agent d\'entretien', color: '#F97316' },
];

// Fonctions de formatage manquantes
export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Utilitaires pour la couleur
export const getShiftColor = (shift: Shift): string => {
  return SHIFT_STATUS_COLORS[shift.status] || SHIFT_STATUS_COLORS.scheduled;
};

export const getDepartmentColor = (department: string): string => {
  return DEPARTMENT_COLORS[department as keyof typeof DEPARTMENT_COLORS] || 'bg-gray-500';
};

export const getPositionColor = (position: string): string => {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || 'bg-gray-500';
};

// Utilitaires pour le temps
export const isShiftToday = (shift: Shift): boolean => {
  return isToday(parseISO(shift.date));
};

export const isShiftPast = (shift: Shift): boolean => {
  const shiftDateTime = new Date(`${shift.date}T${shift.endTime}`);
  return isPast(shiftDateTime);
};

export const isShiftFuture = (shift: Shift): boolean => {
  const shiftDateTime = new Date(`${shift.date}T${shift.startTime}`);
  return isFuture(shiftDateTime);
};

export const getShiftTimeStatus = (shift: Shift): 'past' | 'current' | 'future' => {
  const now = new Date();
  const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
  const shiftEnd = new Date(`${shift.date}T${shift.endTime}`);

  if (now > shiftEnd) return 'past';
  if (now >= shiftStart && now <= shiftEnd) return 'current';
  return 'future';
};

// Fonctions pour les composants
export const getWeekDates = (dateISO: string): string[] => {
  const dates = generateWeekDates(parseISO(dateISO));
  return dates.map(d => d.toISOString().split('T')[0]!);
};
export const getMonthDates = (dateISO: string): string[] => {
  const dates = generateMonthDates(parseISO(dateISO));
  return dates.map(d => d.toISOString().split('T')[0]!);
};

export const generateEmployeeColors = (employees: Employee[]): Record<number, string> => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#82d982', '#ffb347', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'
  ];

  const employeeColors: Record<number, string> = {};
  employees.forEach((employee, index) => {
    employeeColors[employee.id] = colors[index % colors.length];
  });

  return employeeColors;
};

// Fonctions de validation
export const validateShift = (shift: Partial<Shift>, existingShifts: Shift[] = []): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!shift.employeeId) errors.push('Employé requis');
  if (!shift.date) errors.push('Date requise');
  if (!shift.startTime) errors.push('Heure de début requise');
  if (!shift.endTime) errors.push('Heure de fin requise');
  if (!shift.position) errors.push('Position requise');
  if (!shift.department) errors.push('Département requis');

  if (shift.startTime && shift.endTime && !validateShiftTime(shift.startTime, shift.endTime)) {
    errors.push('L\'heure de fin doit être après l\'heure de début');
  }

  if (shift.date && !validateShiftDate(shift.date)) {
    errors.push('La date doit être dans le futur');
  }

  if (shift.employeeId && shift.date && shift.startTime && shift.endTime) {
    if (checkShiftConflict(shift, existingShifts)) {
      errors.push('Conflit d\'horaire détecté pour cet employé');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Fonctions de filtrage et tri
export const filterShifts = (shifts: Shift[], filters: {
  employeeId?: number;
  department?: string;
  position?: string;
  status?: string;
  dateRange?: { start: string; end: string };
}): Shift[] => {
  return shifts.filter(shift => {
    if (filters.employeeId && shift.employeeId !== filters.employeeId) return false;
    if (filters.department && shift.department !== filters.department) return false;
    if (filters.position && shift.position !== filters.position) return false;
    if (filters.status && shift.status !== filters.status) return false;

    if (filters.dateRange) {
      const shiftDate = parseISO(shift.date);
      const rangeStart = parseISO(filters.dateRange.start);
      const rangeEnd = parseISO(filters.dateRange.end);
      if (shiftDate < rangeStart || shiftDate > rangeEnd) return false;
    }

    return true;
  });
};

export const sortShifts = (
  shifts: Shift[],
  field: keyof Shift = 'date',
  direction: 'asc' | 'desc' = 'asc'
): Shift[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...shifts].sort((a, b) => {
    if (field === 'date') {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return (dateA.getTime() - dateB.getTime()) * factor;
    }
    const va = (a as any)[field];
    const vb = (b as any)[field];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
    return String(va ?? '').localeCompare(String(vb ?? '')) * factor;
  });
};

// Fonction pour convertir les shifts en événements de calendrier
export const shiftsToCalendarEvents = (shifts: Shift[], employees: Employee[] = []) => {
  return shifts.map(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const start = new Date(`${shift.date}T${shift.startTime}`);
    const end = new Date(`${shift.date}T${shift.endTime}`);
    const fullName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employé';
    return {
      id: shift.id.toString(),
      title: `${fullName} - ${String(shift.position)}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: getShiftColor(shift),
      borderColor: getShiftColor(shift),
      extendedProps: {
        shift,
        employee,
        department: String(shift.department),
        position: String(shift.position),
        status: shift.status,
        notes: shift.notes,
      },
    };
  });
};

export function validateSchedule(scheduleData: unknown): boolean {
  if (!scheduleData || typeof scheduleData !== 'object') {
    return false;
  }

  const schedule = scheduleData as Record<string, unknown>;

  // Validation des propriétés requises
  if (typeof schedule.startTime !== 'string' ||
      typeof schedule.endTime !== 'string' ||
      typeof schedule.employeeId !== 'string') {
    return false;
  }

  // Validation du format de temps
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const startTime = schedule.startTime as string;
  const endTime = schedule.endTime as string;

  return timeRegex.test(startTime) && timeRegex.test(endTime);
}