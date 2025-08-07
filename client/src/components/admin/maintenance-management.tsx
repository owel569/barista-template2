import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Coffee, Wifi
} from 'lucide-react';

interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  equipment: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  notes?: string;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'operational' | 'maintenance' | 'out_of_order';
  lastMaintenance: string;
  nextMaintenance: string;
  warrantyExpiry?: string;
}

interface MaintenanceStats {
  totalTasks: number;
  pendingTasks: number;
  completedThisMonth: number;
  totalCost: number;
}

export default function MaintenanceManagement() : JSX.Element {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [tasksRes, equipmentRes, statsRes] = await Promise.all([
        fetch('/api/admin/maintenance/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })]),
        fetch('/api/admin/maintenance/equipment', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tasksRes.ok && equipmentRes.ok && statsRes.ok) {
        const [tasksData, equipmentData, statsData] = await Promise.all([
          tasksRes.json()]),
          equipmentRes.json(),
          statsRes.json()
        ]);
        
        setTasks(tasksData);
        setEquipment(equipmentData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'out_of_order':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
    switch (type) {
      case 'Machine à café':
        return <Coffee className="h-5 w-5" />;
      case 'Four':
        return <Wrench className="h-5 w-5" />;
      case 'Réfrigérateur':
        return <Wrench className="h-5 w-5" />;
      case 'Réseau':
        return <Wifi className="h-5 w-5" />;
      default:
        return <Wrench className="h-5 w-5" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase()}).includes(searchTerm.toLowerCase()) ||
                         task.equipment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
            Gestion de la Maintenance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi des équipements et tâches de maintenance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher une tâche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Tâche
          </Button>
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
                    {stats.totalTasks)}
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
                    En Attente
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingTasks}
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
                    Terminées ce Mois
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedThisMonth}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
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
                </div>
                <Wrench className="h-8 w-8 text-purple-500" />
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
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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

        <TabsContent value="equipment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
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
                          {item.type}
                        </p>
                      </div>
                    </div>
                    <Badge className={getEquipmentStatusColor(item.status)}>
                      {getEquipmentStatusText(item.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
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
                    <Button size="sm" variant="outline" className="flex-1">
                      Programmer Maintenance
                    </Button>
                    <Button size="sm" variant="outline">
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
                <CardTitle>Maintenance Programmée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks
                    .filter(task => task.status === 'pending')
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                    .slice(0, 5)
                    .map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                <CardTitle>Maintenance en Retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment
                    .filter(item => new Date(item.nextMaintenance) < new Date())
                    .map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <h4 className="font-semibold text-red-800 dark:text-red-200">{item.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.location}</p>
                        <p className="text-sm font-medium text-red-600">
                          Maintenance prévue: {new Date(item.nextMaintenance).toLocaleDateString('fr-FR')}
                        </p>
                        <Button size="sm" className="w-full mt-2">
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
                  {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => {
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