import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, ShoppingCart, Plus, Minus, Coffee, Utensils, Cake, Sandwich } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const reservationSchema = insertReservationSchema.extend({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Numéro de téléphone invalide"),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  guests: z.number().min(1, "Au moins 1 invité requis").max(12, "Maximum 12 invités"),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface CartItem {
  menuItem: {
    id: number;
    name: string;
    price: string;
    description: string;
    categoryId: number;
  };
  quantity: number;
  notes?: string;
}

// Plus d'images SVG statiques - nous utilisons les vraies photos de la base de données

export default function InteractiveReservation() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [itemNotes, setItemNotes] = useState<{[key: number]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/categories'],
  });

  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/items'],
  });

  const reservationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/reservations', data);
    },
    onSuccess: () => {
      toast({
        title: "Réservation confirmée!",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      form.reset();
      setCart([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      date: "",
      time: "",
      guests: 2,
      specialRequests: "",
      status: "pending",
    },
  });

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        menuItem: item,
        quantity: 1,
        notes: itemNotes[item.id] || ""
      }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.menuItem.id !== itemId));
    }
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: notes }));
    setCart(cart.map(cartItem =>
      cartItem.menuItem.id === itemId
        ? { ...cartItem, notes }
        : cartItem
    ));
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (parseFloat(item.menuItem.price) * item.quantity), 0
  );

  const getItemQuantity = (itemId: number) => {
    const item = cart.find(cartItem => cartItem.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const filteredItems = activeCategory 
    ? menuItems.filter((item: any) => item.categoryId === activeCategory)
    : menuItems;

  const onSubmit = (data: ReservationFormData) => {
    const reservationData = {
      ...data,
      cartItems: cart.length > 0 ? cart : undefined,
    };
    
    reservationMutation.mutate(reservationData);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'cafés': return Coffee;
      case 'boissons': return Coffee;
      case 'pâtisseries': return Cake;
      case 'plats': return Utensils;
      default: return Sandwich;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-amber-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-dark mb-4">
            Réservez votre table
          </h1>
          <p className="text-lg text-coffee-medium">
            Choisissez vos plats à l'avance et savourez une expérience unique
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu et Sélection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtres par catégorie */}
            <Card className="bg-white/80 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coffee-dark">
                  <Utensils className="h-5 w-5" />
                  Notre Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant={activeCategory === null ? "default" : "outline"}
                    onClick={() => setActiveCategory(null)}
                    className="bg-coffee-accent hover:bg-coffee-dark"
                  >
                    Tout voir
                  </Button>
                  {categories.map((category: any) => {
                    const Icon = getCategoryIcon(category.name);
                    return (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? "default" : "outline"}
                        onClick={() => setActiveCategory(category.id)}
                        className="bg-coffee-accent hover:bg-coffee-dark"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>

                {/* Grille des produits */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredItems.map((item: any) => {
                    const quantity = getItemQuantity(item.id);
                    
                    return (
                      <Card key={item.id} className="bg-white/90 backdrop-blur-sm border-coffee-light/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-coffee-light/20">
                            <img 
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&h=200&q=80'}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&h=200&q=80';
                              }}
                            />
                          </div>
                          
                          <h3 className="font-semibold text-coffee-dark mb-1">{item.name}</h3>
                          <p className="text-sm text-coffee-medium mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-coffee-accent">{item.price}€</span>
                            
                            <div className="flex items-center gap-2">
                              {quantity > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {quantity > 0 && (
                                <Badge variant="secondary" className="px-2 py-1">
                                  {quantity}
                                </Badge>
                              )}
                              
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-8 w-8 p-0 bg-coffee-accent hover:bg-coffee-dark"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation et panier */}
          <div className="space-y-6">
            {/* Panier */}
            {cart.length > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm border-coffee-light/30 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-coffee-dark">
                    <ShoppingCart className="h-5 w-5" />
                    Votre Sélection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between items-start p-3 bg-coffee-light/10 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-coffee-dark">{item.menuItem.name}</h4>
                        <p className="text-sm text-coffee-medium">
                          {item.quantity} × {item.menuItem.price}€
                        </p>
                        <Input
                          placeholder="Notes spéciales..."
                          value={item.notes || ""}
                          onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                          className="mt-2 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item.menuItem)}
                          className="h-6 w-6 p-0 bg-coffee-accent hover:bg-coffee-dark"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold text-coffee-dark">
                      <span>Total:</span>
                      <span>{cartTotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulaire de réservation */}
            <Card className="bg-white/90 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coffee-dark">
                  <Calendar className="h-5 w-5" />
                  Informations de réservation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nom complet</Label>
                      <Input
                        {...form.register("customerName")}
                        placeholder="Votre nom"
                        className="mt-1"
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        {...form.register("customerEmail")}
                        type="email"
                        placeholder="votre@email.com"
                        className="mt-1"
                      />
                      {form.formState.errors.customerEmail && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Téléphone</Label>
                      <Input
                        {...form.register("customerPhone")}
                        placeholder="06 12 34 56 78"
                        className="mt-1"
                      />
                      {form.formState.errors.customerPhone && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          {...form.register("date")}
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1"
                        />
                        {form.formState.errors.date && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="time">Heure</Label>
                        <Input
                          {...form.register("time")}
                          type="time"
                          className="mt-1"
                        />
                        {form.formState.errors.time && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.time.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guests">Nombre d'invités</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-coffee-medium" />
                        <Input
                          {...form.register("guests", { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="12"
                          className="flex-1"
                        />
                      </div>
                      {form.formState.errors.guests && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.guests.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Demandes spéciales</Label>
                      <Textarea
                        {...form.register("specialRequests")}
                        placeholder="Allergies, préférences..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-coffee-accent hover:bg-coffee-dark"
                    disabled={reservationMutation.isPending}
                  >
                    {reservationMutation.isPending ? (
                      "Confirmation en cours..."
                    ) : (
                      `Confirmer la réservation${cart.length > 0 ? ` (${cartTotal.toFixed(2)}€)` : ""}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}