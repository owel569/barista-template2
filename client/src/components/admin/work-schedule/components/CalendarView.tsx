import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { CalendarViewProps, Shift, TimePeriod } from '../types/schedule.types';
import { 
  formatDuration, 
  formatCurrency, 
  getWeekDates, 
  getMonthDates,
  SHIFT_STATUS_COLORS 
} from '../utils/schedule.utils';

const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  employees,
  onShiftClick,
  onDateClick,
  onShiftCreate,
  selectedDate,
  viewMode
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // Générer les dates selon le mode de vue
  const dates = useMemo(() => {
    switch (viewMode) {
      case 'week':
        return getWeekDates(currentDate);
      case 'month':
        return getMonthDates(currentDate);
      case 'day':
        return [currentDate];
      default:
        return getWeekDates(currentDate);
    }
  }, [currentDate, viewMode]);

  // Grouper les shifts par date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    
    shifts.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    return grouped;
  }, [shifts]);

  // Navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(current.toISOString().split('T')[0]);
  };

  // Formatage des titres
  const getTitle = () => {
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
        const weekDates = getWeekDates(currentDate);
        const startDate = new Date(weekDates[0]);
        const endDate = new Date(weekDates[weekDates.length - 1]);
        return `${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  // Composant ShiftItem
  const ShiftItem: React.FC<{ shift: Shift; compact?: boolean }> = ({ shift, compact = false }) => {
    const employee = employees.find(e => e.id === shift.employeeId);
    const statusColor = SHIFT_STATUS_COLORS[shift.status];
    
    return (
      <div
        onClick={() => onShiftClick(shift)}
        className={`
          p-2 rounded-lg border cursor-pointer transition-all duration-200
          hover:shadow-md hover:scale-105
          ${compact ? 'text-xs' : 'text-sm'}
        `}
        style={{ 
          backgroundColor: statusColor + '20',
          borderColor: statusColor + '40'
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

  // Composant DayColumn
  const DayColumn: React.FC<{ date: string; shifts: Shift[] }> = ({ date, shifts: dayShifts }) => {
    const dayDate = new Date(date);
    const isToday = date === new Date().toISOString().split('T')[0];
    const isSelected = date === selectedDate;
    
    return (
      <div className={`
        border rounded-lg p-2 min-h-[200px] 
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isToday ? 'bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-gray-900'}
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
      `}>
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
            onClick={() => {
              onDateClick(date);
              onShiftCreate({
                employeeId: 0,
                date,
                startTime: '09:00',
                endTime: '17:00',
                position: 'serveur',
                department: 'service',
                status: 'scheduled',
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
          {dayShifts.map(shift => (
            <ShiftItem 
              key={shift.id} 
              shift={shift} 
              compact={viewMode === 'month'} 
            />
          ))}
        </div>
        
        {dayShifts.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-600 text-sm mt-8">
            Aucun shift programmé
          </div>
        )}
      </div>
    );
  };

  // Statistiques rapides pour la période
  const periodStats = useMemo(() => {
    const periodShifts = shifts.filter(shift => dates.includes(shift.date));
    const totalHours = periodShifts.reduce((sum, shift) => sum + shift.totalHours, 0);
    const totalCost = periodShifts.reduce((sum, shift) => sum + shift.totalPay, 0);
    const uniqueEmployees = new Set(periodShifts.map(s => s.employeeId)).size;
    
    return {
      totalShifts: periodShifts.length,
      totalHours,
      totalCost,
      uniqueEmployees
    };
  }, [shifts, dates]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
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
              onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
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
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
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
          // Vue journalière détaillée
          <div className="space-y-4">
            <DayColumn 
              date={currentDate} 
              shifts={shiftsByDate[currentDate] || []} 
            />
          </div>
        ) : (
          // Vue semaine/mois en grille
          <div className={`
            grid gap-4 
            ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}
            ${viewMode === 'month' ? 'grid-rows-5' : ''}
          `}>
            {dates.map(date => (
              <DayColumn 
                key={date} 
                date={date} 
                shifts={shiftsByDate[date] || []} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView;