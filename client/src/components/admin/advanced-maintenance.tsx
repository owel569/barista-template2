import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wrench, AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2, 
  Coffee, Thermometer, Zap, Wifi, Settings, Calendar, DollarSign,
  FileText, Camera, MapPin, Star, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  equipmentId: number;
  equipmentName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
  images?: string[];
  duration?: number;
  category: 'preventive' | 'corrective' | 'emergency';
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  status: 'operational' | 'maintenance' | 'out_of_order' | 'retired';
  lastMaintenance?: string;
  nextMaintenance?: string;
  warrantyExpiry?: string;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  specifications: Record<string, any>;
  manualUrl?: string;
  maintenanceHistory: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRecord {
  id: number;
  taskId: number;
  description: string;
  date: string;
  technician: string;
  cost: number;
  duration: number;
  partsUsed: string[];
  notes?: string;
  images?: string[];
}

interface MaintenanceStats {
  totalEquipment: number;
  operationalEquipment: number;
  pendingTasks: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
  averageResolutionTime: number;
  uptime: number;
  criticalAlerts: number;
}

const taskSchema = z.object({
  title: z.string().min(3, "Titre requis (minimum 3 caractères)"),
  description: z.string().min(10, "Description requise (minimum 10 caractères)"),
  equipmentId: z.number().min(1, "Équipement requis"),
  priority: z.string().min(1, "Priorité requise"),
  assignedTo: z.string().min(2, "Technicien requis"),
  scheduledDate: z.string().min(1, "Date de programmation requise"),
  estimatedCost: z.number().min(0, "Coût estimé requis"),
  category: z.string().min(1, "Catégorie requise"),
  recurrence: z.string().optional(),
  notes: z.string().optional(),
});

const equipmentSchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  type: z.string().min(1, "Type requis"),
  brand: z.string().min(1, "Marque requise"),
  model: z.string().min(1, "Modèle requis"),
  serialNumber: z.string().min(1, "Numéro de série requis"),
  location: z.string().min(1, "Emplacement requis"),
  purchaseDate: z.string().min(1, "Date d'achat requise"),
  purchasePrice: z.number().min(0, "Prix d'achat requis"),
  supplier: z.string().min(1, "Fournisseur requis"),
  warrantyExpiry: z.string().optional(),
  manualUrl: z.string().optional(),
});

export default function AdvancedMaintenance() : JSX.Element {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const { toast } = useToast();

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      equipmentId: 0,
      priority: 'medium',
      assignedTo: '',
      scheduledDate: '',
      estimatedCost: 0,
      category: 'preventive',
      recurrence: '',
      notes: ''
    }
  });

  const equipmentForm = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      location: '',
      purchaseDate: '',
      purchasePrice: 0,
      supplier: '',
      warrantyExpiry: '',
      manualUrl: ''
    }
  });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [tasksRes, equipmentRes, statsRes] = await Promise.all([
        fetch('/api/admin/maintenance/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/equipment', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/maintenance/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tasksRes.ok && equipmentRes.ok && statsRes.ok) {
        const [tasksData, equipmentData, statsData] = await Promise.all([
          tasksRes.json(),
          equipmentRes.json(),
          statsRes.json()
        ]);

        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setEquipment(Array.isArray(equipmentData) ? equipmentData : []);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de maintenance:', error);

      // Données d'exemple pour la démonstration
      const sampleTasks: MaintenanceTask[] = [
        {
          id: 1,
          title: 'Détartrage machine espresso',
          description: 'Nettoyage et détartrage complet de la machine espresso principale',
          equipmentId: 1,
          equipmentName: 'Machine Espresso Pro',
          priority: 'high',
          status: 'pending',
          assignedTo: 'Marc Technicien',
          scheduledDate: '2024-07-15',
          estimatedCost: 150.00,
          category: 'preventive',
          recurrence: 'monthly',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Réparation broyeur café',
          description: 'Remplacement des lames du broyeur et calibrage',
          equipmentId: 2,
          equipmentName: 'Broyeur Professionnel',
          priority: 'urgent',
          status: 'in_progress',
          assignedTo: 'Sophie Maintenance',
          scheduledDate: '2024-07-12',
          estimatedCost: 300.00,
          actualCost: 275.00,
          category: 'corrective',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sampleEquipment: Equipment[] = [
        {
          id: 1,
          name: 'Machine Espresso Pro',
          type: 'Machine à café',
          brand: 'La Marzocco',
          model: 'Linea PB',
          serialNumber: 'LM2024001',
          location: 'Comptoir principal',
          status: 'operational',
          lastMaintenance: '2024-06-15',
          nextMaintenance: '2024-07-15',
          warrantyExpiry: '2026-01-15',
          purchaseDate: '2024-01-15',
          purchasePrice: 8500.00,
          supplier: 'Café Equipment Pro',
          specifications: {
            groups: 3,
            power: '4.5kW',
            pressure: '9 bars',
            capacity: '11L'
          },
          maintenanceHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Broyeur Professionnel',
          type: 'Broyeur à café',
          brand: 'Mahlkönig',
          model: 'EK43',
          serialNumber: 'MK2024002',
          location: 'Station de préparation',
          status: 'maintenance',
          lastMaintenance: '2024-07-10',
          nextMaintenance: '2024-08-10',
          warrantyExpiry: '2025-03-20',
          purchaseDate: '2024-03-20',
          purchasePrice: 2200.00,
          supplier: 'Café Equipment Pro',
          specifications: {
            capacity: '1.5kg',
            speed: '1400rpm',
            burrs: 'Steel'
          },
          maintenanceHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sampleStats: MaintenanceStats = {
        totalEquipment: 12,
        operationalEquipment: 10,
        pendingTasks: 3,
        completedThisMonth: 8,
        totalCostThisMonth: 1250.00,
        averageResolutionTime: 48,
        uptime: 97.5,
        criticalAlerts: 1
      };

      setTasks(sampleTasks);
      setEquipment(sampleEquipment);
      setStats(sampleStats);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedTask ? `/api/admin/maintenance/tasks/${selectedTask.id}` : '/api/admin/maintenance/tasks';
      const method = selectedTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: selectedTask ? "Tâche modifiée" : "Tâche créée",
          description: selectedTask ? "La tâche a été modifiée avec succès" : "La tâche a été créée avec succès"
        });
        setShowTaskDialog(false);
        setSelectedTask(null);
        taskForm.reset();
        fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tâche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la tâche",
        variant: "destructive"
      });
    }
  };

  const handleEquipmentSubmit = async (data: z.infer<typeof equipmentSchema>) => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedEquipment ? `/api/admin/maintenance/equipment/${selectedEquipment.id}` : '/api/admin/maintenance/equipment';
      const method = selectedEquipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: selectedEquipment ? "Équipement modifié" : "Équipement ajouté",
          description: selectedEquipment ? "L'équipement a été modifié avec succès" : "L'équipement a été ajouté avec succès"
        });
        setShowEquipmentDialog(false);
        setSelectedEquipment(null);
        equipmentForm.reset();
        fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'équipement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'équipement",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_order': return 'bg-red-100 text-red-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'machine à café': return <Coffee className="h-5 w-5" />;
      case 'broyeur': return <Settings className="h-5 w-5" />;
      case 'réfrigérateur': return <Thermometer className="h-5 w-5" />;
      case 'électrique': return <Zap className="h-5 w-5" />;
      case 'wifi': return <Wifi className="h-5 w-5" />;
      default: return <Wrench className="h-5 w-5" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Maintenance Avancée</h2>
        <div className="flex space-x-2">
          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedTask(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedTask ? "Modifier la tâche" : "Créer une tâche"}
                </DialogTitle>
                <DialogDescription>
                  Configurez une tâche de maintenance pour votre équipement
                </DialogDescription>
              </DialogHeader>
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-4">
                  <FormField
                    control={taskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Titre de la tâche" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description détaillée" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="equipmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipement</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un équipement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {equipment.map(eq => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>
                                  {eq.name} - {eq.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priorité</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la priorité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Faible</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="high">Haute</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigné à</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du technicien" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date programmée</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coût estimé (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="preventive">Préventive</SelectItem>
                              <SelectItem value="corrective">Corrective</SelectItem>
                              <SelectItem value="emergency">Urgence</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowTaskDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedTask ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setSelectedEquipment(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Équipement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedEquipment ? "Modifier l'équipement" : "Ajouter un équipement"}
                </DialogTitle>
                <DialogDescription>
                  Enregistrez un nouvel équipement dans votre inventaire
                </DialogDescription>
              </DialogHeader>
              <Form {...equipmentForm}>
                <form onSubmit={equipmentForm.handleSubmit(handleEquipmentSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={equipmentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de l'équipement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={equipmentForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Type d'équipement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={equipmentForm.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque</FormLabel>
                          <FormControl>
                            <Input placeholder="Marque" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={equipmentForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modèle</FormLabel>
                          <FormControl>
                            <Input placeholder="Modèle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={equipmentForm.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de série</FormLabel>
                          <FormControl>
                            <Input placeholder="Numéro de série" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={equipmentForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emplacement</FormLabel>
                          <FormControl>
                            <Input placeholder="Emplacement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={equipmentForm.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'achat</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={equipmentForm.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix d'achat (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={equipmentForm.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du fournisseur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowEquipmentDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedEquipment ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Équipements</p>
                  <p className="text-2xl font-bold">{stats.totalEquipment}</p>
                  <p className="text-xs text-green-600">{stats.operationalEquipment} opérationnels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Tâches en attente</p>
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                  <p className="text-xs text-gray-500">{stats.completedThisMonth} terminées ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Coût mensuel</p>
                  <p className="text-2xl font-bold">{stats.totalCostThisMonth.toFixed(0)}€</p>
                  <p className="text-xs text-gray-500">{stats.averageResolutionTime}h résolution moy.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Taux de disponibilité</p>
                  <p className="text-2xl font-bold">{stats.uptime}%</p>
                  <p className="text-xs text-red-600">{stats.criticalAlerts} alertes critiques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tâches ({tasks.length})</TabsTrigger>
          <TabsTrigger value="equipment">Équipements ({equipment.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des tâches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map(task => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority === 'low' ? 'Faible' : 
                       task.priority === 'medium' ? 'Moyenne' : 
                       task.priority === 'high' ? 'Haute' : 'Urgente'}
                    </Badge>
                    <Badge variant="outline">
                      {task.category === 'preventive' ? 'Préventive' : 
                       task.category === 'corrective' ? 'Corrective' : 'Urgence'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Settings className="h-4 w-4 mr-2" />
                      {task.equipmentName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {task.actualCost ? `${task.actualCost}€ (réel)` : `${task.estimatedCost}€ (estimé)`}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-500">
                        Assigné à: {task.assignedTo}
                      </span>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            taskForm.reset({
                              ...task,
                              equipmentId: task.equipmentId || 0
                            });
                            setShowTaskDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Camera className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map(eq => (
              <Card key={eq.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(eq.status)}>
                      {eq.status === 'operational' ? 'Opérationnel' : 
                       eq.status === 'maintenance' ? 'Maintenance' : 
                       eq.status === 'out_of_order' ? 'Hors service' : 'Retiré'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getEquipmentIcon(eq.type)}
                      <span className="text-sm text-gray-600">{eq.type}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{eq.name}</CardTitle>
                  <CardDescription>{eq.brand} {eq.model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {eq.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      S/N: {eq.serialNumber}
                    </div>
                    {eq.lastMaintenance && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Dernière maintenance: {new Date(eq.lastMaintenance).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {eq.nextMaintenance && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Prochaine maintenance: {new Date(eq.nextMaintenance).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-gray-900">
                        {eq.purchasePrice.toFixed(0)}€
                      </span>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedEquipment(eq);
                            equipmentForm.reset(eq);
                            setShowEquipmentDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Star className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}