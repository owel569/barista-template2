import React, { useState, useMemo, useCallback, memo } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { WorkScheduleProps, ViewMode, TimePeriod, Shift, Employee, DepartmentStat } from './types/schedule.types';
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
import EmployeeOverview from '@/admin/work-schedule/components/EmployeeOverview';
import AnalyticsView from './components/AnalyticsView';
import Spinner from '@/components/ui/spinner';

const WorkSchedule: React.FC<WorkScheduleProps> = ({
  userRole,
  selectedDate: initialDate,
  selectedEmployee: initialEmployee,
  viewMode = 'calendar'
}) => {
  // État local pour la période sélectionnée
  const [dateRange, setDateRange] = useState(() => {
    const start = initialDate ? new Date(initialDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
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
    start: dateRange.start,
    end: dateRange.end
  });

  // Hook de gestion des shifts
  const {
    selectedShift,
    selectedEmployee: selectedEmployeeData,
    viewMode: viewModeState,
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
  } = useShiftManagement({
    shifts,
    employees,
    initialFilters: {
      employees: initialEmployee ? [initialEmployee] : [],
      dateRange
    },
    initialViewMode: viewMode
  });

  // Permissions basées sur le rôle
  const permissions = useMemo(() => ({
    canCreate: ['directeur', 'manager'].includes(userRole),
    canEdit: ['directeur', 'manager'].includes(userRole),
    canDelete: userRole === 'directeur',
    canViewAnalytics: ['directeur', 'manager'].includes(userRole)
  }), [userRole]);

  // Gestion des actions sur les shifts
  const handleShiftCreate = useCallback(async (shiftData: Omit<Shift, 'id'>) => {
    try {
      const validation = validateShiftData(shiftData);
      if (!validation.isValid) {
        throw new Error('Validation failed: ' + validation.conflicts.join(', '));
      }
      await createShift(shiftData);
      toast({
        title: "Succès",
        description: "Le shift a été créé avec succès",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [createShift, validateShiftData]);

  const handleShiftEdit = useCallback(async (shift: Shift) => {
    try {
      await updateShift({ id: shift.id, data: shift });
      toast({
        title: "Succès",
        description: "Le shift a été mis à jour",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour",
        variant: "destructive"
      });
    }
  }, [updateShift]);

  const handleShiftDelete = useCallback(async (shiftId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce shift ?')) {
      try {
        await deleteShift(shiftId);
        toast({
          title: "Succès",
          description: "Shift supprimé",
          variant: "success"
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Échec de la suppression",
          variant: "destructive"
        });
      }
    }
  }, [deleteShift]);

  const handleEmployeeClick = useCallback((employee: Employee) => {
    handleEmployeeSelect(employee);
  }, [handleEmployeeSelect]);

  const handleExportData = useCallback(() => {
    // Implémentation réelle de l'export
    console.log('Exporting data...');
    toast({
      title: "Export réussi",
      description: "Les données ont été exportées",
      variant: "success"
    });
  }, []);

  // Composant de navigation des vues
  const ViewNavigation = memo(() => (
    <Tabs 
      value={viewModeState} 
      onValueChange={(value: string) => handleViewModeChange(value as ViewMode)} 
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="calendar">
          <Calendar className="h-4 w-4 mr-2" />
          Calendrier
        </TabsTrigger>
        <TabsTrigger value="list">
          <List className="h-4 w-4 mr-2" />
          Liste
        </TabsTrigger>
        <TabsTrigger value="employee">
          <Users className="h-4 w-4 mr-2" />
          Employés
        </TabsTrigger>
        {permissions.canViewAnalytics && (
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyses
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="calendar">
        <CalendarView
          shifts={filteredShifts}
          employees={employees}
          events={calendarEvents}
          onShiftClick={handleShiftSelect}
          onDateClick={handleDateSelect}
          onShiftCreate={permissions.canCreate ? handleShiftCreate : undefined}
          selectedDate={dateRange.start}
          viewMode={timePeriod}
        />
      </TabsContent>
      
      <TabsContent value="list">
        <ShiftListView
          shifts={filteredShifts}
          employees={employees}
          onShiftEdit={permissions.canEdit ? handleShiftEdit : undefined}
          onShiftDelete={permissions.canDelete ? handleShiftDelete : undefined}
          selectedFilters={filters}
          sorting={{ field: 'date', direction: 'asc' }}
        />
      </TabsContent>
      
      <TabsContent value="employee">
        <EmployeeOverview
          employees={employees}
          shifts={filteredShifts}
          onEmployeeClick={handleEmployeeClick}
          selectedPeriod={timePeriod}
        />
      </TabsContent>
      
      {permissions.canViewAnalytics && (
        <TabsContent value="analytics">
          <AnalyticsView
            stats={stats || {
              totalEmployees: 0,
              activeEmployees: 0,
              totalShifts: 0,
              scheduledHours: 0,
              overtimeHours: 0,
              totalPayroll: 0,
              averageHoursPerEmployee: 0,
              departmentStats: [] as DepartmentStat[],
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
  ));

  // Composant de contrôles
  const ControlsBar = memo(() => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={() => navigateTime('prev')}>
          ← Précédent
        </Button>
        <Button variant="outline" onClick={() => navigateTime('next')}>
          Suivant →
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
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
        
        <Button variant="outline" onClick={() => handleFilterChange({ showConflicts: !filters.showConflicts })}>
          <Filter className="h-4 w-4 mr-2" />
          {filters.showConflicts ? 'Masquer conflits' : 'Voir conflits'}
        </Button>
        
        {permissions.canCreate && (
          <Button onClick={() => setIsCreatingShift(true)} disabled={creatingShift}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau shift
          </Button>
        )}
        
        <Button variant="outline" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  ));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Spinner size="xl" className="mx-auto" />
          <p className="mt-4 text-lg">Chargement des horaires...</p>
        </div>
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
                {userRole === 'directeur' ? 'Directeur' : 
                 userRole === 'manager' ? 'Manager' : 'Employé'}
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
              {shiftRequests.slice(0, 3).map((request) => (
                <div 
                  key={`request-${request.id}`}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {request.employee?.firstName} {request.employee?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.requestType} • {request.date}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => processShiftRequest({ id: request.id, action: 'approve' })}>
                      Approuver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => processShiftRequest({ id: request.id, action: 'reject' })}>
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

export default React.memo(WorkSchedule);