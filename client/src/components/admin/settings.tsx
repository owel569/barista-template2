import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Clock, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface SettingsProps {
  userRole: 'directeur' | 'employe';
}

interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  maxCapacity: number;
  reservationSettings: {
    enableOnlineReservations: boolean;
    maxAdvanceDays: number;
    requireConfirmation: boolean;
    minPartySize: number;
    maxPartySize: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderBefore: number;
  };
}

const defaultSettings: RestaurantSettings = {
  restaurantName: 'Barista Café',
  address: '123 Rue de la Paix, 75001 Paris',
  phone: '+33 1 42 36 00 00',
  email: 'contact@barista-cafe.fr',
  website: 'https://barista-cafe.fr',
  description: 'Café artisanal avec spécialités de café et pâtisseries maison',
  openingHours: {
    monday: { open: '07:00', close: '19:00', closed: false },
    tuesday: { open: '07:00', close: '19:00', closed: false },
    wednesday: { open: '07:00', close: '19:00', closed: false },
    thursday: { open: '07:00', close: '19:00', closed: false },
    friday: { open: '07:00', close: '20:00', closed: false },
    saturday: { open: '08:00', close: '20:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false }
  },
  maxCapacity: 60,
  reservationSettings: {
    enableOnlineReservations: true,
    maxAdvanceDays: 30,
    requireConfirmation: true,
    minPartySize: 1,
    maxPartySize: 12
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    reminderBefore: 24
  }
};

export default function Settings({ userRole }: SettingsProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user);
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    retry: 3,
    retryDelay: 1000,
  });

  // Synchroniser avec les données récupérées
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(prev => ({
        ...defaultSettings,
        ...fetchedSettings,
        reservationSettings: {
          ...defaultSettings.reservationSettings,
          ...(fetchedSettings.reservationSettings || {})
        },
        notificationSettings: {
          ...defaultSettings.notificationSettings,
          ...(fetchedSettings.notificationSettings || {})
        },
        openingHours: {
          ...defaultSettings.openingHours,
          ...(fetchedSettings.openingHours || {})
        }
      }));
    }
  }, [fetchedSettings]);

  const saveMutation = useMutation({
    mutationFn: (settings: RestaurantSettings) =>
      apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Succès',
        description: 'Paramètres sauvegardés avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde des paramètres',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(prev => ({ ...prev, ...fetchedSettings }));
    }
  }, [fetchedSettings]);

  const handleSave = () => {
    if (!hasPermission('settings', 'edit')) return;
    saveMutation.mutate(settings);
  };

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value
        }
      }
    }));
  };

  if (!hasPermission('settings', 'view')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous n'avez pas les permissions pour accéder aux paramètres.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Chargement des paramètres...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Paramètres du Restaurant</h1>
          <p className="text-muted-foreground">Configurez les paramètres généraux</p>
        </div>
        {hasPermission('settings', 'edit') && (
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="hours">Horaires</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurantName">Nom du Restaurant</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Site Web</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!hasPermission('settings', 'edit')}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="maxCapacity">Capacité Maximum</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={settings.maxCapacity}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horaires d'Ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.openingHours).map(([day, hours]) => {
                const dayNames = {
                  monday: 'Lundi',
                  tuesday: 'Mardi',
                  wednesday: 'Mercredi',
                  thursday: 'Jeudi',
                  friday: 'Vendredi',
                  saturday: 'Samedi',
                  sunday: 'Dimanche'
                };

                return (
                  <div key={day} className="flex items-center gap-4 p-3 border rounded">
                    <div className="w-24 font-medium">
                      {dayNames[day as keyof typeof dayNames]}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => updateOpeningHours(day, 'closed', !checked)}
                        disabled={!hasPermission('settings', 'edit')}
                      />
                      <Label>Ouvert</Label>
                    </div>
                    {!hours.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                          disabled={!hasPermission('settings', 'edit')}
                          className="w-32"
                        />
                        <span>à</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                          disabled={!hasPermission('settings', 'edit')}
                          className="w-32"
                        />
                      </>
                    )}
                    {hours.closed && (
                      <Badge variant="secondary">Fermé</Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des Réservations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.reservationSettings.enableOnlineReservations}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    reservationSettings: { ...prev.reservationSettings, enableOnlineReservations: checked }
                  }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
                <Label>Activer les réservations en ligne</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.reservationSettings.requireConfirmation}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    reservationSettings: { ...prev.reservationSettings, requireConfirmation: checked }
                  }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
                <Label>Confirmation requise</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Réservation maximum (jours à l'avance)</Label>
                  <Input
                    type="number"
                    value={settings.reservationSettings.maxAdvanceDays}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      reservationSettings: { ...prev.reservationSettings, maxAdvanceDays: parseInt(e.target.value) }
                    }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label>Taille de groupe minimum</Label>
                  <Input
                    type="number"
                    value={settings.reservationSettings.minPartySize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      reservationSettings: { ...prev.reservationSettings, minPartySize: parseInt(e.target.value) }
                    }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label>Taille de groupe maximum</Label>
                  <Input
                    type="number"
                    value={settings.reservationSettings.maxPartySize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      reservationSettings: { ...prev.reservationSettings, maxPartySize: parseInt(e.target.value) }
                    }))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Paramètres de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, emailNotifications: checked }
                  }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
                <Label>Notifications par email</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, smsNotifications: checked }
                  }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
                <Label>Notifications par SMS</Label>
              </div>

              <div>
                <Label>Rappel avant (heures)</Label>
                <Input
                  type="number"
                  value={settings.notificationSettings.reminderBefore}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, reminderBefore: parseInt(e.target.value) }
                  }))}
                  disabled={!hasPermission('settings', 'edit')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}