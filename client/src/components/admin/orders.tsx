import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Order, OrderItem } from '../../../types/admin';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, ShoppingCart, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrdersProps {
  userRole?: 'directeur' | 'employe';
}

export default function Orders({ userRole = 'directeur' }: OrdersProps) {
  const { hasPermission } = usePermissions(userRole);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    retry: 3,
    retryDelay: 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'Succès',
        description: 'Statut de la commande mis à jour',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'Succès',
        description: 'Commande supprimée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de la commande',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_preparation': return 'bg-blue-100 text-blue-800';
      case 'pret': return 'bg-green-100 text-green-800';
      case 'livre': return 'bg-gray-100 text-gray-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente': return <Clock className="h-4 w-4" />;
      case 'en_preparation': return <ShoppingCart className="h-4 w-4" />;
      case 'pret': return <CheckCircle className="h-4 w-4" />;
      case 'livre': return <CheckCircle className="h-4 w-4" />;
      case 'annule': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Calculer les statistiques
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'en_attente').length;
  const preparingOrders = orders.filter(order => order.status === 'en_preparation').length;
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (isLoading) {
    return <div className="p-6">Chargement des commandes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Gérez toutes les commandes clients</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{preparingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les commandes</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_preparation">En préparation</SelectItem>
                <SelectItem value="pret">Prêt</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{(order as any).customerName || 'Client anonyme'}</div>
                      <div className="text-sm text-muted-foreground">{(order as any).customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {typeof order.totalAmount === 'string' 
                      ? parseFloat(order.totalAmount).toFixed(2) 
                      : order.totalAmount.toFixed(2)}€
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission('orders', 'edit') && (
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_attente">En attente</SelectItem>
                            <SelectItem value="en_preparation">En préparation</SelectItem>
                            <SelectItem value="pret">Prêt</SelectItem>
                            <SelectItem value="livre">Livré</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {hasPermission('orders', 'delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails de commande */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette commande
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Informations client</h3>
                  <p>Nom: {(selectedOrder as any).customerName || 'Non spécifié'}</p>
                  <p>Email: {(selectedOrder as any).customerEmail || 'Non spécifié'}</p>
                  <p>Téléphone: {(selectedOrder as any).customerPhone || 'Non spécifié'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Détails commande</h3>
                  <p>Date: {format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                  <p>Statut: <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
                  <p>Total: {typeof selectedOrder.totalAmount === 'string' 
                    ? parseFloat(selectedOrder.totalAmount).toFixed(2) 
                    : selectedOrder.totalAmount.toFixed(2)}€</p>
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}