import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, Plus, Edit, Trash2, AlertTriangle, 
  Coffee, Wifi, Printer, Calendar, BarChart2, Filter,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MaintenanceTaskForm } from './MaintenanceTaskForm';
import { EquipmentForm } from './EquipmentForm';
import { toast } from 'sonner';

// Calendar functionality simplified without external dependencies

// Configuration du calendrier - composant simplifié
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    status: string;
    priority: string;
    assignedTo: string;
  };
}

export interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  equipment: string;
  equipmentId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  assignedToId: number;
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number; // en heures
  cost: number;
  notes?: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  location: string;
  status: 'operational' | 'maintenance' | 'out_of_order';
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceFrequency: number; // en jours
  warrantyExpiry?: string;
  purchaseDate: string;
  vendor: string;
}

export interface Technician {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

interface MaintenanceStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedThisMonth: number;
  overdueTasks: number;
  totalCost: number;
  equipmentCount: number;
  operationalEquipment: number;
  maintenanceEquipment: number;
  outOfOrderEquipment: number;
}

export default function MaintenanceManagement() : JSX.Element {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [tasksRes, equipmentRes, statsRes, techniciansRes] = await Promise.all([
        fetch('/api/admin/maintenance/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/equipment', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/technicians', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tasksRes.ok && equipmentRes.ok && statsRes.ok && techniciansRes.ok) {
        const [tasksData, equipmentData, statsData, techniciansData] = await Promise.all([
          tasksRes.json(),
          equipmentRes.json(),
          statsRes.json(),
          techniciansRes.json()
        ]);

        setTasks(tasksData);
        setEquipment(equipmentData);
        setStats(statsData);
        setTechnicians(techniciansData);
      } else {
        throw new Error('Erreur lors de la récupération des données');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la maintenance:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Omit<MaintenanceTask, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/maintenance/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        toast.success('Tâche créée avec succès');
        setIsTaskDialogOpen(false);
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de la tâche');
    }
  };

  const handleUpdateTask = async (taskId: number, taskData: Partial<MaintenanceTask>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
        toast.success('Tâche mise à jour avec succès');
        setIsTaskDialogOpen(false);
        setEditingTask(null);
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId));
        toast.success('Tâche supprimée avec succès');
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    }
  };

  const handleCreateEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/maintenance/equipment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(equipmentData)
      });

      if (response.ok) {
        const newEquipment = await response.json();
        setEquipment([...equipment, newEquipment]);
        toast.success('Équipement créé avec succès');
        setIsEquipmentDialogOpen(false);
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de l\'équipement');
    }
  };

  const handleUpdateEquipment = async (equipmentId: number, equipmentData: Partial<Equipment>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/equipment/${equipmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(equipmentData)
      });

      if (response.ok) {
        const updatedEquipment = await response.json();
        setEquipment(equipment.map(item => item.id === equipmentId ? updatedEquipment : item));
        toast.success('Équipement mis à jour avec succès');
        setIsEquipmentDialogOpen(false);
        setEditingEquipment(null);
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour de l\'équipement');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completedDate: new Date().toISOString() })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
        toast.success('Tâche marquée comme terminée');
        fetchMaintenanceData(); // Rafraîchir les stats
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  // Fonctions utilitaires pour les styles et textes
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'out_of_order': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Inconnue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const getEquipmentStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'Maintenance';
      case 'out_of_order': return 'Hors service';
      default: return 'Inconnu';
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'machine à café': return <Coffee className="h-5 w-5" />;
      case 'four': return <Wrench className="h-5 w-5" />;
      case 'réfrigérateur': return <Wrench className="h-5 w-5" />;
      case 'réseau': return <Wifi className="h-5 w-5" />;
      case 'imprimante': return <Printer className="h-5 w-5" />;
      default: return <Wrench className="h-5 w-5" />;
    }
  };

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesEquipment = selectedEquipment === 'all' || task.equipmentId.toString() === selectedEquipment;
    const matchesTechnician = selectedTechnician === 'all' || task.assignedToId.toString() === selectedTechnician;

    return matchesSearch && matchesStatus && matchesPriority && matchesEquipment && matchesTechnician;
  });

  // Préparation des événements pour le calendrier
  const calendarEvents: CalendarEvent[] = tasks.map(task => ({
    id: task.id,
    title: `${task.title} (${task.equipment})`,
    start: new Date(task.scheduledDate),
    end: new Date(new Date(task.scheduledDate).getTime() + (task.estimatedDuration * 60 * 60 * 1000)),
    resource: {
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo
    }
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion de la Maintenance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi des équipements et tâches de maintenance
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? 'Modifier la Tâche' : 'Créer une Nouvelle Tâche'}
                  </DialogTitle>
                </DialogHeader>
                <MaintenanceTaskForm 
                  equipmentList={equipment}
                  technicians={technicians}
                  initialData={editingTask ? {
                    ...editingTask,
                    equipmentId: editingTask.equipmentId || null
                  } : undefined}
                  onSubmit={editingTask ? 
                    (data: Omit<MaintenanceTask, 'id'>) => handleUpdateTask(editingTask.id, data as any) : 
                    handleCreateTask}
                  onCancel={() => {
                    setIsTaskDialogOpen(false);
                    setEditingTask(null);
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Équipement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEquipment ? 'Modifier l\'Équipement' : 'Ajouter un Nouvel Équipement'}
                  </DialogTitle>
                </DialogHeader>
                <EquipmentForm 
                  initialData={editingEquipment}
                  onSubmit={editingEquipment ? 
                    (data) => handleUpdateEquipment(editingEquipment.id, data) : 
                    handleCreateEquipment}
                  onCancel={() => {
                    setIsEquipmentDialogOpen(false);
                    setEditingEquipment(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Tâches
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalTasks}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.completedThisMonth} terminées ce mois
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tâches en Cours
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingTasks + stats.inProgressTasks}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.pendingTasks} en attente, {stats.inProgressTasks} en cours
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Équipements
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.equipmentCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.operationalEquipment} opérationnels, {stats.maintenanceEquipment} en maintenance
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Coût Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCost.toFixed(2)}€
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.overdueTasks} tâches en retard
                  </p>
                </div>
                <BarChart2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="equipment">Équipements</TabsTrigger>
          <TabsTrigger value="schedule">Planning</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous équipements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous équipements</SelectItem>
                  {equipment.map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous techniciens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous techniciens</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant={currentView === 'list' ? 'default' : 'outline'} 
                onClick={() => setCurrentView('list')}
              >
                Liste
              </Button>
              <Button 
                variant={currentView === 'calendar' ? 'default' : 'outline'} 
                onClick={() => setCurrentView('calendar')}
              >
                Calendrier
              </Button>
            </div>
          </div>

          {currentView === 'list' ? (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune tâche ne correspond aux critères sélectionnés
                  </p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                            task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20' :
                            'bg-yellow-100 dark:bg-yellow-900/20'
                          }`}>
                            <Wrench className={`h-6 w-6 ${
                              task.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                              task.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            }`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {task.title}
                              </h3>
                              <Badge className={getStatusColor(task.status)}>
                                {getStatusText(task.status)}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {getPriorityText(task.priority)}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {task.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Équipement:</span>
                                <p className="font-medium">{task.equipment}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Assigné à:</span>
                                <p className="font-medium">{task.assignedTo}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Date prévue:</span>
                                <p className="font-medium">
                                  {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Coût:</span>
                                <p className="font-medium text-green-600">{task.cost.toFixed(2)}€</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteTask(task.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Terminer
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setIsTaskDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="h-[600px] mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vue Calendrier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {calendarEvents.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Aucun événement de maintenance planifié
                      </p>
                    ) : (
                      calendarEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-600">
                              {event.start.toLocaleDateString('fr-FR')} à {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {event.resource && (
                              <p className="text-sm text-gray-500">
                                Assigné à: {event.resource.assignedTo}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.resource && (
                              <Badge 
                                className={
                                  event.resource.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  event.resource.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  event.resource.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }
                              >
                                {getPriorityText(event.resource.priority)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        {getEquipmentIcon(item.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type} • {item.model}
                        </p>
                      </div>
                    </div>
                    <Badge className={getEquipmentStatusColor(item.status)}>
                      {getEquipmentStatusText(item.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">N° de série:</span>
                      <p className="font-medium">{item.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Emplacement:</span>
                      <p className="font-medium">{item.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Dernière maintenance:</span>
                      <p className="font-medium">
                        {new Date(item.lastMaintenance).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Prochaine maintenance:</span>
                      <p className="font-medium">
                        {new Date(item.nextMaintenance).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {item.warrantyExpiry && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Garantie jusqu'au:</span>
                        <p className="font-medium">
                          {new Date(item.warrantyExpiry).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setEditingTask({
                          id: 0,
                          title: `Maintenance ${item.name}`,
                          description: `Maintenance préventive pour ${item.name}`,
                          equipment: item.name,
                          equipmentId: item.id,
                          priority: 'medium',
                          status: 'pending',
                          assignedTo: '',
                          assignedToId: 0,
                          scheduledDate: item.nextMaintenance,
                          estimatedDuration: 2,
                          cost: 0,
                          notes: ''
                        });
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      Programmer Maintenance
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingEquipment(item);
                        setIsEquipmentDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Maintenance Programmée</CardTitle>
                  <Calendar className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks
                    .filter(task => task.status === 'pending')
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                    .slice(0, 5)
                    .map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.equipment}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                          </p>
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Maintenance en Retard</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment
                    .filter(item => new Date(item.nextMaintenance) < new Date() && item.status !== 'out_of_order')
                    .map(item => (
                      <div key={item.id} className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">{item.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.location}</p>
                        <p className="text-sm font-medium text-yellow-600">
                          Maintenance prévue: {new Date(item.nextMaintenance).toLocaleDateString('fr-FR')}
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => {
                            setEditingTask({
                              id: 0,
                              title: `Maintenance ${item.name}`,
                              description: `Maintenance en retard pour ${item.name}`,
                              equipment: item.name,
                              equipmentId: item.id,
                              priority: 'high',
                              status: 'pending',
                              assignedTo: '',
                              assignedToId: 0,
                              scheduledDate: new Date().toISOString(),
                              estimatedDuration: 2,
                              cost: 0,
                              notes: ''
                            });
                            setIsTaskDialogOpen(true);
                          }}
                        >
                          Programmer Maintenance
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['pending', 'in_progress', 'completed', 'cancelled'].map(status => {
                    const statusTasks = tasks.filter(t => t.status === status);
                    const percentage = tasks.length > 0 ? (statusTasks.length / tasks.length) * 100 : 0;

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
                        <div className="text-right">
                          <p className="font-semibold">{statusTasks.length} tâches</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {percentage.toFixed(1)}%
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
                <CardTitle>Coûts de Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Coût moyen par tâche:</span>
                    <span className="font-semibold">
                      {tasks.length > 0 
                        ? (tasks.reduce((sum, t) => sum + t.cost, 0) / tasks.length).toFixed(2)
                        : 0}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tâches urgentes:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {tasks.filter(t => t.priority === 'urgent').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Équipements en panne:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {equipment.filter(e => e.status === 'out_of_order').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de completion:</span>
                    <span className="font-semibold">
                      {tasks.length > 0 
                        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
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