import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Calendar,
  Users,
  Package,
  Zap,
  Coffee,
  Thermometer,
  Shield,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface MaintenanceSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function MaintenanceSystem({ userRole = 'directeur' }: MaintenanceSystemProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    equipment: '',
    priority: 'medium',
    type: 'preventive',
    scheduledDate: '',
    estimatedDuration: '',
    assignedTo: '',
    instructions: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données factices pour la maintenance
  const equipments = [
    {
      id: 1,
      name: 'Machine à café principale',
      type: 'coffee_machine',
      status: 'operational',
      lastMaintenance: '2025-07-01',
      nextMaintenance: '2025-07-15',
      maintenanceFrequency: 14,
      condition: 85,
      location: 'Bar principal',
      serialNumber: 'CM-2023-001',
      issues: 1
    },
    {
      id: 2,
      name: 'Réfrigérateur lait',
      type: 'refrigerator',
      status: 'warning',
      lastMaintenance: '2025-06-20',
      nextMaintenance: '2025-07-10',
      maintenanceFrequency: 30,
      condition: 70,
      location: 'Cuisine',
      serialNumber: 'RF-2023-002',
      issues: 2
    },
    {
      id: 3,
      name: 'Four à pâtisserie',
      type: 'oven',
      status: 'maintenance',
      lastMaintenance: '2025-07-08',
      nextMaintenance: '2025-08-08',
      maintenanceFrequency: 30,
      condition: 90,
      location: 'Cuisine',
      serialNumber: 'OV-2023-003',
      issues: 0
    },
    {
      id: 4,
      name: 'Système de ventilation',
      type: 'ventilation',
      status: 'operational',
      lastMaintenance: '2025-06-15',
      nextMaintenance: '2025-07-15',
      maintenanceFrequency: 30,
      condition: 75,
      location: 'Général',
      serialNumber: 'VT-2023-004',
      issues: 0
    }
  ];

  const maintenanceTasks = [
    {
      id: 1,
      title: 'Détartrage machine café',
      description: 'Nettoyage et détartrage complet de la machine principale',
      equipment: 'Machine à café principale',
      priority: 'high',
      type: 'preventive',
      status: 'scheduled',
      scheduledDate: '2025-07-15',
      estimatedDuration: '2 heures',
      assignedTo: 'Technicien Martin',
      progress: 0,
      instructions: 'Utiliser le produit de détartrage homologué. Suivre la procédure standard.',
      lastUpdated: '2025-07-09'
    },
    {
      id: 2,
      title: 'Réparation réfrigérateur',
      description: 'Vérification et réparation du système de refroidissement',
      equipment: 'Réfrigérateur lait',
      priority: 'high',
      type: 'corrective',
      status: 'in_progress',
      scheduledDate: '2025-07-10',
      estimatedDuration: '3 heures',
      assignedTo: 'Technicien Dubois',
      progress: 60,
      instructions: 'Remplacer le compresseur si nécessaire. Vérifier l\'étanchéité.',
      lastUpdated: '2025-07-09'
    },
    {
      id: 3,
      title: 'Entretien four',
      description: 'Maintenance préventive du four à pâtisserie',
      equipment: 'Four à pâtisserie',
      priority: 'medium',
      type: 'preventive',
      status: 'completed',
      scheduledDate: '2025-07-08',
      estimatedDuration: '1.5 heures',
      assignedTo: 'Technicien Laurent',
      progress: 100,
      instructions: 'Nettoyage des résistances et vérification des thermostats.',
      lastUpdated: '2025-07-08'
    },
    {
      id: 4,
      title: 'Nettoyage ventilation',
      description: 'Nettoyage des filtres et conduits de ventilation',
      equipment: 'Système de ventilation',
      priority: 'medium',
      type: 'preventive',
      status: 'scheduled',
      scheduledDate: '2025-07-15',
      estimatedDuration: '4 heures',
      assignedTo: 'Équipe nettoyage',
      progress: 0,
      instructions: 'Arrêter le système avant intervention. Changer tous les filtres.',
      lastUpdated: '2025-07-09'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'warning': return 'secondary';
      case 'maintenance': return 'destructive';
      case 'offline': return 'outline';
      default: return 'secondary';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'coffee_machine': return <Coffee className="h-4 w-4" />;
      case 'refrigerator': return <Thermometer className="h-4 w-4" />;
      case 'oven': return <Zap className="h-4 w-4" />;
      case 'ventilation': return <Shield className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return 'text-green-600';
    if (condition >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Équipements</p>
                <p className="text-2xl font-bold">{equipments.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches actives</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {maintenanceTasks.filter(t => t.status === 'scheduled' || t.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes</p>
                <p className="text-2xl font-bold text-red-600">
                  {equipments.filter(e => e.status === 'warning' || e.status === 'maintenance').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complétées</p>
                <p className="text-2xl font-bold text-green-600">
                  {maintenanceTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* État des équipements */}
      <Card>
        <CardHeader>
          <CardTitle>État des équipements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equipments.map(equipment => (
              <div key={equipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getEquipmentIcon(equipment.type)}
                  <div>
                    <div className="font-medium">{equipment.name}</div>
                    <div className="text-sm text-gray-600">
                      {equipment.location} • {equipment.serialNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`font-bold ${getConditionColor(equipment.condition)}`}>
                      {equipment.condition}%
                    </div>
                    <div className="text-xs text-gray-500">État</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{equipment.issues}</div>
                    <div className="text-xs text-gray-500">Problèmes</div>
                  </div>
                  <Badge variant={getStatusColor(equipment.status)}>
                    {equipment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tâches urgentes */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches urgentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceTasks
              .filter(task => task.priority === 'high' && task.status !== 'completed')
              .map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-600">
                        {task.equipment} • {task.assignedTo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-medium">{task.scheduledDate}</div>
                      <div className="text-xs text-gray-500">Échéance</div>
                    </div>
                    <Badge variant={getTaskStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEquipments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Équipements</h3>
        <Button onClick={() => setIsTaskDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid gap-4">
        {equipments.map(equipment => (
          <Card key={equipment.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getEquipmentIcon(equipment.type)}
                  <div>
                    <div className="font-medium text-lg">{equipment.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {equipment.location} • {equipment.serialNumber}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Dernière maintenance:</span> {equipment.lastMaintenance}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Prochaine:</span> {equipment.nextMaintenance}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConditionColor(equipment.condition)}`}>
                      {equipment.condition}%
                    </div>
                    <div className="text-xs text-gray-500">Condition</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{equipment.issues}</div>
                    <div className="text-xs text-gray-500">Problèmes</div>
                  </div>
                  <Badge variant={getStatusColor(equipment.status)}>
                    {equipment.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Condition générale</span>
                  <span>{equipment.condition}%</span>
                </div>
                <Progress value={equipment.condition} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tâches de maintenance</h3>
        <Button onClick={() => setIsTaskDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid gap-4">
        {maintenanceTasks.map(task => (
          <Card key={task.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="font-medium text-lg">{task.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.description}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Équipement:</span> {task.equipment}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Assigné à:</span> {task.assignedTo}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="text-sm">
                        <span className="text-gray-500">Programmé:</span> {task.scheduledDate}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Durée:</span> {task.estimatedDuration}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  <Badge variant={getTaskStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              {task.status === 'in_progress' && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">Système de Maintenance</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="equipments">Équipements</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="equipments" className="space-y-4">
          {renderEquipments()}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {renderTasks()}
        </TabsContent>
      </Tabs>

      {/* Dialog pour ajouter une tâche */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche de maintenance</DialogTitle>
            <DialogDescription>
              Créer une nouvelle tâche de maintenance pour un équipement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" placeholder="Titre de la tâche" />
              </div>
              <div>
                <Label htmlFor="equipment">Équipement *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map(eq => (
                      <SelectItem key={eq.id} value={eq.name}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de maintenance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Préventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduledDate">Date programmée</Label>
                <Input id="scheduledDate" type="date" />
              </div>
              <div>
                <Label htmlFor="estimatedDuration">Durée estimée</Label>
                <Input id="estimatedDuration" placeholder="ex: 2 heures" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Description de la tâche" />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" placeholder="Instructions spécifiques" />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsTaskDialogOpen(false)}>
                Créer la tâche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}