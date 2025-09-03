import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Minus, Clock, MapPin, CreditCard, Smartphone, Truck, Store } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  preparationTime: number;
  allergens?: string[];
  customizations?: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

interface CartItem {
  id: number;
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
  notes: string;
}

interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  orderType: 'pickup' | 'delivery' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  scheduledTime?: string;
  deliveryAddress?: string;
  paymentMethod: 'card' | 'cash' | 'mobile';
  paymentStatus: 'pending' | 'paid' | 'failed';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  estimatedReadyTime: string;
  specialInstructions?: string;
  createdAt: string;
}

const OnlineOrdering: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'dine_in'>('pickup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/menu/categories'],
  });

  const { data: onlineOrders = [], isLoading: ordersLoading } = useQuery<OnlineOrder[]>({
    queryKey: ['/api/orders/online'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<OnlineOrder>) => {
      const response = await fetch('/api/orders/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Erreur lors de la création de la commande');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/online'] });
      setCart([]);
      setIsCheckoutOpen(false);
      toast({ 
        title: 'Commande créée', 
        description: 'Votre commande a été enregistrée avec succès.' 
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/orders/online/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/online'] });
      toast({ title: 'Statut mis à jour', description: 'Le statut de la commande a été modifié.' });
    },
  });

  const addToCart = (menuItem: MenuItem, customizations: Record<string, string> = {}, notes?: string) => {
    const existingItemIndex = cart.findIndex(
      item => item.menuItem.id === menuItem.id && 
              JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex > -1) {
      const newCart = cart.map((ci, idx) => idx === existingItemIndex ? { ...ci, quantity: ci.quantity + 1 } : ci);
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        menuItem,
        quantity: 1,
        customizations,
        notes: notes ?? '',
      };
      setCart([...cart, newItem]);
    }
    
    toast({ title: 'Ajouté au panier', description: `${menuItem.name} ajouté à votre commande.` });
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      const customizationCost = Object.values(item.customizations).reduce((cost, option) => {
        // Calculate customization costs based on selected options
        return cost;
      }, 0);
      return total + (item.menuItem.price + customizationCost) * item.quantity;
    }, 0);

    const tax = subtotal * 0.2; // 20% TVA
    const deliveryFee = orderType === 'delivery' ? 2.50 : 0;
    
    return {
      subtotal,
      tax,
      deliveryFee,
      total: subtotal + tax + deliveryFee
    };
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.available && (selectedCategory === 'all' || item.category === selectedCategory)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <Store className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      case 'dine_in': return <MapPin className="w-4 h-4" />;
      default: return <Store className="w-4 h-4" />;
    }
  };

  const cartTotal = getCartTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commandes en Ligne</h2>
          <p className="text-muted-foreground">Système de commandes et interface client</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCheckoutOpen(true)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Panier ({cart.length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu">Menu & Commandes</TabsTrigger>
          <TabsTrigger value="orders">Gestion des Commandes</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button 
                variant={orderType === 'pickup' ? 'default' : 'outline'}
                onClick={() => setOrderType('pickup')}
              >
                <Store className="w-4 h-4 mr-2" />
                À emporter
              </Button>
              <Button 
                variant={orderType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setOrderType('delivery')}
              >
                <Truck className="w-4 h-4 mr-2" />
                Livraison
              </Button>
              <Button 
                variant={orderType === 'dine_in' ? 'default' : 'outline'}
                onClick={() => setOrderType('dine_in')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Sur place
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="secondary">{item.price.toFixed(2)}€</Badge>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{item.preparationTime} min</span>
                  </div>

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map((allergen) => (
                        <Badge key={allergen} variant="outline" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    onClick={() => addToCart(item)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter au panier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {onlineOrders.map((order) => (
              <Card key={order.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {order.customerInfo.name} • {order.total.toFixed(2)}€
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      {getOrderTypeIcon(order.orderType)}
                      <span className="ml-2 capitalize">{order.orderType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <span>Prêt à: {order.estimatedReadyTime}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="capitalize">{order.paymentMethod}</span>
                      <Badge 
                        variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Articles ({order.items.length}):</p>
                    {order.items.slice(0, 2).map((item, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-500">
                        +{order.items.length - 2} autres articles
                      </p>
                    )}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-sm">
                      <p className="font-medium">Instructions:</p>
                      <p className="text-gray-600 text-xs">{order.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'confirmed' })}
                      >
                        Confirmer
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'preparing' })}
                      >
                        Préparer
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'ready' })}
                      >
                        Prêt
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'completed' })}
                      >
                        Terminé
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finaliser la commande</DialogTitle>
            <DialogDescription>
              Vérifiez votre commande et complétez les informations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <img 
                  src={item.menuItem.imageUrl} 
                  alt={item.menuItem.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.menuItem.name}</h4>
                  <p className="text-sm text-gray-500">{item.menuItem.price.toFixed(2)}€</p>
                  {item.notes && (
                    <p className="text-xs text-gray-400">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Sous-total:</span>
              <span>{cartTotal.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>TVA (20%):</span>
              <span>{cartTotal.tax.toFixed(2)}€</span>
            </div>
            {cartTotal.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Frais de livraison:</span>
                <span>{cartTotal.deliveryFee.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{cartTotal.total.toFixed(2)}€</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Continuer mes achats
            </Button>
            <Button 
              onClick={() => {
                const orderData: Partial<OnlineOrder> = {
                  items: cart,
                  orderType,
                  subtotal: cartTotal.subtotal,
                  tax: cartTotal.tax,
                  deliveryFee: cartTotal.deliveryFee,
                  total: cartTotal.total,
                  customerInfo: {
                    name: "Client Test",
                    email: "client@test.com",
                    phone: "+33612345678"
                  },
                  paymentMethod: 'card',
                  paymentStatus: 'pending'
                };
                createOrderMutation.mutate(orderData);
              }}
              disabled={cart.length === 0}
            >
              Passer commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineOrdering;