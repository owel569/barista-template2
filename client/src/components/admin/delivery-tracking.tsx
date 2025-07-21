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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Clock, Truck, CheckCircle, AlertCircle, Phone, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

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
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicleType: string;
  isAvailable: boolean;
  currentDeliveries: number;
}

const deliverySchema = z.object({
  orderId: z.number().min(1, "Commande requise"),
  driverId: z.number().optional(),
  estimatedTime: z.string().min(1, "Temps estimé requis"),
  notes: z.string().optional(),
});

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'En attente',
  assigned: 'Assignée',
  picked_up: 'Récupérée',
  in_transit: 'En route',
  delivered: 'Livrée',
  failed: 'Échec',
};

export default function DeliveryTracking() : void {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['/api/admin/deliveries'],
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/admin/orders-for-delivery'],
  });

  const createDeliveryMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest('/api/admin/deliveries', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deliveries'] });
      toast({ title: "Livraison créée avec succès" });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/deliveries/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deliveries'] });
      toast({ title: "Livraison mise à jour" });
    },
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

  const onSubmit = (data: Record<string, unknown>) => {
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

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suivi des Livraisons</h2>
        <Dialog>
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
                Assignez une commande à un livreur pour la livraison.
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
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une commande" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders.map((order: { id: number; customerName: string; address: string; city: string; postalCode: string; driverName?: string; status: string; estimatedTime: string; totalAmount: number }) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              Commande #{order.id} - {order.customerName}
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
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un livreur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {drivers.filter((d: Driver) => d.isAvailable).map((driver: Driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.name} - {driver.vehicleType}
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
                        <Input {...field} placeholder="30" />
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
                        <Input {...field} placeholder="Instructions spéciales..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Créer la Livraison
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold">{deliveries.filter((d: Delivery) => d.status === 'pending').length}</p>
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
                  {deliveries.filter((d: Delivery) => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length}
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
                <p className="text-2xl font-bold">{deliveries.filter((d: Delivery) => d.status === 'delivered').length}</p>
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
                <p className="text-2xl font-bold">{deliveries.filter((d: Delivery) => d.status === 'failed').length}</p>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temps estimé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery: Delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>#{delivery.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{delivery.customerName}</p>
                      <p className="text-sm text-gray-500">{delivery.customerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{delivery.address}</p>
                      <p className="text-sm text-gray-500">{delivery.city} {delivery.postalCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.driverName || 'Non assigné'}
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
                  <TableCell>{delivery.totalAmount}€</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {delivery.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, 'assigned')}
                        >
                          Assigner
                        </Button>
                      )}
                      {delivery.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                        >
                          Récupérée
                        </Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                        >
                          En route
                        </Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                        >
                          Livrée
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
    </div>
  );
}