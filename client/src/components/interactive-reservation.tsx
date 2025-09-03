
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertReservationSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Users, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Coffee, 
  Utensils, 
  Cake, 
  Sandwich,
  Wine,
  IceCream,
  ChefHat
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { getItemImageUrl } from '@/lib/image-mapping';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types stricts pour la logique métier
interface MenuItem {
  id: number;
  name: string;
  price: string;
  description: string;
  categoryId: number;
  category?: string;
  dietaryTags?: string[];
  preparationTime?: number;
  isAvailable: boolean;
  allergens?: string[];
  spicyLevel?: 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  specialRequests?: string;
  customizations?: Record<string, string>;
}

interface TimeSlot {
  time: string;
  available: boolean;
  remainingSeats: number;
  duration: number;
  price?: number;
}

interface ReservationExtras {
  tableType: 'standard' | 'premium' | 'vip';
  decorations: boolean;
  musicPreference?: 'ambient' | 'jazz' | 'classical' | 'none';
  specialServices: string[];
}

// Schéma de validation étendu et sécurisé
const reservationSchema = insertReservationSchema.extend({
  customerName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Nom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Nom invalide'),
  customerEmail: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long'),
  customerPhone: z.string()
    .min(10, 'Numéro de téléphone invalide')
    .max(20, 'Numéro trop long')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Format de téléphone invalide'),
  date: z.string()
    .min(1, 'Date requise')
    .refine((date) => new Date(date) > new Date(), 'La date doit être dans le futur'),
  time: z.string().min(1, 'Heure requise'),
  guests: z.number()
    .min(1, 'Au moins 1 invité requis')
    .max(20, 'Maximum 20 invités'),
  tablePreference: z.enum(['indoor', 'outdoor', 'window', 'bar', 'private', 'none']).optional(),
  occasion: z.enum(['none', 'birthday', 'anniversary', 'business', 'date', 'celebration']).optional(),
  specialRequests: z.string().max(500, 'Demandes trop longues').optional()
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export default function InteractiveReservation() {
  // États locaux optimisés
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'budget' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popular'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hooks de données avec gestion d'erreur améliorée
  const { data: categories = [], isLoading: isCategoriesLoading, error: categoriesError } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/menu/categories');
      if (!response.ok) {
        throw new Error('Erreur de chargement des catégories');
      }
      const data = await response.json();
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000
  });

  const { data: menuItems = [], isLoading: isMenuLoading, error: menuError } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/menu/items');
      if (!response.ok) {
        throw new Error('Erreur de chargement du menu');
      }
      const data = await response.json();
      return data.data || data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: 1000
  });

  const { data: availableTimeSlots = [], isLoading: isTimeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/reservations/timeslots', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const response = await apiRequest('GET', `/api/reservations/timeslots?date=${selectedDate}`);
      if (!response.ok) {
        throw new Error('Erreur de chargement des créneaux');
      }
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!selectedDate,
    staleTime: 60 * 1000,
    retry: 2
  });

  // Mutation optimisée avec gestion d'erreur
  const reservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const reservationData = {
        ...data,
        status: 'pending' as const,
        cartItems: cart.length > 0 ? cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes,
          specialRequests: item.specialRequests,
          customizations: item.customizations
        })) : undefined,
        totalAmount: cartTotal,
        estimatedDuration: calculateEstimatedDuration(),
        source: 'web_reservation'
      };
      
      const response = await apiRequest('POST', '/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      } as RequestInit);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la réservation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Réservation confirmée! 🎉',
        description: `Votre réservation #${data.id} a été enregistrée avec succès. Un email de confirmation vous sera envoyé.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de réservation',
        description: error.message || 'Une erreur est survenue lors de la réservation',
        variant: 'destructive',
      });
    },
  });

  // Formulaire avec validation améliorée
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      date: '',
      time: '',
      guests: 2,
      specialRequests: '',
      status: 'pending',
      tablePreference: 'none',
      occasion: 'none'
    },
    mode: 'onChange'
  });

  // Fonctions utilitaires
  const resetForm = () => {
    form.reset();
    setCart([]);
    setItemNotes({});
    setSelectedDate('');
    setSearchTerm('');
    setDietaryFilter('all');
    setPriceFilter('all');
  };

  const calculateEstimatedDuration = (): number => {
    const baseTime = 60; // 1 heure de base
    const itemsTime = cart.reduce((total, item) => {
      return total + (item.menuItem.preparationTime || 15) * item.quantity;
    }, 0);
    return Math.max(baseTime, Math.ceil(itemsTime / cart.length) + 30);
  };

  // Gestion du panier optimisée
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast({
        title: 'Indisponible',
        description: 'Cet article n\'est pas disponible pour le moment',
        variant: 'destructive',
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === item.id);

      if (existingItem) {
        if (existingItem.quantity >= 10) {
          toast({
            title: 'Limite atteinte',
            description: 'Maximum 10 exemplaires par article',
            variant: 'destructive',
          });
          return prevCart;
        }

        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        const newItem = {
          menuItem: item,
          quantity: 1,
          notes: itemNotes[item.id] || '',
          specialRequests: '',
          customizations: {}
        };
        
        toast({
          title: 'Ajouté au panier',
          description: `${item.name} a été ajouté à votre sélection`,
        });
        
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === itemId);

      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.menuItem.id !== itemId);
      }
    });
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    if (notes.length > 200) return;
    
    setItemNotes(prev => ({ ...prev, [itemId]: notes }));
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, notes }
          : cartItem
      )
    );
  };

  const updateSpecialRequests = (itemId: number, requests: string) => {
    if (requests.length > 200) return;
    
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, specialRequests: requests }
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setItemNotes({});
    toast({
      title: 'Panier vidé',
      description: 'Votre sélection a été supprimée',
    });
  };

  // Calculs mémorisés
  const cartTotal = useMemo(() => 
    cart.reduce((total, item) => 
      total + (parseFloat(item.menuItem.price) * item.quantity), 0
    ), [cart]
  );

  const cartItemsCount = useMemo(() => 
    cart.reduce((total, item) => total + item.quantity, 0), 
    [cart]
  );

  const getItemQuantity = (itemId: number) => {
    const item = cart.find(cartItem => cartItem.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  // Filtrage et tri optimisés
  const filteredAndSortedItems = useMemo(() => {
    let filtered = menuItems.filter(item => item.isAvailable);

    // Filtrage par catégorie
    if (activeCategory) {
      filtered = filtered.filter(item => item.categoryId === activeCategory);
    }

    // Filtrage par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrage alimentaire
    if (dietaryFilter !== 'all') {
      filtered = filtered.filter(item =>
        item.dietaryTags?.includes(dietaryFilter)
      );
    }

    // Filtrage par prix
    if (priceFilter !== 'all') {
      const price = parseFloat(filtered[0]?.price || '0');
      if (priceFilter === 'budget') {
        filtered = filtered.filter(item => parseFloat(item.price) <= 15);
      } else if (priceFilter === 'premium') {
        filtered = filtered.filter(item => parseFloat(item.price) > 15);
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'popular':
          return (b.categoryId || 0) - (a.categoryId || 0); // Simule la popularité
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [menuItems, activeCategory, searchTerm, dietaryFilter, priceFilter, sortBy]);

  // Soumission du formulaire
  const onSubmit = (data: ReservationFormData) => {
    if (cart.length > 0 && cartTotal === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez vérifier votre sélection',
        variant: 'destructive',
      });
      return;
    }

    reservationMutation.mutate(data);
  };

  // Icônes par catégorie optimisées
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    const icons: Record<string, React.ComponentType<any>> = {
      'café': Coffee,
      'cafés': Coffee,
      'boisson': Coffee,
      'boissons': Coffee,
      'pâtisserie': Cake,
      'pâtisseries': Cake,
      'dessert': Cake,
      'desserts': Cake,
      'plat': Utensils,
      'plats': Utensils,
      'plats principaux': Utensils,
      'vin': Wine,
      'vins': Wine,
      'alcool': Wine,
      'alcools': Wine,
      'entrée': ChefHat,
      'entrées': ChefHat,
      'glace': IceCream,
      'glaces': IceCream
    };
    
    return (icons[name] ?? Sandwich) as React.ComponentType<any>;
  };

  // Tags alimentaires
  const dietaryTags = [
    { value: 'all', label: 'Tous', icon: '🍽️' },
    { value: 'vegetarian', label: 'Végétarien', icon: '🌱' },
    { value: 'vegan', label: 'Végan', icon: '🥬' },
    { value: 'gluten-free', label: 'Sans gluten', icon: '🌾' },
    { value: 'dairy-free', label: 'Sans lactose', icon: '🥛' },
    { value: 'spicy', label: 'Épicé', icon: '🌶️' },
    { value: 'low-calorie', label: 'Léger', icon: '⚖️' }
  ];

  // Gestion des erreurs de chargement
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, item: MenuItem) => {
    const target = e.currentTarget;
    target.src = getItemImageUrl('default', item.category?.toLowerCase());
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    form.setValue('date', date);
    form.setValue('time', '');
  };

  // Affichage des erreurs
  if (categoriesError || menuError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coffee-light via-amber-50 to-orange-100 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-red-600 mb-4">Une erreur est survenue lors du chargement</p>
            <Button onClick={() => window.location.reload()}>
              Actualiser la page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-amber-50 to-orange-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-coffee-dark mb-4">
            Réservez votre expérience culinaire
          </h1>
          <p className="text-base md:text-lg text-coffee-medium max-w-2xl mx-auto">
            Choisissez vos plats à l'avance et profitez d'un service sans attente. 
            Réservez maintenant et personnalisez votre expérience.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Menu et Sélection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtres et recherche */}
            <Card className="bg-white/80 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coffee-dark">
                  <Utensils className="h-5 w-5" />
                  Notre Menu Gourmet
                  <Badge variant="secondary" className="ml-auto">
                    {filteredAndSortedItems.length} articles
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Input
                    placeholder="Rechercher un plat, une boisson..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-coffee-medium" />
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtres alimentaires */}
                  <div>
                    <Label className="text-xs font-medium text-coffee-medium mb-2 block">
                      Régime alimentaire
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {dietaryTags.slice(0, 4).map(tag => (
                        <Badge
                          key={tag.value}
                          variant={dietaryFilter === tag.value ? 'default' : 'outline'}
                          className="cursor-pointer text-xs bg-coffee-accent/20 hover:bg-coffee-accent/30"
                          onClick={() => setDietaryFilter(tag.value)}
                        >
                          {tag.icon} {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Filtres de prix */}
                  <div>
                    <Label className="text-xs font-medium text-coffee-medium mb-2 block">
                      Gamme de prix
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: 'Tous', icon: '💰' },
                        { value: 'budget', label: '≤15€', icon: '💵' },
                        { value: 'premium', label: '>15€', icon: '💎' }
                      ].map(option => (
                        <Badge
                          key={option.value}
                          variant={priceFilter === option.value ? 'default' : 'outline'}
                          className="cursor-pointer text-xs bg-coffee-accent/20 hover:bg-coffee-accent/30"
                          onClick={() => setPriceFilter(option.value as typeof priceFilter)}
                        >
                          {option.icon} {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tri */}
                  <div>
                    <Label className="text-xs font-medium text-coffee-medium mb-2 block">
                      Trier par
                    </Label>
                    <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom (A-Z)</SelectItem>
                        <SelectItem value="price">Prix croissant</SelectItem>
                        <SelectItem value="popular">Popularité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filtres par catégorie */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeCategory === null ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(null)}
                    className="bg-coffee-accent hover:bg-coffee-dark"
                    size="sm"
                  >
                    Tout voir
                  </Button>
                  {categories.map(category => {
                    const Icon = getCategoryIcon(category.name);
                    return (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(category.id)}
                        className="bg-coffee-accent hover:bg-coffee-dark"
                        size="sm"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Grille des produits */}
            <Card className="bg-white/80 backdrop-blur-sm border-coffee-light/30">
              <CardContent className="p-4 md:p-6">
                {isMenuLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <Card key={index} className="bg-white/90 backdrop-blur-sm border-coffee-light/30">
                        <CardContent className="p-4 space-y-3">
                          <div className="aspect-square bg-coffee-light/20 rounded-lg animate-pulse" />
                          <div className="h-4 bg-coffee-light/20 rounded animate-pulse" />
                          <div className="h-3 bg-coffee-light/20 rounded animate-pulse" />
                          <div className="h-4 bg-coffee-light/20 rounded animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAndSortedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Utensils className="h-12 w-12 text-coffee-medium mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-coffee-dark mb-2">
                      Aucun article trouvé
                    </h3>
                    <p className="text-coffee-medium">
                      Essayez de modifier vos filtres ou votre recherche
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredAndSortedItems.map(item => {
                      const quantity = getItemQuantity(item.id);
                      const Icon = getCategoryIcon(item.category || '');

                      return (
                        <Card key={item.id} className="bg-white/90 backdrop-blur-sm border-coffee-light/30 hover:shadow-lg transition-all duration-300 group">
                          <CardContent className="p-4">
                            {/* Image et disponibilité */}
                            <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-coffee-light/20">
                              <img 
                                src={getItemImageUrl(item.name, item.category?.toLowerCase())}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => handleImageError(e, item)}
                              />
                              {!item.isAvailable && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Badge variant="destructive" className="px-3 py-1">
                                    Indisponible
                                  </Badge>
                                </div>
                              )}
                              {item.dietaryTags && item.dietaryTags.length > 0 && (
                                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                  {item.dietaryTags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                      {dietaryTags.find(t => t.value === tag)?.icon || ''}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Informations produit */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-coffee-dark flex-1 leading-tight">{item.name}</h3>
                                <Icon className="h-4 w-4 text-coffee-medium ml-2 flex-shrink-0" />
                              </div>
                              
                              <p className="text-sm text-coffee-medium line-clamp-2">{item.description}</p>
                              
                              <div className="flex items-center justify-between text-xs text-coffee-light">
                                {item.preparationTime && (
                                  <span>⏱️ {item.preparationTime} min</span>
                                )}
                                {item.spicyLevel && item.spicyLevel !== 'none' && (
                                  <span>🌶️ {item.spicyLevel}</span>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <span className="text-lg font-bold text-coffee-accent">
                                  {item.price}€
                                </span>

                                <div className="flex items-center gap-2">
                                  {quantity > 0 && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeFromCart(item.id)}
                                        className="h-8 w-8 p-0"
                                        disabled={!item.isAvailable}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Badge variant="secondary" className="px-2 py-1 min-w-[2rem]">
                                        {quantity}
                                      </Badge>
                                    </>
                                  )}

                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    className="h-8 w-8 p-0 bg-coffee-accent hover:bg-coffee-dark"
                                    disabled={!item.isAvailable}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation et panier */}
          <div className="space-y-6">
            {/* Panier */}
            <Card className="bg-white/90 backdrop-blur-sm border-coffee-light/30 sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-coffee-dark">
                    <ShoppingCart className="h-5 w-5" />
                    Votre Sélection
                    {cartItemsCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-coffee-medium hover:text-coffee-dark"
                    >
                      Vider
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-coffee-medium">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-1">Votre panier est vide</p>
                    <p className="text-sm">Ajoutez des articles pour les déguster sur place</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.menuItem.id} className="p-3 bg-coffee-light/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-coffee-dark truncate">{item.menuItem.name}</h4>
                              <p className="text-sm text-coffee-medium">
                                {item.quantity} × {item.menuItem.price}€ = {(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}€
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
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
                                disabled={item.quantity >= 10}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <Input
                            placeholder="Notes (ex: sans oignon, cuisson à point...)"
                            value={item.notes || ''}
                            onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                            className="text-xs"
                            maxLength={200}
                          />

                          <Textarea
                            placeholder="Demandes spéciales supplémentaires..."
                            value={item.specialRequests || ''}
                            onChange={(e) => updateSpecialRequests(item.menuItem.id, e.target.value)}
                            className="text-xs resize-none"
                            rows={2}
                            maxLength={200}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Sous-total ({cartItemsCount} articles):</span>
                        <span>{cartTotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold text-coffee-dark">
                        <span>Total:</span>
                        <span>{cartTotal.toFixed(2)}€</span>
                      </div>
                      <p className="text-xs text-coffee-medium">
                        Durée estimée: {calculateEstimatedDuration()} min
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

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
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="info">Informations</TabsTrigger>
                      <TabsTrigger value="preferences">Préférences</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="customerName">Nom complet *</Label>
                          <Input
                            {...form.register('customerName')}
                            placeholder="Votre nom"
                            className="mt-1"
                            maxLength={100}
                          />
                          {form.formState.errors.customerName && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.customerName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="customerEmail">Email *</Label>
                          <Input
                            {...form.register('customerEmail')}
                            type="email"
                            placeholder="votre@email.com"
                            className="mt-1"
                            maxLength={255}
                          />
                          {form.formState.errors.customerEmail && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.customerEmail.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="customerPhone">Téléphone *</Label>
                          <Input
                            {...form.register('customerPhone')}
                            placeholder="Ex: +33612345678"
                            className="mt-1"
                            maxLength={20}
                          />
                          {form.formState.errors.customerPhone && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.customerPhone.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="date">Date *</Label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              value={selectedDate}
                              onChange={(e) => handleDateChange(e.target.value)}
                              className="mt-1"
                            />
                            {form.formState.errors.date && (
                              <p className="text-sm text-red-600 mt-1">
                                {form.formState.errors.date.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="time">Heure *</Label>
                            <Select
                              value={form.watch('time')}
                              onValueChange={(value) => form.setValue('time', value)}
                              disabled={!selectedDate || isTimeSlotsLoading}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choisir une heure" />
                              </SelectTrigger>
                              <SelectContent>
                                {isTimeSlotsLoading ? (
                                  <SelectItem value="loading" disabled>
                                    Chargement...
                                  </SelectItem>
                                ) : availableTimeSlots.length === 0 && selectedDate ? (
                                  <SelectItem value="none" disabled>
                                    Aucun créneau disponible
                                  </SelectItem>
                                ) : (
                                  availableTimeSlots.map(slot => (
                                    <SelectItem 
                                      key={slot.time} 
                                      value={slot.time}
                                      disabled={!slot.available}
                                    >
                                      {slot.time} {slot.remainingSeats > 0 && `(${slot.remainingSeats} places)`} {!slot.available && '(Complet)'}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.time && (
                              <p className="text-sm text-red-600 mt-1">
                                {form.formState.errors.time.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="guests">Nombre d'invités *</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-coffee-medium" />
                            <Input
                              {...form.register('guests', { valueAsNumber: true })}
                              type="number"
                              min="1"
                              max="20"
                              className="flex-1"
                            />
                          </div>
                          {form.formState.errors.guests && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.guests.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4">
                      <div>
                        <Label htmlFor="tablePreference">Préférence de table</Label>
                        <Select
                          value={form.watch('tablePreference') ?? 'none'}
                          onValueChange={(value: string) => 
                            form.setValue('tablePreference', value as 'indoor' | 'outdoor' | 'window' | 'bar' | 'private' | 'none')
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Aucune préférence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune préférence</SelectItem>
                            <SelectItem value="indoor">À l'intérieur</SelectItem>
                            <SelectItem value="outdoor">En terrasse</SelectItem>
                            <SelectItem value="window">Près d'une fenêtre</SelectItem>
                            <SelectItem value="bar">Au comptoir</SelectItem>
                            <SelectItem value="private">Salon privé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="occasion">Occasion spéciale</Label>
                        <Select
                          value={form.watch('occasion') ?? 'none'}
                          onValueChange={(value: string) => 
                            form.setValue('occasion', value as 'none' | 'birthday' | 'anniversary' | 'business' | 'date' | 'celebration')
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Aucune occasion spéciale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune occasion spéciale</SelectItem>
                            <SelectItem value="birthday">🎂 Anniversaire</SelectItem>
                            <SelectItem value="anniversary">💕 Anniversaire de couple</SelectItem>
                            <SelectItem value="business">💼 Repas d'affaires</SelectItem>
                            <SelectItem value="date">❤️ Rendez-vous romantique</SelectItem>
                            <SelectItem value="celebration">🎉 Célébration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="specialRequests">Demandes spéciales</Label>
                        <Textarea
                          {...form.register('specialRequests')}
                          placeholder="Allergies, préférences alimentaires, célébration, décoration..."
                          className="mt-1"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-coffee-light mt-1">
                          {(form.watch('specialRequests') || '').length}/500 caractères
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="border-t pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-coffee-accent hover:bg-coffee-dark disabled:opacity-50"
                      disabled={
                        reservationMutation.isPending || 
                        !form.watch('date') || 
                        !form.watch('time') ||
                        !form.formState.isValid
                      }
                    >
                      {reservationMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirmation en cours...
                        </>
                      ) : (
                        `Confirmer la réservation${cart.length > 0 ? ` • ${cartTotal.toFixed(2)}€` : ''}`
                      )}
                    </Button>

                    {cart.length > 0 && (
                      <div className="mt-3 p-3 bg-coffee-light/10 rounded-lg">
                        <p className="text-xs text-coffee-medium text-center mb-2">
                          ✨ Votre sélection sera préparée pour votre arrivée
                        </p>
                        <div className="text-xs text-coffee-light space-y-1">
                          <div className="flex justify-between">
                            <span>Articles sélectionnés:</span>
                            <span>{cartItemsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temps de préparation estimé:</span>
                            <span>{calculateEstimatedDuration()} min</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
