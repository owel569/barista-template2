import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  User,
  FileText,
  Zap,
  Settings
} from 'lucide-react';

interface MaintenanceSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function MaintenanceSystem({ userRole = 'directeur' }: MaintenanceSystemProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tâches de maintenance factices
  const maintenanceTasks = [
    {
      id: 1,
      title: 'Nettoyage machine à café principale',
      description: 'Nettoyage complet et détartrage de la machine à café Delonghi',
      priority: 'haute',
      status: 'planifie',
      assignee: 'Alice Johnson',
      scheduledDate: '2025-07-12',
      estimatedDuration: 120,
      category: 'equipement',
      lastMaintenance: '2025-06-12',
      nextMaintenance: '2025-08-12',
      cost: 50.00,
      notes: 'Prévoir descaling spécial et changement des filtres'
    },
    {
      id: 2,
      title: 'Vérification système POS',
      description: 'Mise à jour logiciel et vérification des connexions',
      priority: 'moyenne',
      status: 'en_cours',
      assignee: 'Bob Smith',
      scheduledDate: '2025-07-10',
      estimatedDuration: 60,
      category: 'technologie',
      lastMaintenance: '2025-06-01',
      nextMaintenance: '2025-08-01',
      cost: 0.00,
      notes: 'Sauvegarde des données avant mise à jour',
      progress: 65
    },
    {
      id: 3,
      title: 'Maintenance climatisation',
      description: 'Changement des filtres et vérification du système',
      priority: 'moyenne',
      status: 'termine',
      assignee: 'Claire Davis',
      scheduledDate: '2025-07-08',
      estimatedDuration: 90,
      category: 'infrastructure',
      lastMaintenance: '2025-07-08',
      nextMaintenance: '2025-10-08',
      cost: 120.00,
      notes: 'Filtres changés, système vérifié - tout fonctionne'
    },
    {
      id: 4,
      title: 'Réparation frigo vitrine',
      description: 'Problème de température, vérification compresseur',
      priority: 'urgente',
      status: 'planifie',
      assignee: 'David Wilson',
      scheduledDate: '2025-07-11',
      estimatedDuration: 180,
      category: 'equipement',
      lastMaintenance: '2025-05-15',
      nextMaintenance: '2025-08-15',
      cost: 200.00,
      notes: 'Température instable depuis 2 jours'
    }
  ];

  const equipmentList = [
    {
      id: 1,
      name: 'Machine à café Delonghi',
      status: 'operationnel',
      lastMaintenance: '2025-06-12',
      nextMaintenance: '2025-08-12',
      maintenanceScore: 85,
      location: 'Bar principal'
    },
    {
      id: 2,
      name: 'Système POS',
      status: 'maintenance',
      lastMaintenance: '2025-06-01',
      nextMaintenance: '2025-08-01',
      maintenanceScore: 90,
      location: 'Caisse'
    },
    {
      id: 3,
      name: 'Climatisation',
      status: 'operationnel',
      lastMaintenance: '2025-07-08',
      nextMaintenance: '2025-10-08',
      maintenanceScore: 95,
      location: 'Salle principale'
    },
    {
      id: 4,
      name: 'Frigo vitrine',
      status: 'alerte',
      lastMaintenance: '2025-05-15',
      nextMaintenance: '2025-08-15',
      maintenanceScore: 45,
      location: 'Zone pâtisserie'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'destructive';
      case 'haute': return 'destructive';
      case 'moyenne': return 'secondary';
      case 'basse': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine': return 'default';
      case 'en_cours': return 'secondary';
      case 'planifie': return 'outline';
      case 'reporte': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'termine': return <CheckCircle className="h-4 w-4" />;
      case 'en_cours': return <Play className="h-4 w-4" />;
      case 'planifie': return <Clock className="h-4 w-4" />;
      case 'reporte': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operationnel': return 'default';
      case 'maintenance': return 'secondary';
      case 'alerte': return 'destructive';
      case 'panne': return 'destructive';
      default: return 'secondary';
    }
  };

  const renderTasksList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tâches de maintenance</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une tâche de maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input id="title" placeholder="Titre de la tâche" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Description détaillée" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipement">Équipement</SelectItem>
                      <SelectItem value="technologie">Technologie</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignee">Assigné à</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alice">Alice Johnson</SelectItem>
                      <SelectItem value="bob">Bob Smith</SelectItem>
                      <SelectItem value="claire">Claire Davis</SelectItem>
                      <SelectItem value="david">David Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Date prévue</Label>
                  <Input id="scheduledDate" type="date" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  setIsCreateDialogOpen(false);
                  toast({ title: 'Tâche créée avec succès' });
                }}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {maintenanceTasks.map(task => (
          <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{task.title}</h4>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status)} className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      {task.status === 'termine' ? 'Terminé' : 
                       task.status === 'en_cours' ? 'En cours' : 
                       task.status === 'planifie' ? 'Planifié' : 'Reporté'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.estimatedDuration}min
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      {task.cost.toFixed(2)}€
                    </div>
                  </div>

                  {task.status === 'en_cours' && task.progress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} />
                    </div>
                  )}

                  {task.notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <FileText className="h-3 w-3 inline mr-1" />
                      {task.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {task.status === 'planifie' && (
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {task.status === 'en_cours' && (
                    <Button variant="ghost" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEquipmentList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">État des équipements</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter équipement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipmentList.map(equipment => (
          <Card key={equipment.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{equipment.name}</h4>
                  <p className="text-sm text-muted-foreground">{equipment.location}</p>
                </div>
                <Badge variant={getEquipmentStatusColor(equipment.status)}>
                  {equipment.status === 'operationnel' ? 'Opérationnel' :
                   equipment.status === 'maintenance' ? 'Maintenance' :
                   equipment.status === 'alerte' ? 'Alerte' : 'Panne'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score de maintenance</span>
                  <span className={equipment.maintenanceScore > 80 ? 'text-green-600' : 
                                 equipment.maintenanceScore > 60 ? 'text-orange-600' : 'text-red-600'}>
                    {equipment.maintenanceScore}%
                  </span>
                </div>
                <Progress value={equipment.maintenanceScore} />

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Dernière maintenance: {new Date(equipment.lastMaintenance).toLocaleDateString('fr-FR')}</div>
                  <div>Prochaine maintenance: {new Date(equipment.nextMaintenance).toLocaleDateString('fr-FR')}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Wrench className="mr-1 h-3 w-3" />
                    Maintenir
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="mr-1 h-3 w-3" />
                    Configurer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Statistiques de maintenance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches en cours</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Play className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches planifiées</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût mensuel</p>
                <p className="text-2xl font-bold">1,250€</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
                <p className="text-2xl font-bold">2.5h</p>
              </div>
              <RotateCcw className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertes système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Frigo vitrine: température instable depuis 2 jours
              </AlertDescription>
            </Alert>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Machine à café: détartrage prévu dans 3 jours
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines maintenances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenanceTasks.filter(task => task.status === 'planifie').slice(0, 3).map(task => (
              <div key={task.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.assignee}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(task.scheduledDate).toLocaleDateString('fr-FR')}</p>
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Système de Maintenance</h2>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {maintenanceTasks.filter(t => t.status === 'en_cours').length} tâches actives
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <Button 
          variant={activeTab === 'tasks' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tasks')}
        >
          Tâches
        </Button>
        <Button 
          variant={activeTab === 'equipment' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('equipment')}
        >
          Équipements
        </Button>
        <Button 
          variant={activeTab === 'statistics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('statistics')}
        >
          Statistiques
        </Button>
      </div>

      {activeTab === 'tasks' && renderTasksList()}
      {activeTab === 'equipment' && renderEquipmentList()}
      {activeTab === 'statistics' && renderStatistics()}
    </div>
  );
}