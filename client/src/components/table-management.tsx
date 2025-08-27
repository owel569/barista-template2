import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, MapPin, Clock, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Table {
  id: number;
  number: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentReservation?: {
    id: number;
    customerName: string;
    time: string;
    guests: number;
  };
  features: string[];
  shape: 'round' | 'square' | 'rectangular';
  x: number;
  y: number;
}

interface TableReservation {
  id: number;
  tableId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  specialRequests?: string;
}

const TableManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid');

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
  });

  const { data: reservations = [] } = useQuery<TableReservation[]>({
    queryKey: ['/api/table-reservations'],
  });

  const createTableMutation = useMutation({
    mutationFn: async (tableData: Partial<Table>) => {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData),
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Table créée', description: 'La nouvelle table a été ajoutée.' });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Table> & { id: number }) => {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsEditDialogOpen(false);
      setSelectedTable(null);
      toast({ title: 'Table mise à jour', description: 'Les modifications ont été sauvegardées.' });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/tables/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({ title: 'Statut mis à jour', description: 'Le statut de la table a été modifié.' });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({ title: 'Table supprimée', description: 'La table a été supprimée avec succès.' });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'maintenance': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupée';
      case 'reserved': return 'Réservée';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getTableIcon = (shape: string) => {
    switch (shape) {
      case 'round': return '⭕';
      case 'square': return '⬜';
      case 'rectangular': return '⬛';
      default: return '⬜';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Tables</h2>
          <p className="text-muted-foreground">Organisez l'espace et gérez les réservations</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            Grille
          </Button>
          <Button 
            variant={viewMode === 'floor' ? 'default' : 'outline'}
            onClick={() => setViewMode('floor')}
          >
            Plan
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Table
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {tables.filter(t => t.status === 'available').length}
            </div>
            <div className="text-sm text-gray-500">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {tables.filter(t => t.status === 'occupied').length}
            </div>
            <div className="text-sm text-gray-500">Occupées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {tables.filter(t => t.status === 'reserved').length}
            </div>
            <div className="text-sm text-gray-500">Réservées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {tables.reduce((sum, table) => sum + table.capacity, 0)}
            </div>
            <div className="text-sm text-gray-500">Capacité totale</div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'grid' ? (
        /* Vue grille */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <span className="text-2xl mr-2">{getTableIcon(table.shape)}</span>
                    Table {table.number}
                  </CardTitle>
                  <Badge className={`${getStatusColor(table.status)} text-white`}>
                    {getStatusLabel(table.status)}
                  </Badge>
                </div>
                <CardDescription>{table.location}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{table.capacity} personnes</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{table.location}</span>
                  </div>
                </div>

                {table.currentReservation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium">{table.currentReservation.customerName}</p>
                      <p className="text-gray-600">{table.currentReservation.time} • {table.currentReservation.guests} pers.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {table.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedTable(table);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  
                  <Select onValueChange={(status) => 
                    updateTableStatusMutation.mutate({ id: table.id, status })
                  }>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="occupied">Occupée</SelectItem>
                      <SelectItem value="reserved">Réservée</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Vue plan du restaurant */
        <Card>
          <CardHeader>
            <CardTitle>Plan du Restaurant</CardTitle>
            <CardDescription>Vue d'ensemble de la disposition des tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-96 bg-gray-50 rounded-lg p-4 overflow-hidden">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`absolute w-16 h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                    table.status === 'available' ? 'bg-green-100 border-green-500' :
                    table.status === 'occupied' ? 'bg-red-100 border-red-500' :
                    table.status === 'reserved' ? 'bg-yellow-100 border-yellow-500' :
                    'bg-gray-100 border-gray-500'
                  }`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                  }}
                  onClick={() => {
                    setSelectedTable(table);
                    setIsEditDialogOpen(true);
                  }}
                  title={`Table ${table.number} - ${table.capacity} pers. - ${getStatusLabel(table.status}`}
                >
                  <div className="text-center">
                    <div className="text-lg">{getTableIcon(table.shape)}</div>
                    <div className="text-xs font-bold">{table.number}</div>
                  </div>
                </div>
              ))}
              
              {/* Éléments décoratifs du restaurant */}
              <div className="absolute bottom-4 left-4 w-8 h-8 bg-brown-200 rounded" title="Bar"></div>
              <div className="absolute top-4 right-4 w-6 h-6 bg-green-200 rounded-full" title="Plantes"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 bg-blue-200 rounded" title="Entrée"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog création de table */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle table</DialogTitle>
            <DialogDescription>
              Ajoutez une table à votre restaurant
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const tableData = {
              number: formData.get('number') as string,
              capacity: parseInt(formData.get('capacity') as string),
              location: formData.get('location') as string,
              shape: formData.get('shape') as string,
              features: (formData.get('features') as string).split(',').map(f => f.trim()).filter(f => f),
              status: 'available',
              x: Math.random() * 80,
              y: Math.random() * 80,
            };
            createTableMutation.mutate(tableData);
          }}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Numéro</Label>
                  <Input name="number" required placeholder="Ex: T1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité</Label>
                  <Input name="capacity" type="number" required placeholder="4" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input name="location" required placeholder="Ex: Près de la fenêtre" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shape">Forme</Label>
                <Select name="shape" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une forme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Ronde</SelectItem>
                    <SelectItem value="square">Carrée</SelectItem>
                    <SelectItem value="rectangular">Rectangulaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="features">Caractéristiques (séparées par virgule)</Label>
                <Input name="features" placeholder="Ex: Vue terrasse, Prise électrique" />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer la table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog modification de table */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la table {selectedTable?.number}</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la table
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const tableData = {
                id: selectedTable.id,
                number: formData.get('number') as string,
                capacity: parseInt(formData.get('capacity') as string),
                location: formData.get('location') as string,
                shape: formData.get('shape') as string,
                features: (formData.get('features') as string).split(',').map(f => f.trim()).filter(f => f),
              };
              updateTableMutation.mutate(tableData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Numéro</Label>
                    <Input name="number" defaultValue={selectedTable.number} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input name="capacity" type="number" defaultValue={selectedTable.capacity} required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Emplacement</Label>
                  <Input name="location" defaultValue={selectedTable.location} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shape">Forme</Label>
                  <Select name="shape" defaultValue={selectedTable.shape}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Ronde</SelectItem>
                      <SelectItem value="square">Carrée</SelectItem>
                      <SelectItem value="rectangular">Rectangulaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="features">Caractéristiques</Label>
                  <Input name="features" defaultValue={selectedTable.features.join(', ')} />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) {
                      deleteTableMutation.mutate(selectedTable.id);
                      setIsEditDialogOpen(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Sauvegarder</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;