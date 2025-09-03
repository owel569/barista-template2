import React, { useState, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface Reservation {
  id: number;
  customerName: string;
  time: string;
  guests: number;
  duration?: number;
}

interface RestaurantTable {
  id: number;
  number: number;
  capacity: number;
  location: 'main_floor' | 'terrace' | 'private_room' | 'bar';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  currentReservation?: Reservation;
  nextReservation?: Reservation;
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

interface OccupancyStats {
  rate: number;
  available: number;
  occupied: number;
  reserved: number;
}

// Validation Schema
const tableSchema = z.object({
  number: z.number().min(1, "Numéro de table requis"),
  capacity: z.number().min(1, "Capacité minimale: 1").max(20, "Capacité maximale: 20"),
  location: z.enum(['main_floor', 'terrace', 'private_room', 'bar']),
  shape: z.enum(['round', 'square', 'rectangle']),
  isVip: z.boolean().optional(),
  notes: z.string().max(200, "Maximum 200 caractères").optional(),
});

// Constants
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-red-100 text-red-800',
  reserved: 'bg-blue-100 text-blue-800',
  cleaning: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-gray-100 text-gray-800',
} as const;

const STATUS_LABELS = {
  available: 'Disponible',
  occupied: 'Occupée',
  reserved: 'Réservée',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
} as const;

const LOCATION_LABELS = {
  main_floor: 'Salle principale',
  terrace: 'Terrasse',
  private_room: 'Salle privée',
  bar: 'Bar',
} as const;

const SHAPE_LABELS = {
  round: 'Ronde',
  square: 'Carrée',
  rectangle: 'Rectangulaire',
} as const;

const STATUS_ICONS = {
  available: <CheckCircle className="h-4 w-4" />,
  occupied: <Users className="h-4 w-4" />,
  reserved: <Calendar className="h-4 w-4" />,
  cleaning: <RotateCcw className="h-4 w-4" />,
  maintenance: <AlertCircle className="h-4 w-4" />,
} as const;

export default function TableManagement(): JSX.Element {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  useWebSocket('table-updates', () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
  });

  // Data fetching
  const { data: tables = [], isLoading } = useQuery<RestaurantTable[]>({
    queryKey: ['/api/admin/tables'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: layouts = [] } = useQuery<TableLayout[]>({
    queryKey: ['/api/admin/table-layouts'],
  });

  const { data: occupancyStats } = useQuery<OccupancyStats>({
    queryKey: ['/api/admin/tables/occupancy'],
  });

  // Mutations
  const createTableMutation = useMutation({
    mutationFn: (data: Omit<RestaurantTable, 'id'>) => 
      apiRequest('/api/admin/tables', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Table créée avec succès", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<RestaurantTable> & { id: number }) => 
      apiRequest(`/api/admin/tables/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Table mise à jour", variant: "success" });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RestaurantTable['status'] }) => 
      apiRequest(`/api/admin/tables/${id}/status`, { method: 'PUT', data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({ title: "Statut mis à jour", variant: "success" });
    },
  });

  // Form handling
  const form = useForm<z.infer<typeof tableSchema>>({
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

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const locationMatch = locationFilter === 'all' || table.location === locationFilter;
      const statusMatch = statusFilter === 'all' || table.status === statusFilter;
      return locationMatch && statusMatch;
    });
  }, [tables, locationFilter, statusFilter]);

  // Stats
  const tableStats = useMemo(() => ({
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    total: tables.length,
    occupancyRate: occupancyStats?.rate || 0,
  }), [tables, occupancyStats]);

  // Handlers
  const handleSubmit = (data: z.infer<typeof tableSchema>) => {
    createTableMutation.mutate(data);
  };

  const handleStatusChange = (id: number, status: RestaurantTable['status']) => {
    updateTableStatusMutation.mutate({ id, status });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle and create button */}
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

          {/* Create Table Dialog */}
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
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                              min="1"
                              max="20"
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
                              {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
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
                              {Object.entries(SHAPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
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

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createTableMutation.isPending}
                  >
                    {createTableMutation.isPending ? 'Création...' : 'Créer la Table'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Occupation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold">{tableStats.available}</p>
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
                <p className="text-2xl font-bold">{tableStats.occupied}</p>
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
                <p className="text-2xl font-bold">{tableStats.reserved}</p>
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
                <p className="text-2xl font-bold">{tableStats.occupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                  <SelectValue placeholder="Emplacement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content View */}
      {viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Tables du Restaurant ({filteredTables.length}/{tables.length})</CardTitle>
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
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
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
                      <TableCell>{LOCATION_LABELS[table.location]}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[table.status]}>
                          <div className="flex items-center space-x-1">
                            {STATUS_ICONS[table.status]}
                            <span>{STATUS_LABELS[table.status]}</span>
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

                          {/* Status-specific actions */}
                          {table.status === 'occupied' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(table.id, 'cleaning')}
                            >
                              Libérer
                            </Button>
                          )}
                          {table.status === 'cleaning' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(table.id, 'available')}
                            >
                              Nettoyée
                            </Button>
                          )}
                          {table.status === 'available' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(table.id, 'occupied')}
                            >
                              Occuper
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Aucune table ne correspond aux filtres sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Layout View */
        <Card>
          <CardHeader>
            <CardTitle>Plan de Salle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-50 rounded-lg p-8 min-h-96">
              <div className="grid grid-cols-6 gap-4">
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
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
                        ${table.isVip ? 'ring-2 ring-yellow-400' : ''}
                      `}
                      onClick={() => setSelectedTable(table)}
                    >
                      <div className="text-center">
                        <p className="font-bold text-sm">{table.number}</p>
                        <p className="text-xs">{table.capacity} pers.</p>
                        {table.isVip && (
                          <Badge variant="secondary" className="text-xs mt-1">VIP</Badge>
                        )}
                      </div>
                      <div className="absolute top-1 right-1">
                        {STATUS_ICONS[table.status]}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-6 text-center py-16 text-gray-500">
                    Aucune table ne correspond aux filtres sélectionnés
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Details Dialog */}
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
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
                  <p>{LOCATION_LABELS[selectedTable.location]}</p>
                </div>
                <div>
                  <p className="font-medium">Forme</p>
                  <p className="capitalize">{SHAPE_LABELS[selectedTable.shape]}</p>
                </div>
                <div>
                  <p className="font-medium">Statut</p>
                  <Badge className={STATUS_COLORS[selectedTable.status]}>
                    {STATUS_LABELS[selectedTable.status]}
                  </Badge>
                </div>
              </div>

              {selectedTable.currentReservation && (
                <div>
                  <p className="font-medium">Réservation actuelle</p>
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="font-medium">{selectedTable.currentReservation.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTable.currentReservation.time} - {selectedTable.currentReservation.guests} personnes
                      {selectedTable.currentReservation.duration && (
                        <span> (durée: {selectedTable.currentReservation.duration} min)</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {selectedTable.nextReservation && (
                <div>
                  <p className="font-medium">Prochaine réservation</p>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="font-medium">{selectedTable.nextReservation.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTable.nextReservation.time} - {selectedTable.nextReservation.guests} personnes
                    </p>
                  </div>
                </div>
              )}

              {selectedTable.notes && (
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTable.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTable(null)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    // Implement edit functionality
                    toast({ title: "Fonctionnalité d'édition à implémenter" });
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
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