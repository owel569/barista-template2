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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, DollarSign, Package, Plus, Minus, ShoppingCart, ImageIcon, Upload } from "lucide-react";
import { z } from "zod";

// Schema pour nouvelle commande
const newOrderSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Téléphone requis"),
  orderType: z.string().min(1, "Type de commande requis"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

// Schema pour nouvel article
const newMenuItemSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().min(10, "Description requise"),
  price: z.string().min(1, "Prix requis"),
  categoryId: z.number().min(1, "Catégorie requise"),
  available: z.boolean().default(true),
});

type NewOrderData = z.infer<typeof newOrderSchema>;
type NewMenuItemData = z.infer<typeof newMenuItemSchema>;

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  status: string;
  totalAmount: string;
  notes?: string;
  tableId?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  price: string;
  notes?: string;
  menuItem?: {
    id: number;
    name: string;
    description: string;
    price: string;
  };
}

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

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusLabels = {
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prêt",
  completed: "Terminé",
  cancelled: "Annulé"
};

export default function EnhancedOrderManagement() {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderCart, setOrderCart] = useState<CartItem[]>([]);
  const [itemImage, setItemImage] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/items'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/categories'],
  });

  const orderForm = useForm<NewOrderData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      orderType: "dine-in",
      status: "pending",
      notes: "",
    },
  });

  const itemForm = useForm<NewMenuItemData>({
    resolver: zodResolver(newMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: 1,
      available: true,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { orderData: NewOrderData; cartItems: CartItem[] }) => {
      // Calculer le total
      const totalAmount = data.cartItems.reduce((total, item) => 
        total + (parseFloat(item.menuItem.price) * item.quantity), 0
      );

      const orderPayload = {
        ...data.orderData,
        totalAmount: totalAmount.toFixed(2),
        items: data.cartItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: item.notes || "",
        })),
      };

      return apiRequest('POST', '/api/orders', orderPayload);
    },
    onSuccess: () => {
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsOrderDialogOpen(false);
      setOrderCart([]);
      orderForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: NewMenuItemData & { imageUrl?: string }) => {
      return apiRequest('POST', '/api/menu/items', data);
    },
    onSuccess: () => {
      toast({
        title: "Article ajouté",
        description: "Le nouvel article a été ajouté au menu.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      setIsItemDialogOpen(false);
      setItemImage("");
      itemForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout de l'article",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });

  const addToOrderCart = (item: any) => {
    const existingItem = orderCart.find(cartItem => cartItem.menuItem.id === item.id);
    
    if (existingItem) {
      setOrderCart(orderCart.map(cartItem =>
        cartItem.menuItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setOrderCart([...orderCart, {
        menuItem: item,
        quantity: 1,
        notes: ""
      }]);
    }
  };

  const removeFromOrderCart = (itemId: number) => {
    const existingItem = orderCart.find(cartItem => cartItem.menuItem.id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setOrderCart(orderCart.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setOrderCart(orderCart.filter(cartItem => cartItem.menuItem.id !== itemId));
    }
  };

  const getItemQuantity = (itemId: number) => {
    const item = orderCart.find(cartItem => cartItem.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = orderCart.reduce((total, item) => 
    total + (parseFloat(item.menuItem.price) * item.quantity), 0
  );

  const onSubmitOrder = (data: NewOrderData) => {
    if (orderCart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles à la commande.",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate({ orderData: data, cartItems: orderCart });
  };

  const onSubmitMenuItem = (data: NewMenuItemData) => {
    createMenuItemMutation.mutate({ ...data, imageUrl: itemImage });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setItemImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-coffee-dark">Gestion des Commandes</h2>
          <p className="text-coffee-medium">Gérez les commandes et ajoutez de nouveaux articles</p>
        </div>
        <div className="flex gap-2">
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
                  Saisissez les informations du client et sélectionnez les articles
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informations Client</TabsTrigger>
                  <TabsTrigger value="items">Articles ({orderCart.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <form onSubmit={orderForm.handleSubmit(onSubmitOrder)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Nom du client</Label>
                        <Input
                          {...orderForm.register("customerName")}
                          placeholder="Nom complet"
                        />
                        {orderForm.formState.errors.customerName && (
                          <p className="text-sm text-red-600 mt-1">
                            {orderForm.formState.errors.customerName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="customerEmail">Email</Label>
                        <Input
                          {...orderForm.register("customerEmail")}
                          type="email"
                          placeholder="email@exemple.com"
                        />
                        {orderForm.formState.errors.customerEmail && (
                          <p className="text-sm text-red-600 mt-1">
                            {orderForm.formState.errors.customerEmail.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="customerPhone">Téléphone</Label>
                        <Input
                          {...orderForm.register("customerPhone")}
                          placeholder="06 12 34 56 78"
                        />
                        {orderForm.formState.errors.customerPhone && (
                          <p className="text-sm text-red-600 mt-1">
                            {orderForm.formState.errors.customerPhone.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="orderType">Type de commande</Label>
                        <Select onValueChange={(value) => orderForm.setValue("orderType", value)} defaultValue="dine-in">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dine-in">Sur place</SelectItem>
                            <SelectItem value="takeaway">À emporter</SelectItem>
                            <SelectItem value="delivery">Livraison</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (optionnel)</Label>
                      <Textarea
                        {...orderForm.register("notes")}
                        placeholder="Notes spéciales pour la commande..."
                        rows={3}
                      />
                    </div>

                    {orderCart.length > 0 && (
                      <div className="bg-coffee-light/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Résumé de la commande</h4>
                        <div className="space-y-2">
                          {orderCart.map((item) => (
                            <div key={item.menuItem.id} className="flex justify-between">
                              <span>{item.menuItem.name} x{item.quantity}</span>
                              <span>{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 font-semibold">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span>{cartTotal.toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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
                </TabsContent>

                <TabsContent value="items" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-auto">
                    {menuItems.map((item: any) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <Card key={item.id} className="bg-white/90">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-coffee-dark">{item.name}</h4>
                            <p className="text-sm text-coffee-medium mb-2">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-coffee-accent">{item.price}€</span>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromOrderCart(item.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge variant="secondary">{quantity}</Badge>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToOrderCart(item)}
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
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-coffee-accent text-coffee-accent hover:bg-coffee-accent hover:text-white">
                <Package className="h-4 w-4 mr-2" />
                Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel article</DialogTitle>
                <DialogDescription>
                  Créez un nouvel article pour le menu avec son image
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={itemForm.handleSubmit(onSubmitMenuItem)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de l'article</Label>
                  <Input
                    {...itemForm.register("name")}
                    placeholder="Ex: Café Latte Premium"
                  />
                  {itemForm.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {itemForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    {...itemForm.register("description")}
                    placeholder="Décrivez l'article en détail..."
                    rows={3}
                  />
                  {itemForm.formState.errors.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {itemForm.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      {...itemForm.register("price")}
                      type="number"
                      step="0.01"
                      placeholder="4.50"
                    />
                    {itemForm.formState.errors.price && (
                      <p className="text-sm text-red-600 mt-1">
                        {itemForm.formState.errors.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Catégorie</Label>
                    <Select onValueChange={(value) => itemForm.setValue("categoryId", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">Image de l'article</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {itemImage && (
                      <div className="w-32 h-32 border rounded-lg overflow-hidden">
                        <img 
                          src={itemImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMenuItemMutation.isPending}
                    className="bg-coffee-accent hover:bg-coffee-dark"
                  >
                    {createMenuItemMutation.isPending ? "Ajout..." : "Ajouter l'article"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-coffee-dark">
              Total Commandes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coffee-dark">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-coffee-dark">
              En préparation
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coffee-dark">
              {orders.filter(order => order.status === 'preparing').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-coffee-dark">
              Prêtes
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coffee-dark">
              {orders.filter(order => order.status === 'ready').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-coffee-dark">
              Chiffre d'affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coffee-dark">
              {orders.reduce((total, order) => total + parseFloat(order.totalAmount || '0'), 0).toFixed(2)}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
        <CardHeader>
          <CardTitle className="text-coffee-dark">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-coffee-medium">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.orderType}</TableCell>
                  <TableCell className="font-medium">{order.totalAmount}€</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => updateOrderStatusMutation.mutate({ id: order.id, status: value })}
                      defaultValue={order.status}
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
        </CardContent>
      </Card>
    </div>
  );
}