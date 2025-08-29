import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DialogFooter,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Navigation,
  RefreshCw,
  User,
  Package,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Skeleton } from '@/components/ui/skeleton';

interface Delivery {
  id: number;
  orderId: number;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  driverId?: number;
  driverName?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  estimatedTime: string;
  actualTime?: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderItems: { name: string; quantity: number }[];
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicleType: string;
  isAvailable: boolean;
  currentDeliveries: number;
}

interface Order {
  id: number;
  customerName: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

const deliverySchema = z.object({
  orderId: z.number().min(1, "Commande requise"),
  driverId: z.number().optional(),
  estimatedTime: z.string().min(1, "Temps estimé requis"),
  notes: z.string().optional(),
});

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const statusLabels = {
  pending: 'En attente',
  assigned: 'Assignée',
  picked_up: 'Récupérée',
  in_transit: 'En route',
  delivered: 'Livrée',
  failed: 'Échec',
};

export default function DeliveryTracking() : JSX.Element {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: deliveries = [], isLoading, refetch } = useQuery<Delivery[]>({
    queryKey: ['deliveries'],
    queryFn: () => apiRequest('/api/admin/deliveries'),
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiRequest('/api/admin/drivers'),
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['orders-for-delivery'],
    queryFn: () => apiRequest('/api/admin/orders-for-delivery'),
  });

  const createDeliveryMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => 
      apiRequest('/api/admin/deliveries', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ 
        title: "Livraison créée", 
        description: "La livraison a été créée avec succès",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la livraison",
        variant: "destructive",
      });
    }
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => 
      apiRequest(`/api/admin/deliveries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ 
        title: "Statut mis à jour", 
        description: "Le statut de la livraison a été modifié",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la livraison",
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      orderId: 0,
      driverId: undefined,
      estimatedTime: '',
      notes: '',
    },
  });

  const onSubmit = (data: z.infer<typeof deliverySchema>) => {
    createDeliveryMutation.mutate(data);
  };

  const updateDeliveryStatus = (id: number, status: string) => {
    updateDeliveryMutation.mutate({ id, status });
  };

  const filteredDeliveries = deliveries.filter((delivery: Delivery) => 
    statusFilter === 'all' || delivery.status === statusFilter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'assigned': return <Truck className="h-4 w-4" />;
      case 'picked_up': return <Navigation className="h-4 w-4" />;
      case 'in_transit': return <MapPin className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des livraisons actualisée",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Suivi des Livraisons</h2>
          <p className="text-sm text-gray-500">
            {filteredDeliveries.length} livraison(s) trouvée(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Livraison
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Livraison</DialogTitle>
                <DialogDescription>
                  Assignez une commande à un livreur pour la livraison
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commande</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une commande" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orders.map((order) => (
                              <SelectItem 
                                key={order.id} 
                                value={order.id.toString()}
                              >
                                Commande #{order.id} - {order.customerName} ({order.totalAmount}€)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Livreur (optionnel)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          defaultValue={field.value ? field.value.toString() : ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un livreur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Non assigné</SelectItem>
                            {drivers
                              .filter((driver) => driver.isAvailable)
                              .map((driver) => (
                                <SelectItem 
                                  key={driver.id} 
                                  value={driver.id.toString()}
                                >
                                  {driver.name} ({driver.vehicleType})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temps estimé (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="30" 
                            min="1"
                          />
                        </FormControl>
                        <FormMessage />
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
                          <Input 
                            {...field} 
                            placeholder="Instructions spéciales..." 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createDeliveryMutation.isPending}
                    >
                      {createDeliveryMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Créer la Livraison
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => 
                    ['assigned', 'picked_up', 'in_transit'].includes(d.status)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Livrées</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => d.status === 'delivered').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Échecs</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => d.status === 'failed').length}
                </p>
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Toutes
            </Button>
            {Object.entries(statusLabels).map(([status, label]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table des livraisons */}
      <Card>
        <CardHeader>
          <CardTitle>Livraisons Actives</CardTitle>
          <CardDescription>
            Liste des livraisons en cours et récentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Contenu</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temps estimé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>#{delivery.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{delivery.customerName}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {delivery.customerPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{delivery.address}</p>
                        <p className="text-sm text-gray-500">
                          {delivery.city} {delivery.postalCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {delivery.orderItems?.slice(0, 2).map((item, index) => (
                          <p key={index} className="text-sm">
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                        {delivery.orderItems?.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{delivery.orderItems.length - 2} autres articles
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {delivery.driverName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{delivery.driverName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[delivery.status]}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(delivery.status)}
                          <span>{statusLabels[delivery.status]}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{delivery.estimatedTime} min</TableCell>
                    <TableCell>{delivery.totalAmount.toFixed(2)}€</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDelivery(delivery)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Détails de la livraison #{delivery.id}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Client</h4>
                                <p>{delivery.customerName}</p>
                                <p className="text-sm text-gray-500">
                                  {delivery.customerPhone}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium">Adresse</h4>
                                <p>{delivery.address}</p>
                                <p className="text-sm text-gray-500">
                                  {delivery.city} {delivery.postalCode}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium">Articles</h4>
                                <ul className="space-y-1">
                                  {delivery.orderItems?.map((item, index) => (
                                    <li key={index} className="flex justify-between">
                                      <span>{item.quantity}x {item.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="font-medium">Statut</h4>
                                <Badge className={statusColors[delivery.status]}>
                                  {statusLabels[delivery.status]}
                                </Badge>
                              </div>
                              
                              {delivery.notes && (
                                <div>
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm">{delivery.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {delivery.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(delivery.id, 'assigned')}
                            disabled={updateDeliveryMutation.isPending}
                          >
                            Assigner
                          </Button>
                        )}
                        {delivery.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                            disabled={updateDeliveryMutation.isPending}
                          >
                            Récupérée
                          </Button>
                        )}
                        {delivery.status === 'picked_up' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            disabled={updateDeliveryMutation.isPending}
                          >
                            En route
                          </Button>
                        )}
                        {delivery.status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                            disabled={updateDeliveryMutation.isPending}
                          >
                            Livrée
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Aucune livraison trouvée
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}