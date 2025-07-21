import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Edit, Trash2, Users, Clock, CheckCircle, AlertCircle,
  MapPin, RotateCcw, Eye, Calendar, Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RestaurantTable {
  id: number;
  number: number;
  capacity: number;
  location: 'main_floor' | 'terrace' | 'private_room' | 'bar';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  currentReservation?: {
    id: number;
    customerName: string;
    time: string;
    guests: number;
    duration: number;
  };
  nextReservation?: {
    id: number;
    customerName: string;
    time: string;
    guests: number;
  };
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  notes?: string;
  lastCleaned?: string;
  isVip: boolean;
}

interface TableLayout {
  id: number;
  name: string;
  tables: RestaurantTable[];
  isActive: boolean;
}

const tableSchema = z.object({
  number: z.number().min(1, "Numéro de table requis"),
  capacity: z.number().min(1, "Capacité requise"),
  location: z.string().min(1, "Emplacement requis"),
  shape: z.string().min(1, "Forme requise"),
  isVip: z.boolean().optional(),
  notes: z.string().optional(),
});

const statusColors = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-red-100 text-red-800',
  reserved: 'bg-blue-100 text-blue-800',
  cleaning: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  available: 'Disponible',
  occupied: 'Occupée',
  reserved: 'Réservée',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
};

const locationLabels = {
  main_floor: 'Salle principale',
  terrace: 'Terrasse',
  private_room: 'Salle privée',
  bar: 'Bar',
};

export default function TableManagement() {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['/api/admin/tables'],
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ['/api/admin/table-layouts'],
  });

  const { data: occupancyStats } = useQuery({
    queryKey: ['/api/admin/tables/occupancy'],
  });

  const createTableMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest('/api/admin/tables', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Table créée avec succès" });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/tables/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Table mise à jour" });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiRequest(`/api/admin/tables/${id}/status`, { method: 'PUT', data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const form = useForm({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      number: 1,
      capacity: 2,
      location: 'main_floor',
      shape: 'round',
      isVip: false,
      notes: '',
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    createTableMutation.mutate(data);
  };

  const updateTableStatus = (id: number, status: string) => {
    updateTableStatusMutation.mutate({ id, status });
  };

  const filteredTables = tables.filter((table: RestaurantTable) => {
    const locationMatch = locationFilter === 'all' || table.location === locationFilter;
    const statusMatch = statusFilter === 'all' || table.status === statusFilter;
    return locationMatch && statusMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Calendar className="h-4 w-4" />;
      case 'cleaning': return <RotateCcw className="h-4 w-4" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Tables</h2>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'layout' ? 'default' : 'outline'}
            onClick={() => setViewMode('layout')}
          >
            Plan
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Table</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle table à votre restaurant.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de table</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacité</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emplacement</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="main_floor">Salle principale</SelectItem>
                              <SelectItem value="terrace">Terrasse</SelectItem>
                              <SelectItem value="private_room">Salle privée</SelectItem>
                              <SelectItem value="bar">Bar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shape"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forme</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="round">Ronde</SelectItem>
                              <SelectItem value="square">Carrée</SelectItem>
                              <SelectItem value="rectangle">Rectangulaire</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isVip"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Table VIP</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Notes spéciales..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Créer la Table
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques d'occupation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold">
                  {tables.filter((t: RestaurantTable) => t.status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Occupées</p>
                <p className="text-2xl font-bold">
                  {tables.filter((t: RestaurantTable) => t.status === 'occupied').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Réservées</p>
                <p className="text-2xl font-bold">
                  {tables.filter((t: RestaurantTable) => t.status === 'reserved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Taux d'occupation</p>
                <p className="text-2xl font-bold">{occupancyStats?.rate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Emplacement</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(locationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'list' ? (
        /* Vue en liste */
        <Card>
          <CardHeader>
            <CardTitle>Tables du Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Réservation actuelle</TableHead>
                  <TableHead>Prochaine réservation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table: RestaurantTable) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>#{table.number}</span>
                        {table.isVip && <Badge variant="secondary">VIP</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{table.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>{locationLabels[table.location]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[table.status]}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(table.status)}
                          <span>{statusLabels[table.status]}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {table.currentReservation ? (
                        <div>
                          <p className="font-medium">{table.currentReservation.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {table.currentReservation.time} - {table.currentReservation.guests} pers.
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.nextReservation ? (
                        <div>
                          <p className="font-medium">{table.nextReservation.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {table.nextReservation.time} - {table.nextReservation.guests} pers.
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {table.status === 'occupied' && (
                          <Button
                            size="sm"
                            onClick={() => updateTableStatus(table.id, 'cleaning')}
                          >
                            Libérer
                          </Button>
                        )}
                        {table.status === 'cleaning' && (
                          <Button
                            size="sm"
                            onClick={() => updateTableStatus(table.id, 'available')}
                          >
                            Nettoyée
                          </Button>
                        )}
                        {table.status === 'available' && (
                          <Button
                            size="sm"
                            onClick={() => updateTableStatus(table.id, 'occupied')}
                          >
                            Occuper
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Vue plan de salle */
        <Card>
          <CardHeader>
            <CardTitle>Plan de Salle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-50 rounded-lg p-8 min-h-96">
              <div className="grid grid-cols-6 gap-4">
                {filteredTables.map((table: RestaurantTable) => (
                  <div
                    key={table.id}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${table.shape === 'round' ? 'rounded-full' : 
                        table.shape === 'square' ? 'aspect-square' : 'aspect-[3/2]'}
                      ${table.status === 'available' ? 'border-green-500 bg-green-50' :
                        table.status === 'occupied' ? 'border-red-500 bg-red-50' :
                        table.status === 'reserved' ? 'border-blue-500 bg-blue-50' :
                        table.status === 'cleaning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-gray-500 bg-gray-50'}
                    `}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="text-center">
                      <p className="font-bold text-sm">{table.number}</p>
                      <p className="text-xs">{table.capacity} pers.</p>
                      {table.isVip && (
                        <Badge variant="secondary" className="text-xs">VIP</Badge>
                      )}
                    </div>
                    <div className="absolute top-1 right-1">
                      {getStatusIcon(table.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog détails table */}
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Table #{selectedTable.number}
                {selectedTable.isVip && <Badge className="ml-2">VIP</Badge>}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Capacité</p>
                  <p>{selectedTable.capacity} personnes</p>
                </div>
                <div>
                  <p className="font-medium">Emplacement</p>
                  <p>{locationLabels[selectedTable.location]}</p>
                </div>
                <div>
                  <p className="font-medium">Forme</p>
                  <p className="capitalize">{selectedTable.shape}</p>
                </div>
                <div>
                  <p className="font-medium">Statut</p>
                  <Badge className={statusColors[selectedTable.status]}>
                    {statusLabels[selectedTable.status]}
                  </Badge>
                </div>
              </div>

              {selectedTable.currentReservation && (
                <div>
                  <p className="font-medium">Réservation actuelle</p>
                  <div className="p-3 bg-blue-50 rounded">
                    <p>{selectedTable.currentReservation.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTable.currentReservation.time} - {selectedTable.currentReservation.guests} personnes
                    </p>
                  </div>
                </div>
              )}

              {selectedTable.nextReservation && (
                <div>
                  <p className="font-medium">Prochaine réservation</p>
                  <div className="p-3 bg-green-50 rounded">
                    <p>{selectedTable.nextReservation.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTable.nextReservation.time} - {selectedTable.nextReservation.guests} personnes
                    </p>
                  </div>
                </div>
              )}

              {selectedTable.notes && (
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-sm text-gray-600">{selectedTable.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTable(null)}
                >
                  Fermer
                </Button>
                <Button>
                  Modifier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}