import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Mail, Phone, MapPin, Calendar, Star, Coffee, Gift, Settings, Shield, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  address: z.string().optional(),
  birthday: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(6, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  birthday?: string;
  avatar?: string;
  loyaltyPoints: number;
  loyaltyLevel: string;
  totalSpent: number;
  orderCount: number;
  favoriteItems: Array<{
    id: number;
    name: string;
    orderCount: number;
  }>;
  recentOrders: Array<{
    id: number;
    date: string;
    total: number;
    status: string;
  }>;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
}

const UserProfile: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || {},
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été sauvegardées.' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/user/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors du changement de mot de passe');
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour.' });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Compte supprimé', description: 'Votre compte a été supprimé avec succès.' });
      // Redirection vers la page de connexion
      window.location.href = '/login';
    },
  });

  const getLoyaltyLevelColor = (level: string) => {
    switch (level) {
      case 'Nouveau': return 'bg-gray-500';
      case 'Régulier': return 'bg-blue-500';
      case 'Fidèle': return 'bg-purple-500';
      case 'VIP': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback className="text-xl">
            {profile.firstName[0]}{profile.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={`${getLoyaltyLevelColor(profile.loyaltyLevel)} text-white`}>
              {profile.loyaltyLevel}
            </Badge>
            <span className="text-sm text-gray-500">
              {profile.loyaltyPoints} points fidélité
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Coffee className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{profile.orderCount}</p>
            <p className="text-sm text-gray-500">Commandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{profile.totalSpent.toFixed(0)}€</p>
            <p className="text-sm text-gray-500">Dépensé</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{profile.loyaltyPoints}</p>
            <p className="text-sm text-gray-500">Points</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Modifiez vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate((data as unknown) as Record<string, unknown>))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input {...profileForm.register('firstName')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input {...profileForm.register('lastName')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input {...profileForm.register('email')} type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input {...profileForm.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input {...profileForm.register('address')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Date de naissance</Label>
                  <Input {...profileForm.register('birthday')} type="date" />
                </div>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Commande #{order.id}</p>
                      <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.total.toFixed(2)}€</p>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
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
              <CardTitle>Articles favoris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.favoriteItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Commandé {item.orderCount} fois</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Recommander
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input {...passwordForm.register('currentPassword')} type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input {...passwordForm.register('newPassword')} type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input {...passwordForm.register('confirmPassword')} type="password" />
                </div>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  Changer le mot de passe
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Zone de danger</CardTitle>
              <CardDescription>Actions irréversibles</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteAccountMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;