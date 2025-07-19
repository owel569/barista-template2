import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  List, 
  Users, 
  BarChart3, 
  Plus, 
  Filter,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react';
import { WorkScheduleProps, ViewMode, TimePeriod } from './types/schedule.types';
import { useScheduleData } from './hooks/useScheduleData';
import { useShiftManagement } from './hooks/useShiftManagement';
import { 
  EmployeeStatCard, 
  HoursStatCard, 
  PayrollStatCard, 
  ShiftsStatCard, 
  ConflictsStatCard 
} from './components/StatCard';
import CalendarView from './components/CalendarView';
import ShiftListView from './components/ShiftListView';
import EmployeeOverview from './components/EmployeeOverview';
import AnalyticsView from './components/AnalyticsView';

const WorkSchedule: React.FC<WorkScheduleProps> = ({
  userRole,
  selectedDate,
  selectedEmployee,
  viewMode = 'calendar'
}) => {
  // État local pour la période sélectionnée
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0]!,
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
  });

  // Hooks de gestion des données
  const {
    employees,
    shifts,
    shiftRequests,
    stats,
    isLoading,
    createShift,
    updateShift,
    deleteShift,
    processShiftRequest,
    creatingShift,
    updatingShift,
    deletingShift
  } = useScheduleData({
    start: dateRange.start || '',
    end: dateRange.end || ''
  });

  // Hook de gestion des shifts
  const {
    selectedShift,
    selectedEmployeeData,
    viewModeState,
    timePeriod,
    filters,
    filteredShifts,
    calendarEvents,
    conflicts,
    quickStats,
    handleShiftSelect,
    handleEmployeeSelect,
    handleDateSelect,
    handleViewModeChange,
    handleTimePeriodChange,
    handleFilterChange,
    validateShiftData,
    navigateTime
  } = useShiftManagement(shifts, employees, {
    employees: selectedEmployee ? [selectedEmployee] : [],
    dateRange
  });

  // Gestion des actions sur les shifts
  const handleShiftCreate = (shiftData: any) => {
    const validation = validateShiftData(shiftData);
    if (validation.isValid) {
      createShift(shiftData);
    } else {
      console.error('Validation échouée:', validation.conflicts);
    }
  };

  const handleShiftEdit = (shift: any) => {
    updateShift({ id: shift.id, data: shift });
  };

  const handleShiftDelete = (shiftId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce shift ?')) {
      deleteShift(shiftId);
    }
  };

  const handleEmployeeClick = (employee: any) => {
    handleEmployeeSelect(employee);
  };

  const handleExportData = () => {
    // Logique d'exportation des données
    console.log('Export des données d\'horaires...');
  };

  // Permissions basées sur le rôle
  const canCreateShift = userRole === 'directeur';
  const canEditShift = userRole === 'directeur';
  const canDeleteShift = userRole === 'directeur';
  const canViewAnalytics = userRole === 'directeur';

  // Composant de navigation des vues
  const ViewNavigation = () => (
    <Tabs value={viewModeState} onValueChange={(value) => handleViewModeChange(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="calendar" className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Calendrier</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="flex items-center space-x-2">
          <List className="h-4 w-4" />
          <span>Liste</span>
        </TabsTrigger>
        <TabsTrigger value="employee" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Employés</span>
        </TabsTrigger>
        {canViewAnalytics && (
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analyses</span>
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="calendar" className="space-y-4">
        <CalendarView
          shifts={filteredShifts as any}
          employees={employees}
          onShiftClick={handleShiftSelect}
          onDateClick={handleDateSelect}
          onShiftCreate={handleShiftCreate}
          selectedDate={selectedDate}
          viewMode={timePeriod}
        />
      </TabsContent>
      
      <TabsContent value="list" className="space-y-4">
        <ShiftListView
          shifts={filteredShifts as any}
          employees={employees}
          onShiftEdit={handleShiftEdit}
          onShiftDelete={handleShiftDelete}
          selectedFilters={filters}
          sorting={{ field: 'date', direction: 'asc' }}
        />
      </TabsContent>
      
      <TabsContent value="employee" className="space-y-4">
        <EmployeeOverview
          employees={employees}
          shifts={filteredShifts as any}
          onEmployeeClick={handleEmployeeClick}
          selectedPeriod={timePeriod}
        />
      </TabsContent>
      
      {canViewAnalytics && (
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsView
            stats={stats || {
              totalEmployees: 0,
              activeEmployees: 0,
              totalShifts: 0,
              scheduledHours: 0,
              overtimeHours: 0,
              totalPayroll: 0,
              averageHoursPerEmployee: 0,
              departmentStats: [],
              costAnalysis: {
                regularHours: 0,
                overtimeHours: 0,
                regularCost: 0,
                overtimeCost: 0,
                totalCost: 0,
                projectedMonthlyCost: 0
              }
            }}
            reports={[]}
            period={timePeriod}
            onPeriodChange={handleTimePeriodChange}
            onExportData={handleExportData}
          />
        </TabsContent>
      )}
    </Tabs>
  );

  // Composant de contrôles
  const ControlsBar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTime('prev')}
        >
          ← Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTime('next')}
        >
          Suivant →
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant="outline">
          {quickStats.totalShifts} shifts
        </Badge>
        <Badge variant="outline">
          {quickStats.uniqueEmployees} employés
        </Badge>
        {conflicts.length > 0 && (
          <Badge variant="destructive">
            {conflicts.length} conflits
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => console.log('Filtres')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
        
        {canCreateShift && (
          <Button
            size="sm"
            onClick={() => console.log('Créer shift')}
            disabled={creatingShift}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau shift
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des horaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement des horaires...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Gestion des horaires de travail
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={userRole === 'directeur' ? 'default' : 'secondary'}>
                {userRole === 'directeur' ? 'Directeur' : 'Employé'}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <EmployeeStatCard
          totalEmployees={employees.length}
          activeEmployees={employees.filter(e => e.isActive).length}
          loading={isLoading}
        />
        <HoursStatCard
          scheduledHours={quickStats.totalHours}
          overtimeHours={stats?.overtimeHours || 0}
          loading={isLoading}
        />
        <PayrollStatCard
          totalPayroll={quickStats.totalPay}
          loading={isLoading}
        />
        <ShiftsStatCard
          totalShifts={quickStats.totalShifts}
          loading={isLoading}
        />
        <ConflictsStatCard
          conflictCount={conflicts.length}
          loading={isLoading}
        />
      </div>

      {/* Barre de contrôles */}
      <ControlsBar />

      {/* Demandes de shift en attente */}
      {shiftRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Demandes en attente</span>
              <Badge variant="outline">{shiftRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shiftRequests.slice(0, 3).map(request => (
                <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <div>
                    <span className="font-medium">{request.employee?.firstName} {request.employee?.lastName}</span>
                    <span className="text-sm text-gray-500 ml-2">{request.requestType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      Approuver
                    </Button>
                    <Button size="sm" variant="outline">
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation principale */}
      <ViewNavigation />
    </div>
  );
};

export default WorkSchedule;