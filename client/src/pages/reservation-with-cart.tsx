import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Coffee,
  Utensils,
  MapPin,
  Phone,
  Mail,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { PhoneInput } from "@/components/ui/phone-input"; // Commenté si non disponible
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
}

interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

type ReservationFormData = z.infer<typeof insertReservationSchema>;

export default function ReservationWithCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(insertReservationSchema),
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

  // Récupération des catégories de menu
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
    queryFn: () => apiRequest("GET", "/api/menu/categories").then(res => res.json()),
  });

  // Récupération des articles du menu
  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu/items"],
    queryFn: () => apiRequest("GET", "/api/menu/items").then(res => res.json()),
  });

  // Sélectionner la première catégorie par défaut
  useEffect(() => {
    if (categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Mutation pour créer la réservation
  const createReservationMutation = useMutation({
    mutationFn: (data: ReservationFormData & { cartItems: CartItem[] }) => 
      apiRequest("POST", "/api/reservations", data),
    onSuccess: () => {
      toast({
        title: "Réservation confirmée!",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      reset();
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
    
    toast({
      title: "Article ajouté",
      description: `${menuItem.name} ajouté au panier`,
    });
  };

  const updateQuantity = (menuItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (parseFloat(item.menuItem.price) * item.quantity);
    }, 0).toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const onSubmit = (data: ReservationFormData) => {
    const reservationData = {
      ...data,
      cartItems: cart,
    };
    createReservationMutation.mutate(reservationData);
  };

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item: MenuItem) => item.categoryId === selectedCategory && item.available)
    : menuItems.filter((item: MenuItem) => item.available);

  const timeSlots = [
    "11:30", "12:00", "12:30", "13:00", "13:30", "14:00",
    "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-cream via-white to-coffee-light">
      <Navigation />
      
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-coffee-dark mb-4">
            Réservation avec Précommande
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Réservez votre table et précommandez vos plats favoris pour une expérience optimale
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu et Panier */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-coffee-secondary">
              <CardHeader className="bg-gradient-to-r from-coffee-primary to-coffee-accent text-white">
                <CardTitle className="flex items-center">
                  <Utensils className="mr-2 h-5 w-5" />
                  Menu & Précommande
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={selectedCategory?.toString()} onValueChange={(value) => setSelectedCategory(parseInt(value))}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                    {categories.map((category: MenuCategory) => (
                      <TabsTrigger key={category.id} value={category.id.toString()}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {categories.map((category: MenuCategory) => (
                    <TabsContent key={category.id} value={category.id.toString()}>
                      <div className="grid gap-4">
                        {filteredMenuItems.map((item: MenuItem) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border border-coffee-light rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex-1">
                              <h3 className="font-semibold text-coffee-dark">{item.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              <span className="text-coffee-accent font-bold">{item.price}€</span>
                            </div>
                            <Button
                              onClick={() => addToCart(item)}
                              className="bg-coffee-accent hover:bg-coffee-primary text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Panier flottant */}
                {cart.length > 0 && (
                  <div className="fixed bottom-4 right-4 z-50">
                    <Button
                      onClick={() => setShowCart(!showCart)}
                      className="bg-coffee-accent hover:bg-coffee-primary text-white rounded-full p-4 shadow-lg"
                    >
                      <ShoppingCart className="h-6 w-6" />
                      <Badge className="absolute -top-2 -right-2 bg-red-500">
                        {getCartItemCount()}
                      </Badge>
                    </Button>
                  </div>
                )}

                {/* Panier détaillé */}
                {showCart && cart.length > 0 && (
                  <Card className="mt-6 border-coffee-accent">
                    <CardHeader className="bg-coffee-accent text-white">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Votre Panier
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCart(false)}
                          className="text-white hover:bg-white/20"
                        >
                          ×
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {cart.map((item) => (
                        <div key={item.menuItem.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.menuItem.name}</h4>
                            <p className="text-sm text-gray-600">{item.menuItem.price}€</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.menuItem.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 mt-4 border-t">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-coffee-accent">{getCartTotal()}€</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation */}
          <div>
            <Card className="shadow-xl border-coffee-secondary">
              <CardHeader className="bg-gradient-to-r from-coffee-primary to-coffee-accent text-white">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Informations de Réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nom complet</Label>
                      <Input
                        id="customerName"
                        {...register("customerName")}
                        className="border-coffee-secondary focus:border-coffee-accent"
                      />
                      {errors.customerName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        {...register("customerEmail")}
                        className="border-coffee-secondary focus:border-coffee-accent"
                      />
                      {errors.customerEmail && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.customerEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Téléphone</Label>
                      <Input
                        id="customerPhone"
                        {...register("customerPhone")}
                        placeholder="Ex: +33612345678"
                        className="border-coffee-secondary focus:border-coffee-accent"
                      />
                      {errors.customerPhone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.customerPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          {...register("date")}
                          min={new Date().toISOString().split('T')[0]}
                          className="border-coffee-secondary focus:border-coffee-accent"
                        />
                        {errors.date && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="time">Heure</Label>
                        <select
                          id="time"
                          {...register("time")}
                          className="w-full p-2 border border-coffee-secondary rounded-md focus:border-coffee-accent"
                        >
                          <option value="">Choisir l'heure</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.time && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.time.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guests">Nombre de personnes</Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max="8"
                        {...register("guests", { valueAsNumber: true })}
                        className="border-coffee-secondary focus:border-coffee-accent"
                      />
                      {errors.guests && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.guests.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Demandes spéciales</Label>
                      <Textarea
                        id="specialRequests"
                        {...register("specialRequests")}
                        className="border-coffee-secondary focus:border-coffee-accent"
                        placeholder="Allergies, préférences de table, etc."
                      />
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <div className="bg-coffee-cream p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Résumé de la précommande:</h3>
                      <ul className="text-sm space-y-1">
                        {cart.map((item) => (
                          <li key={item.menuItem.id} className="flex justify-between">
                            <span>{item.quantity}x {item.menuItem.name}</span>
                            <span>{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}€</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                        <span>Total précommande:</span>
                        <span className="text-coffee-accent">{getCartTotal()}€</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={createReservationMutation.isPending}
                    className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {createReservationMutation.isPending ? "Réservation en cours..." : "Confirmer la réservation"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}