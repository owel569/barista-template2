import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, MapPin, Clock, Phone, Package, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  estimatedTime: string;
  deliveryDriver?: string;
  progress: number;
  total: number;
  createdAt: string;
}

const DeliveryTracking: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['/api/deliveries'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      toast({ title: 'Statut mis à jour', description: 'Le statut de livraison a été modifié.' });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-orange-500';
      case 'dispatched': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prêt';
      case 'dispatched': return 'En livraison';
      case 'delivered': return 'Livré';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'preparing': return 30;
      case 'ready': return 60;
      case 'dispatched': return 85;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
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
          <h2 className="text-2xl font-bold">Suivi des Livraisons</h2>
          <p className="text-muted-foreground">Gérez et suivez toutes les livraisons en cours</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Package className="w-4 h-4 mr-2" />
          Nouvelle Livraison
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliveries.map((delivery: DeliveryOrder) => (
          <Card key={delivery.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{delivery.orderNumber}</CardTitle>
                <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                  {getStatusLabel(delivery.status)}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {delivery.customerName} • {delivery.total.toFixed(2)}€
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="truncate">{delivery.deliveryAddress}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Estimé: {delivery.estimatedTime}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{delivery.customerPhone}</span>
                </div>
                {delivery.deliveryDriver && (
                  <div className="flex items-center text-sm">
                    <Truck className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{delivery.deliveryDriver}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{getProgressPercentage(delivery.status)}%</span>
                </div>
                <Progress value={getProgressPercentage(delivery.status)} className="h-2" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Articles:</p>
                {delivery.items.slice(0, 2).map((item, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {item.quantity}x {item.name}
                  </p>
                ))}
                {delivery.items.length > 2 && (
                  <p className="text-sm text-gray-500">
                    +{delivery.items.length - 2} autres articles
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                {delivery.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: 'preparing' })}
                  >
                    Commencer
                  </Button>
                )}
                {delivery.status === 'preparing' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: 'ready' })}
                  >
                    Prêt
                  </Button>
                )}
                {delivery.status === 'ready' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: 'dispatched' })}
                  >
                    Expédier
                  </Button>
                )}
                {delivery.status === 'dispatched' && (
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: 'delivered' })}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Livré
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deliveries.length === 0 && (
        <Card className="p-8 text-center">
          <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune livraison en cours</h3>
          <p className="text-gray-500">Les nouvelles livraisons apparaîtront ici</p>
        </Card>
      )}
    </div>
  );
};

export default DeliveryTracking;