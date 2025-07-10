import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  isActive: boolean;
}

interface WorkShift {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface ScheduleStats {
  totalShifts: number;
  totalHours: number;
  employeesScheduled: number;
  shiftsThisWeek: number;
}

export default function WorkSchedule() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchScheduleData();
  }, [currentWeek]);

  const fetchScheduleData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [employeesRes, shiftsRes, statsRes] = await Promise.all([
        fetch('/api/admin/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/work-shifts?week=${currentWeek.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/work-shifts/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (employeesRes.ok && shiftsRes.ok && statsRes.ok) {
        const [employeesData, shiftsData, statsData] = await Promise.all([
          employeesRes.json(),
          shiftsRes.json(),
          statsRes.json()
        ]);
        
        setEmployees(employeesData);
        setShifts(shiftsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }

    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const updateShiftStatus = async (shiftId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/work-shifts/${shiftId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchScheduleData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const weekDays = getWeekDays(currentWeek);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Planning de Travail
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des horaires et équipes
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Créneau
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Créneaux
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalShifts}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Heures
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalHours}h
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Employés Actifs
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.employeesScheduled}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Cette Semaine
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.shiftsThisWeek}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Vue Calendrier</TabsTrigger>
          <TabsTrigger value="shifts">Liste des Créneaux</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Navigation de semaine */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {weekStart.toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long' 
                    })} - {weekEnd.toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                </div>
                <Button variant="outline" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grille hebdomadaire */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-8 gap-4">
                {/* Header */}
                <div className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                  Employé
                </div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="font-semibold text-sm">
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {day.getDate()}
                    </div>
                  </div>
                ))}

                {/* Employés et créneaux */}
                {employees.filter(emp => emp.isActive).map((employee) => (
                  <React.Fragment key={employee.id}>
                    <div className="py-4 border-t">
                      <div className="font-medium text-sm">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {employee.position}
                      </Badge>
                    </div>
                    {weekDays.map((day) => {
                      const dayShifts = shifts.filter(shift => 
                        shift.employeeId === employee.id &&
                        new Date(shift.date).toDateString() === day.toDateString()
                      );

                      return (
                        <div key={day.toISOString()} className="py-4 border-t min-h-[80px]">
                          <div className="space-y-2">
                            {dayShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="text-xs p-2 rounded bg-blue-100 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/40"
                              >
                                <div className="font-medium">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                <Badge className={getStatusColor(shift.status)} variant="outline">
                                  {getStatusText(shift.status)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="space-y-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {shift.employeeName}
                          </h3>
                          <Badge className={getStatusColor(shift.status)}>
                            {getStatusText(shift.status)}
                          </Badge>
                          <Badge variant="outline">{shift.position}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <p className="font-medium">
                              {new Date(shift.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Horaires:</span>
                            <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Durée:</span>
                            <p className="font-medium">
                              {(() => {
                                const start = new Date(`2000-01-01T${shift.startTime}`);
                                const end = new Date(`2000-01-01T${shift.endTime}`);
                                const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                return `${diff}h`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                            <p className="font-medium">{shift.notes || 'Aucune'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {shift.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateShiftStatus(shift.id, 'confirmed')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Confirmer
                        </Button>
                      )}
                      
                      {shift.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateShiftStatus(shift.id, 'completed')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Terminer
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);
              const totalHours = employeeShifts.reduce((sum, shift) => {
                const start = new Date(`2000-01-01T${shift.startTime}`);
                const end = new Date(`2000-01-01T${shift.endTime}`);
                const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return sum + diff;
              }, 0);

              return (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <Badge variant="outline">{employee.position}</Badge>
                      </div>
                      <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {employee.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Créneaux programmés:</span>
                        <span className="font-semibold">{employeeShifts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total heures:</span>
                        <span className="font-semibold">{totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heures/semaine:</span>
                        <span className="font-semibold">
                          {(totalHours / Math.max(1, Math.ceil(employeeShifts.length / 7))).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Poste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(employees.map(emp => emp.position))).map((position) => {
                    const positionEmployees = employees.filter(emp => emp.position === position);
                    const positionShifts = shifts.filter(shift => shift.position === position);
                    
                    return (
                      <div key={position} className="flex items-center justify-between">
                        <span className="font-medium">{position}</span>
                        <div className="text-right">
                          <p className="font-semibold">{positionEmployees.length} employés</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {positionShifts.length} créneaux
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques Hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Créneaux confirmés:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {shifts.filter(shift => shift.status === 'confirmed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>En attente:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {shifts.filter(shift => shift.status === 'scheduled').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Terminés:</span>
                    <Badge className="bg-gray-100 text-gray-800">
                      {shifts.filter(shift => shift.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de confirmation:</span>
                    <span className="font-semibold">
                      {shifts.length > 0 
                        ? Math.round((shifts.filter(shift => shift.status === 'confirmed').length / shifts.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}