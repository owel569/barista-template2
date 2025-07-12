import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les horaires
export interface Shift {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  department: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleStats {
  totalShifts: number;
  activeEmployees: number;
  totalHours: number;
  averageHoursPerEmployee: number;
  departmentBreakdown: Record<string, number>;
  positionBreakdown: Record<string, number>;
}

// Constantes pour les couleurs des statuts
export const SHIFT_STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Couleurs pour les départements
export const DEPARTMENT_COLORS = {
  service: 'bg-blue-500',
  kitchen: 'bg-green-500',
  management: 'bg-purple-500',
  cleaning: 'bg-orange-500',
  security: 'bg-red-500',
} as const;

// Couleurs pour les positions
export const POSITION_COLORS = {
  barista: 'bg-amber-500',
  server: 'bg-blue-500',
  chef: 'bg-green-500',
  manager: 'bg-purple-500',
  cashier: 'bg-teal-500',
  cleaner: 'bg-orange-500',
} as const;

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
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 }); // Dimanche
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
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalHours = calculateTotalHours(shifts);
  const averageHoursPerEmployee = activeEmployees > 0 ? totalHours / activeEmployees : 0;

  // Répartition par département
  const departmentBreakdown: Record<string, number> = {};
  employees.forEach(emp => {
    const empShifts = filterShiftsByEmployee(shifts, emp.id);
    const hours = calculateTotalHours(empShifts);
    if (hours > 0) {
      departmentBreakdown[emp.department] = (departmentBreakdown[emp.department] || 0) + hours;
    }
  });

  // Répartition par position
  const positionBreakdown: Record<string, number> = {};
  employees.forEach(emp => {
    const empShifts = filterShiftsByEmployee(shifts, emp.id);
    const hours = calculateTotalHours(empShifts);
    if (hours > 0) {
      positionBreakdown[emp.position] = (positionBreakdown[emp.position] || 0) + hours;
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

// Génération automatique d'horaires
export const generateWeeklySchedule = (
  employees: Employee[],
  weekStart: Date,
  businessHours: { start: string; end: string } = { start: '08:00', end: '20:00' }
): Partial<Shift>[] => {
  const schedule: Partial<Shift>[] = [];
  const weekDays = generateWeekDates(weekStart);
  
  const activeEmployees = employees.filter(emp => emp.status === 'active');
  const shiftDuration = 8; // 8 heures par shift
  
  weekDays.forEach(day => {
    const dayOfWeek = day.getDay();
    
    // Pas de shifts le dimanche (jour de repos)
    if (dayOfWeek === 0) return;
    
    const isWeekend = dayOfWeek === 6; // Samedi
    const shiftsPerDay = isWeekend ? 2 : 3; // Moins de shifts le weekend
    
    // Créer les shifts pour la journée
    for (let i = 0; i < shiftsPerDay && i < activeEmployees.length; i++) {
      const employee = activeEmployees[i];
      const startHour = 8 + (i * 4); // Décalage de 4 heures entre les shifts
      const endHour = startHour + shiftDuration;
      
      if (endHour <= 20) { // Pas de shift après 20h
        schedule.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date: format(day, 'yyyy-MM-dd'),
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          position: employee.position,
          department: employee.department,
          status: 'scheduled',
          notes: 'Généré automatiquement',
        });
      }
    }
  });
  
  return schedule;
};

// Analyse des performances
export const analyzeEmployeePerformance = (shifts: Shift[], employees: Employee[]) => {
  return employees.map(employee => {
    const employeeShifts = filterShiftsByEmployee(shifts, employee.id);
    const totalHours = calculateTotalHours(employeeShifts);
    const completedShifts = employeeShifts.filter(shift => shift.status === 'completed').length;
    const cancelledShifts = employeeShifts.filter(shift => shift.status === 'cancelled').length;
    const completionRate = employeeShifts.length > 0 ? (completedShifts / employeeShifts.length) * 100 : 0;
    
    return {
      employee,
      totalShifts: employeeShifts.length,
      totalHours,
      completedShifts,
      cancelledShifts,
      completionRate,
      averageHoursPerShift: employeeShifts.length > 0 ? totalHours / employeeShifts.length : 0,
    };
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
  };
  return labels[status] || status;
};

export const getDepartmentLabel = (department: string): string => {
  const labels = {
    service: 'Service',
    kitchen: 'Cuisine',
    management: 'Direction',
    cleaning: 'Nettoyage',
    security: 'Sécurité',
  };
  return labels[department] || department;
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
  return labels[position] || position;
};

// Exportation des données
export const exportScheduleToCSV = (shifts: Shift[], employees: Employee[]): string => {
  const headers = [
    'Date',
    'Employé',
    'Position',
    'Département',
    'Début',
    'Fin',
    'Durée (h)',
    'Statut',
    'Notes'
  ];
  
  const rows = shifts.map(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const duration = calculateShiftDuration(shift.startTime, shift.endTime);
    
    return [
      formatDate(shift.date),
      employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu',
      shift.position,
      shift.department,
      formatTime(shift.startTime),
      formatTime(shift.endTime),
      duration.toFixed(1),
      getStatusLabel(shift.status),
      shift.notes || ''
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
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

// Constantes manquantes pour les composants
export const DEPARTMENTS = [
  { value: 'service', label: 'Service' },
  { value: 'kitchen', label: 'Cuisine' },
  { value: 'management', label: 'Direction' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'security', label: 'Sécurité' },
];

export const POSITIONS = [
  { value: 'barista', label: 'Barista' },
  { value: 'server', label: 'Serveur' },
  { value: 'chef', label: 'Chef' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Caissier' },
  { value: 'cleaner', label: 'Agent d\'entretien' },
];

// Fonctions manquantes pour les hooks
export const generateScheduleStats = calculateScheduleStats;

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

export const filterShifts = (shifts: Shift[], filters: {
  employeeId?: number;
  department?: string;
  position?: string;
  status?: string;
  dateRange?: { start: Date; end: Date };
}): Shift[] => {
  return shifts.filter(shift => {
    if (filters.employeeId && shift.employeeId !== filters.employeeId) return false;
    if (filters.department && shift.department !== filters.department) return false;
    if (filters.position && shift.position !== filters.position) return false;
    if (filters.status && shift.status !== filters.status) return false;
    
    if (filters.dateRange) {
      const shiftDate = parseISO(shift.date);
      if (shiftDate < filters.dateRange.start || shiftDate > filters.dateRange.end) return false;
    }
    
    return true;
  });
};

export const sortShifts = (shifts: Shift[], sortBy: 'date' | 'employee' | 'department' | 'position' = 'date'): Shift[] => {
  return [...shifts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      case 'employee':
        return a.employeeName.localeCompare(b.employeeName);
      case 'department':
        return a.department.localeCompare(b.department);
      case 'position':
        return a.position.localeCompare(b.position);
      default:
        return 0;
    }
  });
};

export const shiftsToCalendarEvents = (shifts: Shift[], employees: Employee[] = []) => {
  return shifts.map(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const start = new Date(`${shift.date}T${shift.startTime}`);
    const end = new Date(`${shift.date}T${shift.endTime}`);
    
    return {
      id: shift.id.toString(),
      title: `${shift.employeeName || employee?.firstName + ' ' + employee?.lastName || 'Employé'} - ${shift.position}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: getShiftColor(shift),
      borderColor: getShiftColor(shift),
      extendedProps: {
        shift,
        employee,
        department: shift.department,
        position: shift.position,
        status: shift.status,
        notes: shift.notes,
      },
    };
  });
};

export const getWeekDates = generateWeekDates;
export const getMonthDates = generateMonthDates;

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