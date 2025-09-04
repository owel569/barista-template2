import React, { useState, useEffect, useCallback } from 'react';
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
import { Settings as SettingsIcon, Clock, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { DayPicker } from '@/components/ui/day-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from 'lodash';

// Interface pour logger manquant
const logger = {
  error: (message: string, context?: any) => console.error(message, context)
};

interface SettingsProps {
  userRole: 'directeur' | 'employe';
}

interface OpeningHours {
  open: string;
  close: string;
  closed: boolean;
}

interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  openingHours: Record<string, OpeningHours>;
  maxCapacity: number;
  reservationSettings: {
    enableOnlineReservations: boolean;
    maxAdvanceDays: number;
    requireConfirmation: boolean;
    minPartySize: number;
    maxPartySize: number;
    depositRequired: boolean;
    depositAmount: number;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderBefore: number;
    newReservationTemplate: string;
    cancellationTemplate: string;
  };
  specialDates: {
    closedDates: string[];
    specialHours: Array<{
      date: string;
      openingHours: OpeningHours;
      note: string;
    }>;
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
    maxPartySize: 12,
    depositRequired: false,
    depositAmount: 0,
    cancellationPolicy: 'moderate'
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    reminderBefore: 24,
    newReservationTemplate: 'Bonjour {customerName}, votre réservation pour {date} à {time} est confirmée.',
    cancellationTemplate: 'Bonjour {customerName}, votre réservation pour {date} à {time} a été annulée.'
  },
  specialDates: {
    closedDates: [],
    specialHours: []
  }
};

const DAY_NAMES = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche'
};

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible (annulation jusqu\'à 1h avant)' },
  { value: 'moderate', label: 'Modérée (annulation jusqu\'à 24h avant)' },
  { value: 'strict', label: 'Stricte (annulation jusqu\'à 48h avant)' }
];

export default function Settings({ userRole }: SettingsProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user);
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<RestaurantSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fetchedSettings, isLoading, isError } = useQuery({
    queryKey: ['restaurantSettings'],
    queryFn: () => apiRequest('/api/admin/settings'),
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Synchroniser avec les données récupérées
  useEffect(() => {
    if (fetchedSettings) {
      const mergedSettings = {
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
        },
        specialDates: {
          ...defaultSettings.specialDates,
          ...(fetchedSettings.specialDates || {})
        }
      };
      setSettings(mergedSettings);
      setDraftSettings(mergedSettings);
    }
  }, [fetchedSettings]);

  // Vérifier les changements
  useEffect(() => {
    if (fetchedSettings) {
      const changes = JSON.stringify(draftSettings) !== JSON.stringify(settings);
      setHasChanges(changes);
    }
  }, [draftSettings, settings, fetchedSettings]);

  const saveMutation = useMutation({
    mutationFn: (settingsToSave: RestaurantSettings) =>
      apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsToSave)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantSettings'] });
      toast({
        title: 'Succès',
        description: 'Paramètres sauvegardés avec succès',
      });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la sauvegarde des paramètres',
        variant: 'destructive',
      });
    },
  });

  const handleSave = useCallback(() => {
    if (!hasPermission('settings', 'edit') || !hasChanges) return;
    saveMutation.mutate(draftSettings);
    setSettings(draftSettings);
  }, [draftSettings, hasChanges, hasPermission, saveMutation]);

  // Debounced save for auto-save functionality
  const debouncedSave = useCallback(
    debounce((settingsToSave: RestaurantSettings) => {
      if (hasPermission('settings', 'edit')) {
        saveMutation.mutate(settingsToSave);
        setSettings(settingsToSave);
      }
    }, 2000),
    [hasPermission, saveMutation]
  );

  const handleChange = useCallback((path: string, value: any) => {
    setDraftSettings(prev => {
      const keys = path.split('.');
      let current: any = prev;
      const newSettings = { ...prev };

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key && current[key]) {
          current = current[key];
        } else if (key) {
          current[key] = {};
          current = current[key];
        }
      }
      const lastKey = keys[keys.length - 1];

      if (path.includes('openingHours') && keys.length > 1) {
        const dayKey = keys[0];
        if (lastKey && prev.openingHours?.[dayKey]) {
          current[lastKey] = {
            ...current[lastKey],
            ...prev.openingHours[dayKey][lastKey],
            [keys[keys.length - 1]]: value,
          };
        }
      } else if (lastKey) {
        current[lastKey] = value;
      }
      return newSettings;
    });
  }, []);


  const updateOpeningHours = useCallback((day: string, field: keyof OpeningHours, value: string | boolean) => {
    setDraftSettings(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  }, []);

  const addClosedDate = (date: Date) => {
    const dateString = date?.toISOString().split('T')[0];
    if (!dateString) return;

    setDraftSettings(prev => ({
      ...prev,
      specialDates: {
        ...prev.specialDates,
        closedDates: [...prev.specialDates.closedDates, dateString]
      }
    }));
  };

  const removeClosedDate = useCallback((dateStr: string) => {
    setDraftSettings(prev => ({
      ...prev,
      specialDates: {
        ...prev.specialDates,
        closedDates: prev.specialDates.closedDates.filter(d => d !== dateStr)
      }
    }));
  }, []);

  const addSpecialHours = useCallback((date: Date, hours: OpeningHours, note: string) => {
    const dateStr = date.toISOString().split('T')[0];
    setDraftSettings(prev => ({
      ...prev,
      specialDates: {
        ...prev.specialDates,
        specialHours: [
          ...prev.specialDates.specialHours.filter(sh => sh.date !== dateStr),
          { date: dateStr, openingHours: hours, note }
        ]
      }
    }));
  }, []);

  const removeSpecialHours = useCallback((dateStr: string) => {
    setDraftSettings(prev => ({
      ...prev,
      specialDates: {
        ...prev.specialDates,
        specialHours: prev.specialDates.specialHours.filter(sh => sh.date !== dateStr)
      }
    }));
  }, []);

  // State for new special date input
  const [newSpecialDate, setNewSpecialDate] = useState<Date | undefined>(undefined);

  // Handler to add a new special hour entry
  const addSpecialHour = () => {
    const dateString = newSpecialDate?.toISOString().split('T')[0];
    if (!dateString) return;

    setDraftSettings(prev => ({
      ...prev,
      specialDates: {
        ...prev.specialDates,
        specialHours: [...prev.specialDates.specialHours, {
          date: dateString,
          openingHours: { open: '09:00', close: '18:00', closed: false },
          note: ''
        }]
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
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Erreur lors du chargement des paramètres. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="min-w-32"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="hours">Horaires</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="special-dates">Dates Spéciales</TabsTrigger>
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
                    value={draftSettings.restaurantName}
                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={draftSettings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={draftSettings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Site Web</Label>
                  <Input
                    id="website"
                    value={draftSettings.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={draftSettings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!hasPermission('settings', 'edit')}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={draftSettings.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={!hasPermission('settings', 'edit')}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="maxCapacity">Capacité Maximum</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  value={draftSettings.maxCapacity}
                  onChange={(e) => handleChange('maxCapacity', parseInt(e.target.value))}
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
              {Object.entries(draftSettings.openingHours).map(([day, hours]) => (
                <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border rounded">
                  <div className="w-24 font-medium">
                    {DAY_NAMES[day as keyof typeof DAY_NAMES]}
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
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <TimePicker
                        value={hours.open}
                        onChange={(value) => updateOpeningHours(day, 'open', value)}
                        disabled={!hasPermission('settings', 'edit')}
                      />
                      <span>à</span>
                      <TimePicker
                        value={hours.close}
                        onChange={(value) => updateOpeningHours(day, 'close', value)}
                        disabled={!hasPermission('settings', 'edit')}
                      />
                    </div>
                  )}
                  {hours.closed && (
                    <Badge variant="secondary">Fermé</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des Réservations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draftSettings.reservationSettings.enableOnlineReservations}
                    onCheckedChange={(checked) => handleChange('reservationSettings.enableOnlineReservations', checked)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  <Label>Activer les réservations en ligne</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={draftSettings.reservationSettings.requireConfirmation}
                    onCheckedChange={(checked) => handleChange('reservationSettings.requireConfirmation', checked)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  <Label>Confirmation requise</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={draftSettings.reservationSettings.depositRequired}
                    onCheckedChange={(checked) => handleChange('reservationSettings.depositRequired', checked)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  <Label>Caution requise</Label>
                </div>

                {draftSettings.reservationSettings.depositRequired && (
                  <div>
                    <Label>Montant de la caution (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="5"
                      value={draftSettings.reservationSettings.depositAmount}
                      onChange={(e) => handleChange('reservationSettings.depositAmount', parseFloat(e.target.value))}
                      disabled={!hasPermission('settings', 'edit')}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Réservation maximum (jours à l\'avance)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={draftSettings.reservationSettings.maxAdvanceDays}
                    onChange={(e) => handleChange('reservationSettings.maxAdvanceDays', parseInt(e.target.value))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label>Taille de groupe minimum</Label>
                  <Input
                    type="number"
                    min="1"
                    value={draftSettings.reservationSettings.minPartySize}
                    onChange={(e) => handleChange('reservationSettings.minPartySize', parseInt(e.target.value))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
                <div>
                  <Label>Taille de groupe maximum</Label>
                  <Input
                    type="number"
                    min="1"
                    value={draftSettings.reservationSettings.maxPartySize}
                    onChange={(e) => handleChange('reservationSettings.maxPartySize', parseInt(e.target.value))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
              </div>

              <div>
                <Label>Politique d'annulation</Label>
                <select
                  value={draftSettings.reservationSettings.cancellationPolicy}
                  onChange={(e) => handleChange('reservationSettings.cancellationPolicy', e.target.value)}
                  disabled={!hasPermission('settings', 'edit')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {CANCELLATION_POLICIES.map(policy => (
                    <option key={policy.value} value={policy.value}>
                      {policy.label}
                    </option>
                  ))}
                </select>
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draftSettings.notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleChange('notificationSettings.emailNotifications', checked)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  <Label>Notifications par email</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={draftSettings.notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => handleChange('notificationSettings.smsNotifications', checked)}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  <Label>Notifications par SMS</Label>
                </div>

                <div>
                  <Label>Rappel avant (heures)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={draftSettings.notificationSettings.reminderBefore}
                    onChange={(e) => handleChange('notificationSettings.reminderBefore', parseInt(e.target.value))}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modèle de notification de nouvelle réservation</Label>
                <Textarea
                  value={draftSettings.notificationSettings.newReservationTemplate}
                  onChange={(e) => handleChange('notificationSettings.newReservationTemplate', e.target.value)}
                  disabled={!hasPermission('settings', 'edit')}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Variables disponibles: {'{customerName}'}, {'{date}'}, {'{time}'}, {'{partySize}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Modèle de notification d'annulation</Label>
                <Textarea
                  value={draftSettings.notificationSettings.cancellationTemplate}
                  onChange={(e) => handleChange('notificationSettings.cancellationTemplate', e.target.value)}
                  disabled={!hasPermission('settings', 'edit')}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Variables disponibles: {'{customerName}'}, {'{date}'}, {'{time}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special-dates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dates Spéciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Jours de fermeture</h3>
                <div className="flex flex-col gap-4">
                  <DayPicker
                    selectedDates={draftSettings.specialDates.closedDates.map(d => new Date(d))}
                    onSelectDate={(date) => addClosedDate(date)}
                    onRemoveDate={(date) => removeClosedDate(date.toISOString().split('T')[0])}
                    disabled={!hasPermission('settings', 'edit')}
                  />
                  {draftSettings.specialDates.closedDates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {draftSettings.specialDates.closedDates.map(date => (
                        <Badge
                          key={date}
                          variant="outline"
                          className="flex justify-between items-center"
                        >
                          {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {hasPermission('settings', 'edit') && (
                            <button
                              onClick={() => removeClosedDate(date)}
                              className="ml-2 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Horaires Spéciaux</h3>
                <div className="space-y-4">
                  {draftSettings.specialDates.specialHours.map(({ date, openingHours, note }) => (
                    <div key={date} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {hasPermission('settings', 'edit') && (
                          <button
                            onClick={() => removeSpecialHours(date)}
                            className="text-sm text-destructive"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Switch
                          checked={!openingHours.closed}
                          onCheckedChange={(checked) => {
                            const updatedHours = [...draftSettings.specialDates.specialHours];
                            const index = updatedHours.findIndex(sh => sh.date === date);
                            if (index >= 0) {
                              updatedHours[index] = {
                                ...updatedHours[index],
                                openingHours: {
                                  ...updatedHours[index].openingHours,
                                  closed: !checked
                                }
                              };
                              setDraftSettings(prev => ({
                                ...prev,
                                specialDates: {
                                  ...prev.specialDates,
                                  specialHours: updatedHours
                                }
                              }));
                            }
                          }}
                          disabled={!hasPermission('settings', 'edit')}
                        />
                        <Label>Ouvert</Label>
                      </div>
                      {!openingHours.closed && (
                        <div className="flex items-center gap-2">
                          <TimePicker
                            value={openingHours.open}
                            onChange={(value) => {
                              const updatedHours = [...draftSettings.specialDates.specialHours];
                              const index = updatedHours.findIndex(sh => sh.date === date);
                              if (index >= 0) {
                                updatedHours[index] = {
                                  ...updatedHours[index],
                                  openingHours: {
                                    ...updatedHours[index].openingHours,
                                    open: value
                                  }
                                };
                                setDraftSettings(prev => ({
                                  ...prev,
                                  specialDates: {
                                    ...prev.specialDates,
                                    specialHours: updatedHours
                                  }
                                }));
                              }
                            }}
                            disabled={!hasPermission('settings', 'edit')}
                          />
                          <span>à</span>
                          <TimePicker
                            value={openingHours.close}
                            onChange={(value) => {
                              const updatedHours = [...draftSettings.specialDates.specialHours];
                              const index = updatedHours.findIndex(sh => sh.date === date);
                              if (index >= 0) {
                                updatedHours[index] = {
                                  ...updatedHours[index],
                                  openingHours: {
                                    ...updatedHours[index].openingHours,
                                    close: value
                                  }
                                };
                                setDraftSettings(prev => ({
                                  ...prev,
                                  specialDates: {
                                    ...prev.specialDates,
                                    specialHours: updatedHours
                                  }
                                }));
                              }
                            }}
                            disabled={!hasPermission('settings', 'edit')}
                          />
                        </div>
                      )}
                      <div className="mt-2">
                        <Label>Note (optionnelle)</Label>
                        <Input
                          value={note}
                          onChange={(e) => {
                            const updatedHours = [...draftSettings.specialDates.specialHours];
                            const index = updatedHours.findIndex(sh => sh.date === date);
                            if (index >= 0) {
                              updatedHours[index] = {
                                ...updatedHours[index],
                                note: e.target.value,
                              };
                              setDraftSettings(prev => ({
                                ...prev,
                                specialDates: {
                                  ...prev.specialDates,
                                  specialHours: updatedHours
                                }
                              }));
                            }
                          }}
                          disabled={!hasPermission('settings', 'edit')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Ajouter des horaires spéciaux</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Date</Label>
                      <DayPicker
                        onSelect={(date: Date | undefined) => {
                          if (!date) return;
                          const dateStr = date.toISOString().split('T')[0];
                          if (!draftSettings.specialDates.specialHours.some(sh => sh.date === dateStr) &&
                              !draftSettings.specialDates.closedDates.some(d => d === dateStr)) {
                             setNewSpecialDate(date);
                          }
                        }}
                        disabled={!hasPermission('settings', 'edit')}
                      />
                    </div>
                    {newSpecialDate && (
                      <div className="col-span-1 md:col-span-2 flex items-end">
                        <Button onClick={addSpecialHour} disabled={!hasPermission('settings', 'edit')}>
                          Ajouter Horaires Spéciaux
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}