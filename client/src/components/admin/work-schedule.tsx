import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui';
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

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
      const headers = { Authorization: `Bearer ${token}` };

      const [employeesRes, shiftsRes, statsRes] = await Promise.all([
        fetch('/api/admin/employees', { headers }),
        fetch(`/api/admin/work-shifts?week=${currentWeek.toISOString()}`, { headers }),
        fetch('/api/admin/work-shifts/stats', { headers }),
      ]);

      if (employeesRes.ok && shiftsRes.ok && statsRes.ok) {
        const [employeesData, shiftsData, statsData] = await Promise.all([
          employeesRes.json(),
          shiftsRes.json(),
          statsRes.json(),
        ]);
        setEmployees(employeesData);
        setShifts(shiftsData);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (dir: 'prev' | 'next') => {
    const updated = new Date(currentWeek);
    updated.setDate(currentWeek.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentWeek(updated);
  };

  const getWeekDays = (refDate: Date) => {
    const base = new Date(refDate);
    const start = base.getDate() - base.getDay() + (base.getDay() === 0 ? -6 : 1);
    base.setDate(start);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(currentWeek);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Planning de Travail</h2>
          <p className="text-gray-500">Horaires et employés</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau créneau
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Calendar className="w-8 h-8 text-blue-500" />} title="Total Créneaux" value={stats.totalShifts} />
          <StatCard icon={<Clock className="w-8 h-8 text-green-500" />} title="Total Heures" value={`${stats.totalHours}h`} />
          <StatCard icon={<Users className="w-8 h-8 text-purple-500" />} title="Employés Actifs" value={stats.employeesScheduled} />
          <StatCard icon={<Calendar className="w-8 h-8 text-orange-500" />} title="Cette Semaine" value={stats.shiftsThisWeek} />
        </div>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="shifts">Créneaux</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        {/* Tu peux isoler les vues suivantes dans des composants : */}
        <TabsContent value="calendar">
          {/* <WeekCalendarView ... /> */}
        </TabsContent>

        <TabsContent value="shifts">
          {/* <ShiftListView ... /> */}
        </TabsContent>

        <TabsContent value="employees">
          {/* <EmployeeOverview ... /> */}
        </TabsContent>

        <TabsContent value="analytics">
          {/* <ShiftAnalytics ... /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
