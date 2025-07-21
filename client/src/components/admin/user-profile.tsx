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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Heart, Clock, Star, MapPin, Phone, Mail, 
  Calendar, CreditCard, Bell, Shield, Settings,
  Trash2, Edit, Plus, Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  avatar?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
    favoriteTable?: number;
    dietaryRestrictions: string[];
    allergens: string[];
    language: string;
    currency: string;
  };
  loyalty: {
    points: number;
    level: string;
    nextLevelPoints: number;
    totalSpent: number;
    visitsCount: number;
    joinDate: string;
  };
  paymentMethods: PaymentMethod[];
  addresses: Address[];
  orderHistory: OrderHistory[];
  favoriteItems: FavoriteItem[];
  reviews: Review[];
}

interface PaymentMethod {
  id: number;
  type: 'card' | 'paypal' | 'mobile';
  name: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

interface Address {
  id: number;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface OrderHistory {
  id: number;
  orderNumber: string;
  date: string;
  totalAmount: number;
  status: string;
  items: { name: string; quantity: number; price: number }[];
}

interface FavoriteItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  addedDate: string;
  orderCount: number;
}

interface Review {
  id: number;
  orderId: number;
  rating: number;
  comment: string;
  date: string;
  response?: string;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Téléphone requis"),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  birthDate: z.string().optional(),
});

const addressSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  street: z.string().min(1, "Rue requise"),
  city: z.string().min(1, "Ville requise"),
  postalCode: z.string().min(1, "Code postal requis"),
  isDefault: z.boolean().optional(),
});

export default function UserProfile() : JSX.Element {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/user-profiles'],
  });

  const { data: selectedProfile } = useQuery({
    queryKey: ['/api/admin/user-profiles', selectedUser?.id],
    enabled: !!selectedUser,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/user-profiles/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-profiles'] });
      toast({ title: "Profil mis à jour" });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: ({ userId, ...data }: any) => apiRequest(`/api/admin/user-profiles/${userId}/addresses`, { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-profiles'] });
      toast({ title: "Adresse ajoutée" });
    },
  });

  const form = useForm({
    resolver: zodResolver(profileSchema),
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
  });

  const onSubmitProfile = (data: Record<string, unknown>) => {
    if (selectedUser) {
      updateProfileMutation.mutate({ id: selectedUser.id, ...data });
    }
  };

  const onSubmitAddress = (data: Record<string, unknown>) => {
    if (selectedUser) {
      addAddressMutation.mutate({ userId: selectedUser.id, ...data });
    }
  };

  const getLoyaltyBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profils Utilisateurs</h2>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user: UserProfile) => (
          <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4" onClick={() => setSelectedUser(user)}>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getLoyaltyBadgeColor(user.loyalty.level)}>
                      {user.loyalty.level}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {user.loyalty.points} pts
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog profil utilisateur */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <Badge className={getLoyaltyBadgeColor(selectedUser.loyalty.level)}>
                    {selectedUser.loyalty.level}
                  </Badge>
                </div>
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="favorites">Favoris</TabsTrigger>
                <TabsTrigger value="addresses">Adresses</TabsTrigger>
                <TabsTrigger value="reviews">Avis</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.firstName} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.lastName} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.email} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.phone} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input {...field} defaultValue={selectedUser.address} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.city} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code postal</FormLabel>
                                <FormControl>
                                  <Input {...field} defaultValue={selectedUser.postalCode} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          Sauvegarder
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Préférences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label>Notifications par email</label>
                      <Switch checked={selectedUser.preferences.emailNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>Notifications SMS</label>
                      <Switch checked={selectedUser.preferences.smsNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>Emails promotionnels</label>
                      <Switch checked={selectedUser.preferences.promotionalEmails} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loyalty" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-600">Points fidélité</p>
                          <p className="text-2xl font-bold">{selectedUser.loyalty.points}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Total dépensé</p>
                          <p className="text-2xl font-bold">{selectedUser.loyalty.totalSpent}€</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Visites</p>
                          <p className="text-2xl font-bold">{selectedUser.loyalty.visitsCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Gift className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600">Niveau</p>
                          <Badge className={getLoyaltyBadgeColor(selectedUser.loyalty.level)}>
                            {selectedUser.loyalty.level}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Progression vers le niveau suivant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Points actuels: {selectedUser.loyalty.points}</span>
                        <span>Objectif: {selectedUser.loyalty.nextLevelPoints}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(selectedUser.loyalty.points / selectedUser.loyalty.nextLevelPoints) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedUser.loyalty.nextLevelPoints - selectedUser.loyalty.points} points restants
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des Commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedUser.orderHistory.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">Commande #{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{order.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{order.totalAmount}€</p>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{(item.quantity * item.price).toFixed(2)}€</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Articles Favoris</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.favoriteItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                            <h4 className="font-medium">{item.name}</h4>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{item.price}€</span>
                            <span>Commandé {item.orderCount} fois</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Ajouté le {new Date(item.addedDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Adresses
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nouvelle Adresse</DialogTitle>
                          </DialogHeader>
                          <Form {...addressForm}>
                            <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                              <FormField
                                control={addressForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nom de l'adresse</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Domicile, Bureau..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={addressForm.control}
                                name="street"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Rue</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={addressForm.control}
                                  name="city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Ville</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={addressForm.control}
                                  name="postalCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Code postal</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={addressForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel>Adresse par défaut</FormLabel>
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full">
                                Ajouter l'adresse
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>{address.name}</span>
                                {address.isDefault && <Badge variant="secondary">Défaut</Badge>}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {address.street}<br />
                                {address.city} {address.postalCode}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Avis et Commentaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedUser.reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{review.rating}/5</span>
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          {review.response && (
                            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                              <p className="text-sm"><strong>Réponse:</strong> {review.response}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}