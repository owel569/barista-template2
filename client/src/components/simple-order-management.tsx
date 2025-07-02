import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, DollarSign, Package, Plus, Minus, ShoppingCart } from "lucide-react";
import { z } from "zod";

// Schema pour nouvelle commande
const orderSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Téléphone requis"),
  orderType: z.string().default("dine-in"),
  totalAmount: z.string().default("0.00"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

type OrderData = z.infer<typeof orderSchema>;

interface CartItem {
  menuItem: {
    id: number;
    name: string;
    price: string;
    description: string;
  };
  quantity: number;
  notes?: string;
}

const statusLabels = {
  pending: "En attente",
  preparing: "En préparation", 
  ready: "Prêt",
  completed: "Terminé",
  cancelled: "Annulé"
};

export default function SimpleOrderManagement() {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderCart, setOrderCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
  });

  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/items'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/categories'],
  });

  const orderForm = useForm<OrderData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      orderType: "dine-in",
      totalAmount: "0.00",
      status: "pending",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderData) => {
      return apiRequest('/api/orders', 'POST', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsOrderDialogOpen(false);
      setOrderCart([]);
      orderForm.reset();
      toast({
        title: "Commande créée",
        description: "La commande a été enregistrée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande.",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/orders/${id}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (menuItem: any) => {
    const existingItem = orderCart.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setOrderCart(orderCart.map(item => 
        item.menuItem.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderCart([...orderCart, { menuItem, quantity: 1 }]);
    }
    updateOrderTotal();
  };

  const removeFromCart = (itemId: number) => {
    const existingItem = orderCart.find(item => item.menuItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setOrderCart(orderCart.map(item => 
        item.menuItem.id === itemId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setOrderCart(orderCart.filter(item => item.menuItem.id !== itemId));
    }
    updateOrderTotal();
  };

  const getItemQuantity = (itemId: number) => {
    const item = orderCart.find(item => item.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateOrderTotal = () => {
    const total = orderCart.reduce((sum, item) => 
      sum + (parseFloat(item.menuItem.price) * item.quantity), 0
    );
    orderForm.setValue("totalAmount", total.toFixed(2));
  };

  const cartTotal = orderCart.reduce((total, item) => 
    total + (parseFloat(item.menuItem.price) * item.quantity), 0
  );

  const onSubmitOrder = (data: OrderData) => {
    const orderWithTotal = {
      ...data,
      totalAmount: cartTotal.toFixed(2)
    };
    createOrderMutation.mutate(orderWithTotal);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-coffee-dark">Gestion des Commandes</h2>
          <p className="text-coffee-medium">Créez et gérez les commandes clients</p>
        </div>
        <div className="flex gap-2">
          {/* Bouton Nouvelle Commande */}
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-coffee-accent hover:bg-coffee-dark">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Commande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle commande</DialogTitle>
                <DialogDescription>
                  Remplissez les informations et sélectionnez les articles
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulaire client */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations Client</h3>
                  <form onSubmit={orderForm.handleSubmit(onSubmitOrder)} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Nom du client</Label>
                      <Input
                        {...orderForm.register("customerName")}
                        placeholder="Nom complet"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        {...orderForm.register("customerEmail")}
                        type="email"
                        placeholder="email@exemple.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone">Téléphone</Label>
                      <Input
                        {...orderForm.register("customerPhone")}
                        placeholder="0123456789"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="orderType">Type de commande</Label>
                      <Select onValueChange={(value) => orderForm.setValue("orderType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dine-in">Sur place</SelectItem>
                          <SelectItem value="takeaway">À emporter</SelectItem>
                          <SelectItem value="delivery">Livraison</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes (optionnel)</Label>
                      <Textarea
                        {...orderForm.register("notes")}
                        placeholder="Instructions spéciales..."
                        rows={3}
                      />
                    </div>

                    {/* Panier récapitulatif */}
                    <div className="bg-coffee-light/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Panier ({orderCart.length} articles)</h4>
                      {orderCart.length === 0 ? (
                        <p className="text-sm text-coffee-medium">Aucun article sélectionné</p>
                      ) : (
                        <div className="space-y-2">
                          {orderCart.map((item) => (
                            <div key={item.menuItem.id} className="flex justify-between items-center text-sm">
                              <span>{item.menuItem.name} x{item.quantity}</span>
                              <span className="font-medium">{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span>{cartTotal.toFixed(2)}€</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createOrderMutation.isPending || orderCart.length === 0}
                        className="bg-coffee-accent hover:bg-coffee-dark"
                      >
                        {createOrderMutation.isPending ? "Création..." : "Créer la commande"}
                      </Button>
                    </DialogFooter>
                  </form>
                </div>

                {/* Sélection des articles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sélectionner les articles</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {menuItems.map((item: any) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <Card key={item.id} className="p-3">
                          <CardContent className="p-0">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <h4 className="font-semibold text-coffee-dark text-sm">{item.name}</h4>
                                <p className="text-xs text-coffee-medium mb-2">{item.description}</p>
                                <span className="text-sm font-bold text-coffee-accent">{item.price}€</span>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {quantity > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge variant="secondary" className="text-xs px-1">{quantity}</Badge>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="h-6 w-6 p-0 bg-coffee-accent hover:bg-coffee-dark"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-coffee-medium">
              Commandes enregistrées
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter((order: any) => order.status === 'preparing').length}
            </div>
            <p className="text-xs text-coffee-medium">
              Commandes en cours
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((order: any) => order.status === 'completed').length}
            </div>
            <p className="text-xs text-coffee-medium">
              Commandes finalisées
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders
                .filter((order: any) => order.status === 'completed')
                .reduce((total: number, order: any) => total + parseFloat(order.totalAmount || '0'), 0)
                .toFixed(2)}€
            </div>
            <p className="text-xs text-coffee-medium">
              Revenus générés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-coffee-dark">Commandes Récentes</CardTitle>
          <CardDescription>Gérez et suivez l'état des commandes</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-coffee-medium">
              Aucune commande pour le moment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>{order.customerEmail}</TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>{order.totalAmount}€</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.status} 
                        onValueChange={(newStatus) => updateOrderStatusMutation.mutate({ id: order.id, status: newStatus })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="preparing">En préparation</SelectItem>
                          <SelectItem value="ready">Prêt</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}