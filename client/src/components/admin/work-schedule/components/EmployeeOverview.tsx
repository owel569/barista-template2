import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Clock, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { EmployeeOverviewProps, Employee, Shift } from '../types/schedule.types';
import { formatDuration, formatCurrency, DEPARTMENTS, POSITIONS } from '../utils/schedule.utils';

const EmployeeOverview: React.FC<EmployeeOverviewProps> = ({
  employees,
  shifts,
  onEmployeeClick,
  selectedPeriod
}) => {
  // Calcul des statistiques par employé
  const employeeStats = useMemo(() => {
    return employees.map(employee => {
      const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);
      const totalHours = employeeShifts.reduce((sum, shift) => sum + shift.totalHours, 0);
      const totalPay = employeeShifts.reduce((sum, shift) => sum + shift.totalPay, 0);
      const overtimeHours = employeeShifts.reduce((sum, shift) => sum + (shift.overtimeHours || 0), 0);
      
      // Calcul des statistiques de performance
      const completedShifts = employeeShifts.filter(shift => shift.status === 'completed').length;
      const noShowShifts = employeeShifts.filter(shift => shift.status === 'no_show').length;
      const reliabilityScore = employeeShifts.length > 0 
        ? ((completedShifts / employeeShifts.length) * 100) 
        : 100;
      
      // Prochains shifts
      const upcomingShifts = employeeShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        const today = new Date();
        return shiftDate >= today && shift.status === 'scheduled';
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        employee,
        totalShifts: employeeShifts.length,
        totalHours,
        totalPay,
        overtimeHours,
        completedShifts,
        noShowShifts,
        reliabilityScore,
        upcomingShifts: upcomingShifts.slice(0, 3), // Prochains 3 shifts
        averageHoursPerShift: employeeShifts.length > 0 ? totalHours / employeeShifts.length : 0,
        lastShiftDate: employeeShifts.length > 0 
          ? Math.max(...employeeShifts.map(s => new Date(s.date).getTime()))
          : null
      };
    });
  }, [employees, shifts]);

  // Tri par heures travaillées
  const sortedEmployeeStats = useMemo(() => {
    return [...employeeStats].sort((a, b) => b.totalHours - a.totalHours);
  }, [employeeStats]);

  // Composant EmployeeCard
  const EmployeeCard: React.FC<{ stats: typeof employeeStats[0] }> = ({ stats }) => {
    const { employee } = stats;
    const department = DEPARTMENTS.find(d => d.id === employee.department);
    const position = POSITIONS.find(p => p.id === employee.position);
    
    const isHighPerformer = stats.reliabilityScore >= 95 && stats.totalHours > 0;
    const needsAttention = stats.reliabilityScore < 80 || stats.noShowShifts > 0;
    
    return (
      <Card 
        className={`
          cursor-pointer hover:shadow-lg transition-all duration-200
          ${needsAttention ? 'border-red-200 dark:border-red-800' : ''}
          ${isHighPerformer ? 'border-green-200 dark:border-green-800' : ''}
        `}
        onClick={() => onEmployeeClick(employee)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatar} alt={employee.firstName} />
                <AvatarFallback>
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-lg">
                  {employee.firstName} {employee.lastName}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  <span>{position?.name || employee.position}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              {isHighPerformer && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ⭐ Top performer
                </Badge>
              )}
              {needsAttention && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Attention requise
                </Badge>
              )}
              {!employee.isActive && (
                <Badge variant="outline" className="text-xs">
                  Inactif
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Informations de contact */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: department?.color }}
              />
              <span>{department?.name || employee.department}</span>
            </div>
          </div>
          
          {/* Statistiques principales */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalShifts}
              </div>
              <div className="text-xs text-gray-500">Shifts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatDuration(stats.totalHours)}
              </div>
              <div className="text-xs text-gray-500">Heures</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(stats.totalPay)}
              </div>
              <div className="text-xs text-gray-500">Salaire</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                stats.reliabilityScore >= 95 ? 'text-green-600 dark:text-green-400' :
                stats.reliabilityScore >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {stats.reliabilityScore.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Fiabilité</div>
            </div>
          </div>
          
          {/* Heures supplémentaires */}
          {stats.overtimeHours > 0 && (
            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Heures supplémentaires
                </span>
              </div>
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                {formatDuration(stats.overtimeHours)}
              </span>
            </div>
          )}
          
          {/* Prochains shifts */}
          {stats.upcomingShifts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Prochains shifts
              </div>
              {stats.upcomingShifts.map((shift, index) => (
                <div key={shift.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>{new Date(shift.date).toLocaleDateString('fr-FR', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Compétences */}
          {employee.skills.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Compétences
              </div>
              <div className="flex flex-wrap gap-1">
                {employee.skills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {employee.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{employee.skills.length - 3} autres
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Statistiques générales
  const overallStats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.isActive).length;
    const totalHours = employeeStats.reduce((sum, stat) => sum + stat.totalHours, 0);
    const totalPay = employeeStats.reduce((sum, stat) => sum + stat.totalPay, 0);
    const averageReliability = employeeStats.length > 0 
      ? employeeStats.reduce((sum, stat) => sum + stat.reliabilityScore, 0) / employeeStats.length 
      : 0;
    
    return {
      totalEmployees: employees.length,
      activeEmployees,
      totalHours,
      totalPay,
      averageReliability,
      topPerformers: employeeStats.filter(stat => stat.reliabilityScore >= 95).length,
      needsAttention: employeeStats.filter(stat => stat.reliabilityScore < 80).length
    };
  }, [employees, employeeStats]);

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Vue d'ensemble des employés</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {overallStats.activeEmployees}/{overallStats.totalEmployees}
              </div>
              <div className="text-sm text-gray-500">Employés actifs</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatDuration(overallStats.totalHours)}
              </div>
              <div className="text-sm text-gray-500">Total heures</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(overallStats.totalPay)}
              </div>
              <div className="text-sm text-gray-500">Masse salariale</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {overallStats.averageReliability.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Fiabilité moyenne</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                {overallStats.topPerformers} top performers
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm">
                {overallStats.needsAttention} nécessitent attention
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEmployeeStats.map(stats => (
          <EmployeeCard key={stats.employee.id} stats={stats} />
        ))}
      </div>
      
      {employees.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun employé trouvé
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeOverview;