import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, Clock, Users, Plus, Edit, Trash2, Copy, 
  Download, Upload, AlertCircle, CheckCircle, User,
  Coffee, Utensils, UserCheck, RotateCw, Bell, Search,
  Filter, ChevronDown, ChevronUp, BarChart2, AlertTriangle,
  Mail, MessageSquare, Printer, Share2, Settings, RefreshCw, X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  maxHours: number;
  minHours: number;
  hourlyRate: number;
  availableDays: string[];
  skills: string[];
  status: 'active' | 'on_leave' | 'inactive';
  hireDate: string;
  avatar?: string;
}

interface Shift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  status: 'draft' | 'published' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftConflict {
  type: 'overlap' | 'overtime' | 'unavailable' | 'skill_mismatch';
  message: string;
  severity: 'warning' | 'error';
  shiftId: number;
  employeeId: number;
}

interface ScheduleAnalytics {
  totalHours: number;
  avgHoursPerEmployee: number;
  positionsDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  conflictsCount: number;
}

export default function StaffScheduling() {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [conflicts, setConflicts] = useState<ShiftConflict[]>([]);
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState({
    shifts: false,
    employees: false,
    analytics: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filter, setFilter] = useState({
    department: '',
    position: '',
    status: ''
  });
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);

  // Memoized derived data
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      (emp.firstName.toLowerCase() + ' ' + emp.lastName.toLowerCase()).includes(searchTerm.toLowerCase()) &&
      (filter.department ? emp.department === filter.department : true) &&
      (filter.position ? emp.position === filter.position : true) &&
      emp.status === 'active'
    );
  }, [employees, searchTerm, filter]);

  const weekDays = useMemo(() => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], []);
  const timeSlots = useMemo(() => [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ], []);

  // Fetch data functions
  const fetchEmployees = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, employees: true }));
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockEmployees: Employee[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        firstName: ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Emma', 'Thomas', 'Camille', 'Antoine', 'Julie', 'Nicolas', 'Laura'][i],
        lastName: ['Dupont', 'Martin', 'Bernard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia'][i],
        email: `employee${i+1}@baristacafe.com`,
        phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
        position: ['Serveur', 'Barista', 'Cuisinier', 'Manager', 'Caissier'][Math.floor(Math.random() * 5)],
        department: ['Salle', 'Bar', 'Cuisine', 'Management'][Math.floor(Math.random() * 4)],
        maxHours: 40,
        minHours: 20,
        hourlyRate: 10 + Math.floor(Math.random() * 6),
        availableDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].filter(() => Math.random() > 0.3),
        skills: ['service', 'caisse', 'bar', 'cuisine'].filter(() => Math.random() > 0.5),
        status: 'active',
        hireDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 3)).toISOString(),
        avatar: `https://i.pravatar.cc/150?img=${i + 10}`
      }));
      setEmployees(mockEmployees);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec du chargement des employés',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({ ...prev, employees: false }));
    }
  }, [toast]);

  const fetchShifts = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, shifts: true }));
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const weekStart = getWeekDates(selectedWeek)[0];
      const weekEnd = getWeekDates(selectedWeek)[6];

      const mockShifts: Shift[] = Array.from({ length: 30 }, (_, i) => {
        const dayOffset = Math.floor(Math.random() * 7);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayOffset);

        const startHour = 8 + Math.floor(Math.random() * 10);
        const duration = 4 + Math.floor(Math.random() * 5);

        return {
          id: i + 1,
          employeeId: Math.floor(Math.random() * 12) + 1,
          date: date.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
          position: ['Serveur', 'Barista', 'Cuisinier', 'Manager', 'Caissier'][Math.floor(Math.random() * 5)],
          status: ['draft', 'published', 'confirmed', 'completed'][Math.floor(Math.random() * 4)] as any,
          notes: Math.random() > 0.7 ? 'Note importante pour ce shift' : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      setShifts(mockShifts);
      detectConflicts(mockShifts);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec du chargement des shifts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({ ...prev, shifts: false }));
    }
  }, [selectedWeek, toast]);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, analytics: true }));
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const totalHours = shifts.reduce((total, shift) => 
        total + calculateHours(shift.startTime, shift.endTime), 0);

      const positionsDistribution = shifts.reduce((acc, shift) => {
        acc[shift.position] = (acc[shift.position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = shifts.reduce((acc, shift) => {
        acc[shift.status] = (acc[shift.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setAnalytics({
        totalHours,
        avgHoursPerEmployee: employees.length > 0 ? 
          totalHours / employees.length : 0,
        positionsDistribution,
        statusDistribution,
        conflictsCount: conflicts.length
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec du chargement des analytics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [shifts, employees.length, conflicts.length, toast]);

  // Helper functions
  const getWeekDates = useCallback((date: Date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Lundi

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  }, []);

  const calculateHours = useCallback((startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    return (endHours - startHours) + (endMinutes - startMinutes) / 60;
  }, []);

  const getEmployeeWeeklyHours = useCallback((employeeId: number) => {
    const weekDates = getWeekDates(selectedWeek);
    const employeeShifts = shifts.filter(shift => 
      shift.employeeId === employeeId &&
      weekDates.some(date => shift.date === date.toISOString().split('T')[0])
    );

    return employeeShifts.reduce((total, shift) => {
      return total + calculateHours(shift.startTime, shift.endTime);
    }, 0);
  }, [shifts, selectedWeek, getWeekDates, calculateHours]);

  const getShiftsForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(shift => shift.date === dateStr);
  }, [shifts]);

  const detectConflicts = useCallback((shiftsData: Shift[]) => {
    const detectedConflicts: ShiftConflict[] = [];

    // Check for overlapping shifts
    const shiftsByEmployee: Record<number, Shift[]> = {};
    shiftsData.forEach(shift => {
      if (!shiftsByEmployee[shift.employeeId]) {
        shiftsByEmployee[shift.employeeId] = [];
      }
      shiftsByEmployee[shift.employeeId].push(shift);
    });

    Object.entries(shiftsByEmployee).forEach(([employeeId, empShifts]) => {
      empShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 1; i < empShifts.length; i++) {
        const prevShift = empShifts[i - 1];
        const currentShift = empShifts[i];

        if (prevShift.date === currentShift.date && 
            currentShift && currentShift && prevShift.endTime > currentShift.startTime) {
          detectedConflicts.push({
            type: 'overlap',
            message: `Chevauchement de shifts pour l'employé ${employeeId}`,
            severity: 'error',
            shiftId: currentShift.id,
            employeeId: parseInt(employeeId)
          });
        }
      }

      // Check overtime
      const weeklyHours = empShifts.reduce((total, shift) => 
        total + calculateHours(shift.startTime, shift.endTime), 0);

      const employee = employees.find(e => e.id === parseInt(employeeId));
      if (employee && weeklyHours > employee.maxHours) {
        detectedConflicts.push({
          type: 'overtime',
          message: `Heures supplémentaires pour ${employee.firstName} ${employee.lastName}`,
          severity: 'warning',
          shiftId: empShifts[0].id,
          employeeId: parseInt(employeeId)
        });
      }
    });

    setConflicts(detectedConflicts);
  }, [employees, calculateHours]);

  // CRUD operations
  const addShift = useCallback(async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newShift: Shift = {
        ...shiftData,
        id: shifts.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setShifts(prev => [...prev, newShift]);
      detectConflicts([...shifts, newShift]);

      toast({
        title: 'Succès',
        description: 'Shift ajouté avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'ajout du shift',
        variant: 'destructive'
      });
    }
  }, [shifts, detectConflicts, toast]);

  const updateShift = useCallback(async (shiftId: number, updates: Partial<Shift>) => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setShifts(prev => prev.map(shift => 
        shift.id === shiftId ? { ...shift, ...updates, updatedAt: new Date().toISOString() } : shift
      ));

      detectConflicts(shifts.map(shift => 
        shift.id === shiftId ? { ...shift, ...updates } : shift
      ));

      toast({
        title: 'Succès',
        description: 'Shift mis à jour avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du shift',
        variant: 'destructive'
      });
    }
  }, [shifts, detectConflicts, toast]);

  const deleteShift = useCallback(async (shiftId: number) => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setShifts(prev => prev.filter(shift => shift.id !== shiftId));
      detectConflicts(shifts.filter(shift => shift.id !== shiftId));

      toast({
        title: 'Succès',
        description: 'Shift supprimé avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression du shift',
        variant: 'destructive'
      });
    }
  }, [shifts, detectConflicts, toast]);

  const bulkUpdateShifts = useCallback(async (updates: Partial<Shift>) => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setShifts(prev => prev.map(shift => 
        selectedShifts.includes(shift.id) ? 
          { ...shift, ...updates, updatedAt: new Date().toISOString() } : shift
      ));

      detectConflicts(shifts.map(shift => 
        selectedShifts.includes(shift.id) ? { ...shift, ...updates } : shift
      ));

      setSelectedShifts([]);
      setShowBulkActions(false);

      toast({
        title: 'Succès',
        description: `${selectedShifts.length} shifts mis à jour`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour des shifts',
        variant: 'destructive'
      });
    }
  }, [selectedShifts, shifts, detectConflicts, toast]);

  const generateAutoSchedule = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, shifts: true }));

      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const weekDates = getWeekDates(selectedWeek);
      const newShifts: Shift[] = [];

      // Simple auto-scheduling logic (in a real app this would be more sophisticated)
      employees.forEach(employee => {
        if (employee.status !== 'active') return;

        const daysAvailable = employee.availableDays || 
          ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

        daysAvailable.forEach(day => {
          const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].indexOf(day);
          if (dayIndex === -1) return;

          const date = weekDates[dayIndex];
          const startHour = 8 + Math.floor(Math.random() * 4);

          newShifts.push({
            id: shifts.length + newShifts.length + 1,
            employeeId: employee.id,
            date: date.toISOString().split('T')[0],
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${(startHour + 8).toString().padStart(2, '0')}:00`,
            position: employee.position,
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      });

      setShifts(prev => [...prev, ...newShifts]);
      detectConflicts([...shifts, ...newShifts]);

      toast({
        title: 'Planning généré',
        description: `${newShifts.length} nouveaux shifts créés`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la génération automatique',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({ ...prev, shifts: false }));
    }
  }, [selectedWeek, employees, shifts, getWeekDates, detectConflicts, toast]);

  const sendShiftNotifications = useCallback(async () => {
    try {
      setIsSendingNotifications(true);

      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Notifications envoyées',
        description: `Les employés ont été notifiés de leurs shifts`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'envoi des notifications',
        variant: 'destructive'
      });
    } finally {
      setIsSendingNotifications(false);
    }
  }, [toast]);

  // Effects
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchShifts();
    }
  }, [selectedWeek, employees, fetchShifts]);

  useEffect(() => {
    if (shifts.length > 0 && employees.length > 0) {
      fetchAnalytics();
    }
  }, [shifts, employees, fetchAnalytics]);

  // Components
  const ShiftCard = React.memo(({ 
    shift, 
    onSelect,
    isSelected
  }: { 
    shift: Shift;
    onSelect: (id: number) => void;
    isSelected: boolean;
  }) => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const hours = calculateHours(shift.startTime, shift.endTime);
    const shiftConflicts = conflicts.filter(c => c.shiftId === shift.id);

    return (
      <Card 
        className={`mb-2 p-3 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-amber-500' : ''} ${
          shiftConflicts.length > 0 ? 'border-red-500' : ''
        }`}
        onClick={() => onSelect(shift.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {employee?.avatar ? (
                <img 
                  src={employee.avatar} 
                  alt={employee.firstName} 
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu'}
              </span>
              <Badge 
                variant={
                  shift.status === 'confirmed' ? 'default' :
                  shift.status === 'completed' ? 'secondary' : 
                  shift.status === 'published' ? 'outline' : 'destructive'
                }
                className="text-xs"
              >
                {shift.status === 'published' ? 'publié' : 
                 shift.status === 'confirmed' ? 'confirmé' :
                 shift.status === 'completed' ? 'terminé' : 'brouillon'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {shift.startTime} - {shift.endTime} ({hours.toFixed(1)}h)
            </div>
            <div className="text-xs text-muted-foreground">
              {shift.position}
            </div>
            {shift.notes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-blue-500 mt-1 truncate">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {shift.notes}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {shift.notes}
                </TooltipContent>
              </Tooltip>
            )}
            {shiftConflicts.length > 0 && (
              <div className="flex items-center mt-1 text-xs text-red-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {shiftConflicts[0].message}
              </div>
            )}
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateShift(shift.id, { 
                  status: shift.status === 'published' ? 'confirmed' : 'published'
                });
              }}
            >
              {shift.status === 'published' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteShift(shift.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  });

  const EmployeeCard = React.memo(({ employee }: { employee: Employee }) => {
    const weeklyHours = getEmployeeWeeklyHours(employee.id);
    const isOvertime = weeklyHours > employee.maxHours;
    const isUnderMin = weeklyHours < employee.minHours;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              {employee.avatar ? (
                <img 
                  src={employee.avatar} 
                  alt={employee.firstName} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-base">
                  {employee.firstName} {employee.lastName}
                </CardTitle>
                <CardDescription>{employee.position}</CardDescription>
              </div>
            </div>
            <Badge variant={
              isOvertime ? 'destructive' : 
              isUnderMin ? 'warning' : 'default'
            }>
              {weeklyHours.toFixed(1)}h
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">Département:</span> {employee.department}
            </div>
            <div className="text-xs">
              <span className="font-medium">Compétences:</span> {employee.skills.join(', ')}
            </div>
            <div className="text-xs">
              <span className="font-medium">Disponibilités:</span> {employee.availableDays.join(', ')}
            </div>
            <div className="pt-2">
              <Progress 
                value={Math.min(weeklyHours, employee.maxHours) / employee.maxHours * 100} 
                indicatorClassName={
                  isOvertime ? 'bg-red-500' : 
                  isUnderMin ? 'bg-yellow-500' : 'bg-green-500'
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0h</span>
                <span>{employee.maxHours}h</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowAddShift(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un shift
          </Button>
        </CardFooter>
      </Card>
    );
  });

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planning du Personnel</h2>
          <p className="text-muted-foreground">
            Gestion avancée des horaires et de l'affectation du personnel
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={generateAutoSchedule} disabled={isLoading.shifts}>
            <RotateCw className={`h-4 w-4 mr-2 ${isLoading.shifts ? 'animate-spin' : ''}`} />
            Auto-Planning
          </Button>
          <Button onClick={() => setShowAddShift(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Créneau
          </Button>
          <Button 
            variant="secondary" 
            onClick={sendShiftNotifications}
            disabled={isSendingNotifications}
          >
            <Mail className={`h-4 w-4 mr-2 ${isSendingNotifications ? 'animate-pulse' : ''}`} />
            Notifier
          </Button>
        </div>
      </div>

      {/* Navigation semaine */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                Semaine du {selectedWeek.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
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
                ← Précédente
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
                Suivante →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="px-2 py-0.5">Confirmé</Badge>
                <Badge variant="secondary" className="px-2 py-0.5">Terminé</Badge>
                <Badge variant="outline" className="px-2 py-0.5">Publié</Badge>
                <Badge variant="destructive" className="px-2 py-0.5">Brouillon</Badge>
              </div>
            </div>
            {selectedShifts.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedShifts.length} sélectionné(s)
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => bulkUpdateShifts({ status: 'confirmed' })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => bulkUpdateShifts({ status: 'published' })}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Publier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedShifts([]);
                    setShowBulkActions(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Employés
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="h-4 w-4 mr-2" />
            Analytiques
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Conflits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-0">
              {isLoading.shifts ? (
                <div className="p-6">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-0">
                  {/* Header avec heures */}
                  <div className="sticky top-0 z-10 bg-background p-2 border-r font-medium text-sm">
                    Heures
                  </div>
                  {getWeekDates(selectedWeek).map((date, index) => (
                    <div 
                      key={index} 
                      className="sticky top-0 z-10 bg-background p-2 text-center font-medium text-sm border-b"
                    >
                      <div>{weekDays[index]}</div>
                      <div className="text-muted-foreground">{date.getDate()}</div>
                    </div>
                  ))}

                  {/* Grille des créneaux */}
                  {timeSlots.map(timeSlot => (
                    <React.Fragment key={timeSlot}>
                      <div className="sticky left-0 z-10 bg-background p-2 text-muted-foreground text-xs border-r border-t">
                        {timeSlot}
                      </div>
                      {getWeekDates(selectedWeek).map((date, dayIndex) => {
                        const dayShifts = getShiftsForDay(date);
                        const timeShifts = dayShifts.filter(shift => 
                          shift.startTime <= timeSlot && shift.endTime > timeSlot
                        );

                        return (
                          <div 
                            key={`${timeSlot}-${dayIndex}`} 
                            className="min-h-[60px] border-t p-1"
                          >
                            {timeShifts.map(shift => {
                              const employee = employees.find(emp => emp.id === shift.employeeId);
                              return (
                                <Tooltip key={shift.id}>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className={`text-xs rounded p-1 mb-1 cursor-pointer ${
                                        shift.status === 'confirmed' ? 'bg-green-100 text-green-900' :
                                        shift.status === 'completed' ? 'bg-gray-100 text-gray-900' :
                                        shift.status === 'published' ? 'bg-blue-100 text-blue-900' :
                                        'bg-red-100 text-red-900'
                                      }`}
                                      onClick={() => setSelectedShifts(prev => 
                                        prev.includes(shift.id) ? 
                                        prev.filter(id => id !== shift.id) : 
                                        [...prev, shift.id]
                                      )}
                                    >
                                      <div className="font-medium truncate">
                                        {employee ? `${employee.firstName} ${employee.lastName.charAt(0)}.` : 'Employé'}
                                      </div>
                                      <div className="text-muted-foreground truncate">
                                        {shift.position}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu'}
                                      </div>
                                      <div>
                                        {shift.startTime} - {shift.endTime} (
                                        {calculateHours(shift.startTime, shift.endTime).toFixed(1)}h)
                                      </div>
                                      <div>{shift.position}</div>
                                      {shift.notes && (
                                        <div className="text-blue-600">Note: {shift.notes}</div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading.employees ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              filteredEmployees.map(employee => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {isLoading.analytics ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
            </div>
          ) : analytics ? (
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
                        {analytics.totalHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nombre d'employés actifs:</span>
                      <span className="font-semibold">{employees.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Créneaux confirmés:</span>
                      <span className="font-semibold">
                        {analytics.statusDistribution.confirmed || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moyenne heures/employé:</span>
                      <span className="font-semibold">
                        {analytics.avgHoursPerEmployee.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conflits détectés:</span>
                      <span className="font-semibold">
                        {analytics.conflictsCount}
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
                  <div className="space-y-4">
                    {Object.entries(analytics.positionsDistribution).map(([position, count]) => (
                      <div key={position} className="space-y-1">
                        <div className="flex justify-between">
                          <span>{position}:</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <Progress 
                          value={count / shifts.length * 100} 
                          className="h-2"
                          indicatorClassName="bg-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Analytiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              </CardContent>
            </Card>
          )}
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
              {conflicts.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700">Aucun conflit détecté</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((conflict, i) => {
                    const employee = employees.find(e => e.id === conflict.employeeId);
                    const shift = shifts.find(s => s.id === conflict.shiftId);

                    return (
                      <Card 
                        key={i} 
                        className={`border-l-4 ${
                          conflict.severity === 'error' ? 'border-l-red-500' : 'border-l-yellow-500'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${
                              conflict.severity === 'error' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-500'
                            }`}>
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{conflict.message}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {employee && (
                                  <span>Employé: {employee.firstName} {employee.lastName}</span>
                                )}
                                {shift && (
                                  <span>
                                    {employee && ' • '}
                                    Shift: {shift.date} {shift.startTime}-{shift.endTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (shift) {
                                  setSelectedShifts([shift.id]);
                                }
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Shift Dialog */}
      <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
            <DialogDescription>
              Planifiez un nouveau créneau de travail
            </DialogDescription>
          </DialogHeader>
          <AddShiftForm 
            onSubmit={(data) => {
              addShift(data);
              setShowAddShift(false);
            }} 
            employees={employees} 
            weekDates={getWeekDates(selectedWeek)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const AddShiftForm = ({ 
  onSubmit, 
  employees,
  weekDates
}: { 
  onSubmit: (data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => void;
  employees: Employee[];
  weekDates: Date[];
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: weekDates[0].toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    position: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      employeeId: Number(formData.employeeId),
      status: 'draft'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employé</Label>
        <Select 
          value={formData.employeeId} 
          onValueChange={(value) => {
            setFormData(prev => {
              const employee = employees.find(e => e.id === Number(value));
              return {
                ...prev,
                employeeId: value,
                position: employee?.position || ''
              };
            });
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un employé" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {employees.filter(e => e.status === 'active').map(emp => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  <div className="flex items-center space-x-2">
                    {emp.avatar ? (
                      <img 
                        src={emp.avatar} 
                        alt={emp.firstName} 
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                    <span>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Select
            value={formData.date}
            onValueChange={(value) => setFormData({ ...formData, date: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekDates.map(date => (
                <SelectItem 
                  key={date.toISOString()} 
                  value={date.toISOString().split('T')[0]}
                >
                  {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Position</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => setFormData({ ...formData, position: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Serveur">Serveur</SelectItem>
              <SelectItem value="Barista">Barista</SelectItem>
              <SelectItem value="Cuisinier">Cuisinier</SelectItem>
              <SelectItem value="Caissier">Caissier</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        <Label>Notes (optionnel)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes ou instructions particulières..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => onSubmit({
            ...formData,
            employeeId: Number(formData.employeeId),
            status: 'draft'
          })}
        >
          Enregistrer brouillon
        </Button>
        <Button type="submit">
          Publier le shift
        </Button>
      </div>
    </form>
  );
};