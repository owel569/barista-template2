import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge
} from '@/components/ui';
import {
  ChevronLeft, ChevronRight, Plus,
  Clock, User, MapPin, AlertTriangle
} from 'lucide-react';
import { CalendarViewProps, Shift } from '../types/schedule.types';
import {
  formatDuration, formatCurrency,
  getWeekDates, getMonthDates,
  SHIFT_STATUS_COLORS
} from '../utils/schedule.utils';

interface DayColumnProps {
  date: string;
  shifts: Shift[];
  isSelected: boolean;
  onDateClick: (date: string) => void;
  onShiftClick: (shift: Shift) => void;
  onShiftCreate: (newShift: Omit<Shift, 'id'>) => void;
  compact?: boolean;
  employees: { id: number; firstName: string; lastName: string }[];
}

interface ShiftItemProps {
  shift: Shift;
  employee?: { firstName: string; lastName: string } | undefined;
  compact?: boolean;
  onClick: (e?: React.MouseEvent) => void;
}

const ShiftItem: React.FC<ShiftItemProps> = ({
  shift,
  employee,
  compact = false,
  onClick
}) => {
  const statusColor = SHIFT_STATUS_COLORS[shift.status];

  return (
    <div
      onClick={onClick}
      className={`
        p-2 rounded-lg border cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        ${compact ? 'text-xs' : 'text-sm'}
      `}
      style={{
        backgroundColor: `${statusColor}20`,
        borderColor: `${statusColor}40`
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <User className="h-3 w-3" />
          <span className="font-medium">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Inconnu'}
          </span>
        </div>
        {shift.notes && (
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
        )}
      </div>

      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
        <Clock className="h-3 w-3" />
        <span>{shift.startTime} - {shift.endTime}</span>
      </div>

      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
        <MapPin className="h-3 w-3" />
        <span>{shift.position}</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <Badge
          variant="outline"
          className="text-xs"
          style={{ color: statusColor }}
        >
          {shift.status}
        </Badge>
        <span className="text-xs font-medium">
          {formatDuration(shift.totalHours)}
        </span>
      </div>
    </div>
  );
};

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  shifts,
  isSelected,
  onDateClick,
  onShiftClick,
  onShiftCreate,
  compact = false,
  employees
}) => {
  const dayDate = new Date(date);
  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div
      onClick={() => onDateClick(date)}
      className={`
        border rounded-lg p-2 min-h-[200px]
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isToday ? 'bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-gray-900'}
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        cursor-pointer
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {dayDate.toLocaleDateString('fr-FR', { weekday: 'short' })}
          </div>
          <div className={`
            text-lg font-semibold
            ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
          `}>
            {dayDate.getDate()}
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onShiftCreate({
              employeeId: employees[0]?.id ?? 0,
              date,
              startTime: '09:00',
              endTime: '17:00',
              position: 'serveur',
              department: 'service',
              status: 'scheduled',
              overtimeHours: 0,
              hourlyRate: 15,
              totalHours: 8,
              totalPay: 120,
              isRecurring: false
            });
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {shifts.map((shift) => {
          const employee = employees.find(e => e.id === shift.employeeId);
          return (
            <ShiftItem
              key={shift.id}
              shift={shift}
              employee={employee ?? undefined}
              compact={compact}
              onClick={() => {
                onShiftClick(shift);
              }}
            />
          );
        })}
      </div>

      {shifts.length === 0 && (
        <div className="text-center text-gray-400 dark:text-gray-600 text-sm mt-8">
          Aucun shift programmé
        </div>
      )}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  employees,
  onShiftClick,
  onDateClick,
  onShiftCreate,
  selectedDate,
  viewMode = 'week'
}) => {
  const initialDate = selectedDate ?? new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState<string>(() =>
    initialDate || new Date().toISOString().split('T')[0]
  );

  // Générer les dates selon le mode de vue
  const dates = useMemo(() => {
    const base = currentDate ?? initialDate;
    switch (viewMode) {
      case 'week': return getWeekDates(base);
      case 'month': return getMonthDates(base);
      case 'day': return [base];
      default: return getWeekDates(base);
    }
  }, [currentDate, viewMode, initialDate]);

  // Grouper les shifts par date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    shifts.forEach(shift => {
      const dateKey = shift.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(shift);
    });
    return grouped;
  }, [shifts]);

  // Navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(currentDate ?? initialDate);
    const increment = direction === 'next' ? 1 : -1;

    switch (viewMode) {
      case 'day': current.setDate(current.getDate() + increment); break;
      case 'week': current.setDate(current.getDate() + (increment * 7)); break;
      case 'month': current.setMonth(current.getMonth() + increment); break;
    }

    const dateString = current.toISOString().split('T')[0];
    if (dateString) {
      setCurrentDate(dateString);
    }
  };

  // Formatage des titres
  const getTitle = (): string => {
    const date = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        return date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'week':
        const weekDates = getWeekDates(currentDate ?? initialDate);
        const start = new Date(weekDates[0] || new Date());
        const end = new Date(weekDates[weekDates.length - 1] || new Date());
        return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  // Statistiques pour la période
  const periodStats = useMemo(() => {
    const periodShifts = shifts.filter(shift =>
      dates.some(d => (typeof d === 'string' ? d : String(d)) === shift.date)
    );

    return {
      totalShifts: periodShifts.length,
      totalHours: periodShifts.reduce((sum, shift) => sum + shift.totalHours, 0),
      totalCost: periodShifts.reduce((sum, shift) => sum + shift.totalPay, 0),
      uniqueEmployees: new Set(periodShifts.map(s => s.employeeId)).size
    };
  }, [shifts, dates]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold">
            {getTitle()}
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(() => new Date().toISOString().split('T')[0])}
            >
              Aujourd'hui
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-2">
          <div className="flex items-center space-x-1">
            <span>{periodStats.totalShifts} shifts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(periodStats.totalHours)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{periodStats.uniqueEmployees} employés</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{formatCurrency(periodStats.totalCost)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === 'day' ? (
          <DayColumn
            date={currentDate}
            shifts={shiftsByDate[currentDate] || []}
            isSelected={true}
            onDateClick={onDateClick}
            onShiftClick={onShiftClick}
            onShiftCreate={onShiftCreate}
            employees={employees}
          />
        ) : (
          <div className={`
            grid gap-4
            ${viewMode === 'week' ? 'grid-cols-1 sm:grid-cols-7' : 'grid-cols-1 sm:grid-cols-7'}
            ${viewMode === 'month' ? 'grid-rows-5' : ''}
          `}>
            {dates.map((date, index) => (
              <DayColumn
                key={index}
                date={typeof date === 'string' ? date : String(date)}
                shifts={shiftsByDate[typeof date === 'string' ? date : String(date)] || []}
                isSelected={(typeof date === 'string' ? date : String(date)) === selectedDate}
                onDateClick={onDateClick}
                onShiftClick={onShiftClick}
                onShiftCreate={onShiftCreate}
                compact={viewMode === 'month'}
                employees={employees}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CalendarView);