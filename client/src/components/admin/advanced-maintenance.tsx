import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
  Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Textarea,
} from '@/components/ui'; // Adapte selon ton UI kit
import { Edit, Plus } from 'lucide-react'; // ou ton set d'icônes
import { useForm } from 'react-hook-form';

type MaintenanceTask = {
  id: string;
  title: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  scheduledDate: string; // ISO date
  estimatedCost: number;
  category: 'preventive' | 'corrective' | 'emergency';
  recurrence?: string;
  notes?: string;
};

type Equipment = {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  serialNumber?: string;
  location: string;
  status: 'operational' | 'out_of_service' | 'maintenance';
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  warrantyExpiry?: string;
  manualUrl?: string;
};

type MaintenanceStats = {
  totalEquipment: number;
  operationalEquipment: number;
  pendingTasks: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
  averageResolutionTime: number;
  uptime: number;
  criticalAlerts: number;
};

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    case 'high': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'operational': return 'bg-green-100 text-green-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'out_of_service': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getEquipmentIcon(type: string) {
  // Exemple simple, adapte selon ton set d'icônes
  switch (type.toLowerCase();{
    case 'printer': return <i className="fas fa-print mr-2" />;
    case 'computer': return <i className="fas fa-desktop mr-2" />;
    default: return <i className="fas fa-cogs mr-2" />;
  }
}

export default function MaintenanceDashboard() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const token = localStorage.getItem('token');

  // Fetch API helper with error handling
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Non authentifié');
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({});
      throw new Error(errorData.message || `Erreur HTTP ${res.status}`);
    }
    return res.json();
  }, [token]);

  // Chargement initial
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch('/api/admin/maintenance/tasks'),
      apiFetch('/api/admin/maintenance/equipment'),
      apiFetch('/api/admin/maintenance/stats'),
    ])
      .then(([tasksData, equipmentData, statsData]) => {
        setTasks(tasksData);
        setEquipment(equipmentData);
        setStats(statsData);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false);
  }, [apiFetch]);

  // Formulaires react-hook-form
  const taskForm = useForm<MaintenanceTask>({
    defaultValues: {
      title: '',
      equipmentId: '',
      priority: 'medium',
      status: 'pending',
      assignedTo: '',
      scheduledDate: '',
      estimatedCost: 0,
      category: 'preventive',
      recurrence: '',
      notes: '',
    },
  });

  const equipmentForm = useForm<Equipment>({
    defaultValues: {
      name: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      location: '',
      status: 'operational',
      purchaseDate: '',
      purchasePrice: 0,
      supplier: '',
      warrantyExpiry: '',
      manualUrl: '',
    },
  });

  // Soumission formulaire tâche
  const handleTaskSubmit = async (data: MaintenanceTask) => {
    try {
      setLoading(true);
      setError(null);

      if (selectedTask) {
        // Modifier tâche
        const updated = await apiFetch(`/api/admin/maintenance/tasks/${selectedTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t);
      } else {
        // Créer tâche
        const created = await apiFetch('/api/admin/maintenance/tasks', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setTasks((prev) => [...prev, created]);
      }

      setShowTaskDialog(false);
      taskForm.reset();
      setSelectedTask(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde de la tâche');
    } finally {
      setLoading(false);
    }
  };

  // Soumission formulaire équipement
  const handleEquipmentSubmit = async (data: Equipment) => {
    try {
      setLoading(true);
      setError(null);

      if (selectedEquipment) {
        // Modifier équipement
        const updated = await apiFetch(`/api/admin/maintenance/equipment/${selectedEquipment.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setEquipment((prev) =>
          prev.map((eq) => (eq.id === updated.id ? updated : eq);
      } else {
        // Créer équipement
        const created = await apiFetch('/api/admin/maintenance/equipment', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setEquipment((prev) => [...prev, created]);
      }

      setShowEquipmentDialog(false);
      equipmentForm.reset();
      setSelectedEquipment(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde de l\'équipement');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des tâches
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion Maintenance</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          Erreur : {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-3 bg-gray-100 text-gray-700 rounded text-center">
          Chargement en cours...
        </div>
      }

      <div className="flex flex-wrap justify-between items-center mb-6">
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogTrigger asChild>
            <Button variant="secondary" onClick={() => {
              setSelectedTask(null);
              taskForm.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask ? 'Modifier tâche' : 'Créer une tâche'}</DialogTitle>
              <DialogDescription>Remplissez les informations de la tâche</DialogDescription>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(handleTaskSubmit} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre de la tâche" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="equipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipement</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un équipement" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name}
                            </SelectItem>
                          );}
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
                      <Select onValueChange={field.onChange} value={field.value} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une priorité" />
                        </SelectTrigger>
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
                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigné à</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'utilisateur assigné" {...field} />
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
                <FormField
                  control={taskForm.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coût estimé (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value);}
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
                      <Select onValueChange={field.onChange} value={field.value} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
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
                <FormField
                  control={taskForm.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Récurrence (optionnelle)</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une récidive" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucune</SelectItem>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuelle</SelectItem>
                            <SelectItem value="quarterly">Trimestrielle</SelectItem>
                            <SelectItem value="yearly">Annuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes supplémentaires" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTaskDialog(false}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {selectedTask ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog équipement */}
        <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
          <DialogTrigger asChild>
            <Button variant="secondary" onClick={() => {
              setSelectedEquipment(null);
              equipmentForm.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" /> Nouvel équipement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEquipment ? 'Modifier équipement' : 'Ajouter un équipement'}</DialogTitle>
              <DialogDescription>Configurez les informations de votre équipement</DialogDescription>
            </DialogHeader>
            <Form {...equipmentForm}>
              <form onSubmit={equipmentForm.handleSubmit(handleEquipmentSubmit} className="space-y-4">
                <FormField
                  control={equipmentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'équipement" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={equipmentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Type d'équipement" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={equipmentForm.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input placeholder="Marque" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={equipmentForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input placeholder="Modèle" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <FormField
                  control={equipmentForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation</FormLabel>
                      <FormControl>
                        <Input placeholder="Localisation" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={equipmentForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operational">Opérationnel</SelectItem>
                          <SelectItem value="maintenance">En maintenance</SelectItem>
                          <SelectItem value="out_of_service">Hors service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            min={0}
                            step={0.01}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value);}
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
                        <Input placeholder="Fournisseur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={equipmentForm.control}
                  name="warrantyExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin de garantie</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={equipmentForm.control}
                  name="manualUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL du manuel</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEquipmentDialog(false}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {selectedEquipment ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Filtres */}
        <div className="flex space-x-4 mb-4">
          <select
            className="border rounded p-1"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <select
            className="border rounded p-1"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value}
          >
            <option value="all">Toutes priorités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Équipements</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total : {stats.totalEquipment}</p>
              <p>Opérationnels : {stats.operationalEquipment}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <p>En attente : {stats.pendingTasks}</p>
              <p>Terminées ce mois : {stats.completedThisMonth}</p>
              <p>Coût total ce mois : {stats.totalCostThisMonth} €</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Temps moyen résolution : {stats.averageResolutionTime} h</p>
              <p>Taux disponibilité : {stats.uptime} %</p>
              <p>Alerte critiques : {stats.criticalAlerts}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des tâches */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <p>Aucune tâche trouvée avec les filtres appliqués.</p>
        ) : (
          filteredTasks.map((task) => {
            const eq = equipment.find((eq) => eq.id === task.equipmentId);
            return (
              <Card key={task.id} className="cursor-pointer" onClick={() => {
                setSelectedTask(task);
                taskForm.reset(task);
                setShowTaskDialog(true);
              }}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    {getEquipmentIcon(eq?.type || ''}
                    {task.title}
                    <Badge className={getPriorityColor(task.priority}>{task.priority}</Badge>
                  </CardTitle>
                  <Badge className={getStatusColor(task.status}>{task.status.replace('_', ' '}</Badge>
                </CardHeader>
                <CardContent>
                  <p><strong>Équipement :</strong> {eq?.name || 'Non défini'}</p>
                  <p><strong>Assigné à :</strong> {task.assignedTo || '-'}</p>
                  <p><strong>Date programmée :</strong> {new Date(task.scheduledDate).toLocaleDateString(}</p>
                  <p><strong>Coût estimé :</strong> {task.estimatedCost} €</p>
                  <p><strong>Catégorie :</strong> {task.category}</p>
                </CardContent>
              </Card>
            );
          });}
      </div>
    </div>
  );
}
