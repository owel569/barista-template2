import React, { useState, useCallback, useMemo } from "react";
import { 
  Shift, 
  Employee, 
  ScheduleFilter, 
  ShiftConflict,
  ScheduleValidation,
  ViewMode,
  TimePeriod
} from "../types/schedule.types";
import { 
  validateShift, 
  filterShifts, 
  sortShifts, 
  shiftsToCalendarEvents,
  getWeekDates,
  getMonthDates,
  generateEmployeeColors
} from "../utils/schedule.utils";

interface useShiftManagementProps {
  shifts: Shift[];
  employees: Employee[];
  initialFilters?: Partial<ScheduleFilter>;
}

/**
 * Hook pour la gestion avancée des shifts
 */
export const useShiftManagement = (props: useShiftManagementProps) => {
  const { shifts, employees, initialFilters } = props;
  
  // États locaux
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState(false);

  // Filtres
  const defaultStart = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [filters, setFilters] = useState<ScheduleFilter>({
    departments: initialFilters?.departments ?? [],
    positions: initialFilters?.positions ?? [],
    employees: initialFilters?.employees ?? [],
    dateRange: {
      start: initialFilters?.dateRange?.start ?? defaultStart ?? '',
      end: initialFilters?.dateRange?.end ?? defaultEnd ?? ''
    },
    status: initialFilters?.status ?? [],
    showConflicts: initialFilters?.showConflicts ?? false,
    showOvertime: initialFilters?.showOvertime ?? false,
  });

  // Tri
  const [sorting, setSorting] = useState<{
    field: keyof Shift;
    direction: "asc" | "desc";
  }>({
    field: "date",
    direction: "asc"
  });

  // Shifts filtrés et triés
  const filteredShifts = useMemo(() => {
    // d'abord filtrage par date via util (string range)
    let filtered = filterShifts(shifts, {
      dateRange: filters.dateRange,
    });

    // compléter avec les autres filtres localement
    if (filters.departments.length > 0) {
      filtered = filtered.filter(s => filters.departments.includes(s.department as unknown as string));
    }
    if (filters.positions.length > 0) {
      filtered = filtered.filter(s => filters.positions.includes(s.position as unknown as string));
    }
    if (filters.employees.length > 0) {
      filtered = filtered.filter(s => filters.employees.includes(s.employeeId));
    }
    if (filters.status.length > 0) {
      filtered = filtered.filter(s => filters.status.includes(s.status));
    }

    // Filtrage par conflits
    if (filters.showConflicts) {
      filtered = filtered.filter(shift => {
        const validation = validateShift(shift, shifts);
        return !validation.isValid;
      });
    }

    // Filtrage par heures supplémentaires
    if (filters.showOvertime) {
      filtered = filtered.filter(shift => (shift.overtimeHours || 0) > 0);
    }

    return sortShifts(filtered, sorting.field, sorting.direction);
  }, [shifts, employees, filters, sorting]);

  // Événements du calendrier
  const calendarEvents = useMemo(() => {
    return shiftsToCalendarEvents(filteredShifts, employees);
  }, [filteredShifts, employees]);

  // Couleurs des employés
  const employeeColors = useMemo(() => {
    return generateEmployeeColors(employees);
  }, [employees]);

  // Dates selon la période sélectionnée
  const periodDates = useMemo(() => {
    switch (timePeriod) {
      case "week":
        return getWeekDates(selectedDate);
      case "month":
        return getMonthDates(selectedDate);
      case "day":
        return [selectedDate];
      default:
        return [selectedDate];
    }
  }, [selectedDate, timePeriod]);

  // Conflits détectés
  const conflicts = useMemo(() => {
    const allConflicts: ShiftConflict[] = [];
    
    filteredShifts.forEach(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      if (!employee) return;
      
      const validation = validateShift(shift, shifts);
      if (!validation.isValid) {
        // schedule.utils.validateShift retourne { isValid, errors }
        // ici, conserver simple: si non valide, ajouter un conflit générique
        allConflicts.push({
          type: 'availability',
          description: 'Conflit détecté',
          severity: 'medium',
          affectedShifts: [shift.id],
          suggestions: []
        });
      }
    });
    
    return allConflicts;
  }, [filteredShifts, shifts, employees]);

  // Fonctions de manipulation
  const handleShiftSelect = useCallback((shift: Shift) => {
    setSelectedShift(shift);
    const employee = employees.find(e => e.id === shift.employeeId);
    if (employee) {
      setSelectedEmployee(employee);
    }
  }, [employees]);

  const handleEmployeeSelect = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    // Filtrer les shifts pour cet employé
    setFilters(prev => ({
      ...prev,
      employees: [employee.id]
    }));
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    // Mettre à jour la plage de dates selon la période
    if (timePeriod === "week") {
      const weekDates = getWeekDates(date);
      setFilters(prev => ({
        ...prev,
        dateRange: {
          start: weekDates[0]!,
          end: weekDates[weekDates.length - 1]!
        }
      }));
    } else if (timePeriod === "month") {
      const monthDates = getMonthDates(date);
      setFilters(prev => ({
        ...prev,
        dateRange: {
          start: monthDates[0]!,
          end: monthDates[monthDates.length - 1]!
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          start: date,
          end: date
        }
      }));
    }
  }, [timePeriod]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleTimePeriodChange = useCallback((period: TimePeriod) => {
    setTimePeriod(period);
    handleDateSelect(selectedDate); // Recalculer les dates
  }, [selectedDate, handleDateSelect]);

  const handleFilterChange = useCallback((newFilters: Partial<ScheduleFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSortChange = useCallback((field: keyof Shift, direction?: "asc" | "desc") => {
    setSorting(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === "asc" ? "desc" : "asc")
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      departments: [],
      positions: [],
      employees: [],
      dateRange: {
        start: new Date().toISOString().split('T')[0]!,
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      },
      status: [],
      showConflicts: false,
      showOvertime: false,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedShift(null);
    setSelectedEmployee(null);
  }, []);

  // Validation d'un shift
  const validateShiftData = useCallback((shiftData: Omit<Shift, "id">) => {
    const employee = employees.find(e => e.id === shiftData.employeeId);
    if (!employee) {
      return {
        isValid: false,
        conflicts: [],
        warnings: ["Employé non trouvé"],
        suggestions: []
      } as ScheduleValidation;
    }
    return validateShift(shiftData, shifts) as unknown as ScheduleValidation;
  }, [shifts, employees]);

  // Navigation dans le temps
  const navigateTime = useCallback((direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate);
    
    switch (timePeriod) {
      case "day":
        currentDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        currentDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        currentDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateStr) {
      handleDateSelect(dateStr);
    }
  }, [selectedDate, timePeriod, handleDateSelect]);

  // Statistiques rapides
  const quickStats = useMemo(() => {
    const totalShifts = filteredShifts.length;
    const totalHours = filteredShifts.reduce((sum, shift) => sum + shift.totalHours, 0);
    const totalPay = filteredShifts.reduce((sum, shift) => sum + shift.totalPay, 0);
    const uniqueEmployees = new Set(filteredShifts.map(s => s.employeeId)).size;
    const conflictCount = conflicts.length;
    const overtimeShifts = filteredShifts.filter(s => (s.overtimeHours || 0) > 0).length;
    
    return {
      totalShifts,
      totalHours,
      totalPay,
      uniqueEmployees,
      conflictCount,
      overtimeShifts,
      averageShiftLength: totalShifts > 0 ? totalHours / totalShifts : 0
    };
  }, [filteredShifts, conflicts]);

  // Groupement des shifts
  const groupedShifts = useMemo(() => {
    const groups: Record<string, Shift[]> = {};
    
    filteredShifts.forEach(shift => {
      let groupKey = "";
      
      switch (viewMode) {
        case "employee":
          const employee = employees.find(e => e.id === shift.employeeId);
          groupKey = employee ? `${employee.firstName} ${employee.lastName}` : "Inconnu";
          break;
        case "calendar":
          groupKey = shift.date;
          break;
        case "list":
          groupKey = shift.department as unknown as string;
          break;
        default:
          groupKey = shift.date;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      if (groups[groupKey]) {
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(shift);
      }
    });
    
    return groups;
  }, [filteredShifts, employees, viewMode]);

  return {
    // États
    selectedShift,
    selectedEmployee,
    selectedDate,
    viewMode,
    timePeriod,
    filters,
    sorting,
    isCreatingShift,
    isEditingShift,
    
    // Données traitées
    filteredShifts,
    calendarEvents,
    employeeColors,
    periodDates,
    conflicts,
    quickStats,
    groupedShifts,
    
    // Fonctions de manipulation
    handleShiftSelect,
    handleEmployeeSelect,
    handleDateSelect,
    handleViewModeChange,
    handleTimePeriodChange,
    handleFilterChange,
    handleSortChange,
    clearFilters,
    clearSelection,
    validateShiftData,
    navigateTime,
    
    // Fonctions d'état
    setSelectedShift,
    setSelectedEmployee,
    setIsCreatingShift,
    setIsEditingShift,
  };
};