import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, Clock, Users, Plus, Edit, Trash2, Copy, 
  Download, Upload, AlertCircle, CheckCircle, User,
  Coffee, Utensils, UserCheck, Rotate3D, Bell
} from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  maxHours: number;
  availableDays: string[];
  skills: string[];
}

interface Shift {
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

export default function StaffScheduling() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);

  useEffect(() => {
    fetchEmployees();
    fetchShifts();
  }, [selectedWeek]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const enrichedEmployees = data.map((emp: any) => ({
          ...emp,
          name: `${emp.firstName} ${emp.lastName}`,
          maxHours: emp.maxHours || 40,
          availableDays: emp.availableDays || ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
          skills: emp.skills || ['service', 'caisse']
        }));
        setEmployees(enrichedEmployees);
      }
    } catch (error) {
      console.error('Erreur chargement employés:', error);
    }
  };

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/work-shifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const enrichedShifts = data.map((shift: any) => ({
          id: shift.id,
          employeeId: shift.employeeId,
          employeeName: employees.find(emp => emp.id === shift.employeeId)?.name || 'Employé inconnu',
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          position: shift.position || 'Service',
          status: shift.status || 'scheduled',
          notes: shift.notes
        }));
        setShifts(enrichedShifts);
      }
    } catch (error) {
      console.error('Erreur chargement horaires:', error);
    }
  };

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const getWeekDates = (date: Date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Lundi
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(shift => shift.date?.startsWith(dateStr || ''));
  };

  const calculateHours = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const getEmployeeWeeklyHours = (employeeId: number) => {
    const weekDates = getWeekDates(selectedWeek);
    const employeeShifts = shifts.filter(shift => 
      shift.employeeId === employeeId &&
      weekDates.some(date => shift.date?.startsWith(date.toISOString().split('T')[0] || ''))
    );
    
    return employeeShifts.reduce((total, shift) => {
      return total + calculateHours(shift.startTime, shift.endTime);
    }, 0);
  };

  const addShift = async (shiftData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/work-shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shiftData)
      });
      
      if (response.ok) {
        fetchShifts();
        setShowAddShift(false);
      }
    } catch (error) {
      console.error('Erreur ajout horaire:', error);
    }
  };

  const updateShiftStatus = async (shiftId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/work-shifts/${shiftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const deleteShift = async (shiftId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/work-shifts/${shiftId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Erreur suppression horaire:', error);
    }
  };

  const generateAutoSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/schedule/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weekStart: selectedWeek.toISOString(),
          preferences: {
            minStaffPerShift: 2,
            maxHoursPerEmployee: 40,
            preferredPositions: ['service', 'caisse', 'cuisine']
          }
        })
      });
      
      if (response.ok) {
        fetchShifts();
        alert('Planning automatique généré avec succès !');
      }
    } catch (error) {
      console.error('Erreur génération automatique:', error);
    }
  };

  const ShiftCard = ({ shift, day }: { shift: Shift, day: Date }) => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const hours = calculateHours(shift.startTime, shift.endTime);
    
    return (
      <Card className="mb-2 p-2 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3" />
              <span className="text-xs font-medium">{shift.employeeName}</span>
              <Badge 
                variant={shift.status === 'confirmed' ? 'default' : 
                        shift.status === 'completed' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {shift.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {shift.startTime} - {shift.endTime} ({hours}h)
            </div>
            <div className="text-xs text-muted-foreground">
              {shift.position}
            </div>
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => updateShiftStatus(shift.id, 
                shift.status === 'scheduled' ? 'confirmed' : 'scheduled'
              )}
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => deleteShift(shift.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planning du Personnel</h2>
          <p className="text-muted-foreground">
            Gestion avancée des horaires et de l'affectation du personnel
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={generateAutoSchedule}>
            <Rotate3D className="h-4 w-4 mr-2" />
            Auto-Planning
          </Button>
          <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Créneau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un créneau</DialogTitle>
                <DialogDescription>
                  Planifiez un nouveau créneau de travail
                </DialogDescription>
              </DialogHeader>
              <AddShiftForm onSubmit={addShift} employees={employees} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation semaine */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Semaine du {selectedWeek.toLocaleDateString()}</CardTitle>
              <CardDescription>Planning hebdomadaire du personnel</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const prev = new Date(selectedWeek);
                  prev.setDate(prev.getDate() - 7);
                  setSelectedWeek(prev);
                }}
              >
                ← Semaine précédente
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedWeek(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const next = new Date(selectedWeek);
                  next.setDate(next.getDate() + 7);
                  setSelectedWeek(next);
                }}
              >
                Semaine suivante →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Planning Visuel</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="conflicts">Conflits</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-8 gap-2">
                {/* Header avec heures */}
                <div className="text-xs font-medium p-2">Heures</div>
                {getWeekDates(selectedWeek).map((date, index) => (
                  <div key={index} className="text-xs font-medium p-2 text-center">
                    <div>{weekDays[index]}</div>
                    <div className="text-muted-foreground">{date.getDate()}</div>
                  </div>
                ))}

                {/* Grille des créneaux */}
                {timeSlots.map(timeSlot => (
                  <React.Fragment key={timeSlot}>
                    <div className="text-xs p-2 text-muted-foreground border-r">
                      {timeSlot}
                    </div>
                    {getWeekDates(selectedWeek).map((date, dayIndex) => {
                      const dayShifts = getShiftsForDay(date);
                      const timeShifts = dayShifts.filter(shift => 
                        shift.startTime <= timeSlot && shift.endTime > timeSlot
                      );
                      
                      return (
                        <div key={`${timeSlot}-${dayIndex}`} className="min-h-12 border border-gray-100 p-1">
                          {timeShifts.map(shift => (
                            <div 
                              key={shift.id}
                              className="text-xs bg-blue-100 rounded p-1 mb-1 cursor-pointer"
                              onClick={() => setSelectedEmployee(employees.find(emp => emp.id === shift.employeeId) || null)}
                            >
                              <div className="font-medium truncate">{shift.employeeName}</div>
                              <div className="text-muted-foreground">{shift.position}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map(employee => {
              const weeklyHours = getEmployeeWeeklyHours(employee.id);
              const isOvertime = weeklyHours > employee.maxHours;
              
              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">{employee.name}</CardTitle>
                        <CardDescription>{employee.position}</CardDescription>
                      </div>
                      <Badge variant={isOvertime ? 'destructive' : 'default'}>
                        {weeklyHours}h / {employee.maxHours}h
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <strong>Département:</strong> {employee.department}
                      </div>
                      <div className="text-xs">
                        <strong>Compétences:</strong> {employee.skills.join(', ')}
                      </div>
                      <div className="text-xs">
                        <strong>Disponibilités:</strong> {employee.availableDays.join(', ')}
                      </div>
                      {isOvertime && (
                        <div className="flex items-center space-x-2 text-red-600 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <span>Heures supplémentaires</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques Hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total heures planifiées:</span>
                    <span className="font-semibold">
                      {shifts.reduce((total, shift) => 
                        total + calculateHours(shift.startTime, shift.endTime), 0
                      ).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre d'employés actifs:</span>
                    <span className="font-semibold">{employees.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Créneaux confirmés:</span>
                    <span className="font-semibold">
                      {shifts.filter(s => s.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moyenne heures/employé:</span>
                    <span className="font-semibold">
                      {employees.length > 0 ? (
                        shifts.reduce((total, shift) => 
                          total + calculateHours(shift.startTime, shift.endTime), 0
                        ) / employees.length
                      ).toFixed(1) : 0}h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Service', 'Caisse', 'Cuisine', 'Nettoyage'].map(position => {
                    const count = shifts.filter(s => s.position === position).length;
                    return (
                      <div key={position} className="flex justify-between">
                        <span>{position}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts">
          <Card>
            <CardHeader>
              <CardTitle>Détection de Conflits</CardTitle>
              <CardDescription>
                Conflits et problèmes potentiels dans le planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map(employee => {
                  const weeklyHours = getEmployeeWeeklyHours(employee.id);
                  const isOvertime = weeklyHours > employee.maxHours;
                  
                  if (!isOvertime) return null;
                  
                  return (
                    <div key={employee.id} className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-red-700">
                          Heures supplémentaires: {weeklyHours}h (max: {employee.maxHours}h)
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {employees.every(emp => getEmployeeWeeklyHours(emp.id) <= emp.maxHours) && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">Aucun conflit détecté</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AddShiftForm = ({ onSubmit, employees }: { onSubmit: (data: any) => void, employees: Employee[] }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    position: 'Service',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      employeeId: Number(formData.employeeId)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employé</Label>
        <Select value={formData.employeeId} onValueChange={(value) => 
          setFormData({ ...formData, employeeId: value })
        }>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un employé" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id.toString()}>
                {emp.name} - {emp.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Heure de début</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Heure de fin</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label>Position</Label>
        <Select value={formData.position} onValueChange={(value) => 
          setFormData({ ...formData, position: value })
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Caisse">Caisse</SelectItem>
            <SelectItem value="Cuisine">Cuisine</SelectItem>
            <SelectItem value="Nettoyage">Nettoyage</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes (optionnel)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes ou instructions particulières..."
        />
      </div>

      <Button type="submit" className="w-full">
        Ajouter le créneau
      </Button>
    </form>
  );
};