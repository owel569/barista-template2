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
import { Clock, DollarSign, Package, Plus, Minus, ShoppingCart, ImageIcon } from "lucide-react";
import { z } from "zod";

// Schema simplifié pour nouvelle commande
const orderSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Téléphone requis"),
  orderType: z.string().default("dine-in"),
  totalAmount: z.string().default("0.00"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

// Schema pour nouvel article
const menuItemSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().min(5, "Description requise"),
  price: z.string().min(1, "Prix requis"),
  categoryId: z.number().min(1, "Catégorie requise"),
  available: z.boolean().default(true),
});

type OrderData = z.infer<typeof orderSchema>;
type MenuItemData = z.infer<typeof menuItemSchema>;

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

export default function SimpleOrderManagement() {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [orderCart, setOrderCart] = useState<CartItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
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

  const itemForm = useForm<MenuItemData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: 1,
      available: true,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderData) => {
      return apiRequest('/api/orders', 'POST', orderData);
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
      console.error("Erreur création commande:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemData) => {
      return apiRequest('/api/menu/items', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Article ajouté",
        description: "Le nouvel article a été ajouté au menu.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      setIsItemDialogOpen(false);
      setImagePreview("");
      itemForm.reset();
    },
    onError: (error: any) => {
      console.error("Erreur création article:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout de l'article",
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
        description: "Le statut de la commande a été mis à jour.",
      });
    },
  });

  const addToCart = (item: any) => {
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
    updateOrderTotal();
  };

  const removeFromCart = (itemId: number) => {
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
    updateOrderTotal();
  };

  const getItemQuantity = (itemId: number) => {
    const item = orderCart.find(cartItem => cartItem.menuItem.id === itemId);
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

  const onSubmitMenuItem = (data: MenuItemData) => {
    createMenuItemMutation.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-coffee-dark">Gestion des Commandes</h2>
          <p className="text-coffee-medium">Créez des commandes et ajoutez de nouveaux articles au menu</p>
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

                    <div>
                      <Label htmlFor="notes">Notes (optionnel)</Label>
                      <Textarea
                        {...orderForm.register("notes")}
                        placeholder="Notes spéciales..."
                        rows={3}
                      />
                    </div>

                    {cartTotal > 0 && (
                      <div className="bg-coffee-light/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Résumé ({orderCart.length} articles)</h4>
                        <div className="space-y-1">
                          {orderCart.map((item) => (
                            <div key={item.menuItem.id} className="flex justify-between text-sm">
                              <span>{item.menuItem.name} x{item.quantity}</span>
                              <span>{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 font-semibold flex justify-between">
                            <span>Total:</span>
                            <span>{cartTotal.toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createOrderMutation.isPending}
                        className="bg-coffee-accent hover:bg-coffee-dark w-full"
                      >
                        {createOrderMutation.isPending ? "Création..." : "Créer la commande"}
                      </Button>
                    </DialogFooter>
                  </form>
                </div>

                {/* Sélection d'articles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sélection d'articles</h3>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-auto">
                    {menuItems.map((item: any) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <Card key={item.id} className="bg-white/90">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
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

          {/* Bouton Nouvel Article */}
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
                  Créez un nouvel article pour le menu
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
                    placeholder="Décrivez l'article..."
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
                        <SelectValue placeholder="Choisir..." />
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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-2 w-24 h-24 border rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En préparation</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((order: any) => order.status === 'preparing').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêtes</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((order: any) => order.status === 'ready').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-coffee-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((total: number, order: any) => total + parseFloat(order.totalAmount || '0'), 0).toFixed(2)}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
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
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune commande pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}