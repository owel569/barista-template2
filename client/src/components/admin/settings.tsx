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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Mail, 
  MapPin, 
  Phone, 
  Save,
  Store,
  Globe,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';

const generalSettingsSchema = z.object({
  restaurantName: z.string().min(2, 'Le nom du restaurant doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  address: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  phone: z.string().min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères'),
  email: z.string().email('Email invalide'),
  website: z.string().url('URL invalide').optional(),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }),
});

const hoursSettingsSchema = z.object({
  mondayOpen: z.string(),
  mondayClose: z.string(),
  tuesdayOpen: z.string(),
  tuesdayClose: z.string(),
  wednesdayOpen: z.string(),
  wednesdayClose: z.string(),
  thursdayOpen: z.string(),
  thursdayClose: z.string(),
  fridayOpen: z.string(),
  fridayClose: z.string(),
  saturdayOpen: z.string(),
  saturdayClose: z.string(),
  sundayOpen: z.string(),
  sundayClose: z.string(),
});

const systemSettingsSchema = z.object({
  allowReservations: z.boolean(),
  maxReservationDays: z.number().min(1).max(365),
  maxPartySize: z.number().min(1).max(50),
  requireEmail: z.boolean(),
  requirePhone: z.boolean(),
  autoConfirmReservations: z.boolean(),
  emailNotifications: z.boolean(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
type HoursSettingsData = z.infer<typeof hoursSettingsSchema>;
type SystemSettingsData = z.infer<typeof systemSettingsSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: true,
  });

  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      restaurantName: 'Barista Café',
      description: 'Un café authentique avec des produits de qualité',
      address: '123 Rue de la Paix, 75001 Paris',
      phone: '+33 1 23 45 67 89',
      email: 'contact@barista-cafe.fr',
      website: 'https://barista-cafe.fr',
    },
  });

  const hoursForm = useForm<HoursSettingsData>({
    resolver: zodResolver(hoursSettingsSchema),
    defaultValues: {
      mondayOpen: '08:00',
      mondayClose: '20:00',
      tuesdayOpen: '08:00',
      tuesdayClose: '20:00',
      wednesdayOpen: '08:00',
      wednesdayClose: '20:00',
      thursdayOpen: '08:00',
      thursdayClose: '20:00',
      fridayOpen: '08:00',
      fridayClose: '22:00',
      saturdayOpen: '09:00',
      saturdayClose: '22:00',
      sundayOpen: '09:00',
      sundayClose: '19:00',
    },
  });

  const systemForm = useForm<SystemSettingsData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      allowReservations: true,
      maxReservationDays: 30,
      maxPartySize: 8,
      requireEmail: true,
      requirePhone: false,
      autoConfirmReservations: false,
      emailNotifications: true,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Succès',
        description: 'Paramètres mis à jour avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour des paramètres',
        variant: 'destructive',
      });
    },
  });

  const onSubmitGeneral = (data: GeneralSettingsData) => {
    updateSettingsMutation.mutate({ type: 'general', ...data });
  };

  const onSubmitHours = (data: HoursSettingsData) => {
    updateSettingsMutation.mutate({ type: 'hours', ...data });
  };

  const onSubmitSystem = (data: SystemSettingsData) => {
    updateSettingsMutation.mutate({ type: 'system', ...data });
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configurez votre restaurant</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Général</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Horaires</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>Système</span>
          </TabsTrigger>
        </TabsList>

        {/* Paramètres généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Informations du Restaurant</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="restaurantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du Restaurant</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>Adresse</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>Téléphone</span>
                          </FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={(fullNumber, formatted, isValid) => {
                                field.onChange(fullNumber);
                              }}
                              placeholder="6 12 34 56 78"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>Site Web</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horaires d'ouverture */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Horaires d'Ouverture</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...hoursForm}>
                <form onSubmit={hoursForm.handleSubmit(onSubmitHours)} className="space-y-6">
                  {[
                    { key: 'monday', label: 'Lundi' },
                    { key: 'tuesday', label: 'Mardi' },
                    { key: 'wednesday', label: 'Mercredi' },
                    { key: 'thursday', label: 'Jeudi' },
                    { key: 'friday', label: 'Vendredi' },
                    { key: 'saturday', label: 'Samedi' },
                    { key: 'sunday', label: 'Dimanche' },
                  ].map((day) => (
                    <div key={day.key} className="grid grid-cols-3 gap-4 items-center">
                      <label className="font-medium">{day.label}</label>
                      <FormField
                        control={hoursForm.control}
                        name={`${day.key}Open` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={hoursForm.control}
                        name={`${day.key}Close` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  
                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres système */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Paramètres Système</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSubmitSystem)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={systemForm.control}
                      name="maxReservationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Réservation maximale (jours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Nombre de jours à l'avance pour réserver
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="maxPartySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille maximale du groupe</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Nombre maximum de personnes par réservation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={systemForm.control}
                      name="allowReservations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Autoriser les réservations</FormLabel>
                            <FormDescription>
                              Permettre aux clients de faire des réservations en ligne
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="requireEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email obligatoire</FormLabel>
                            <FormDescription>
                              Exiger une adresse email pour les réservations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="requirePhone"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Téléphone obligatoire</FormLabel>
                            <FormDescription>
                              Exiger un numéro de téléphone pour les réservations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="autoConfirmReservations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Confirmation automatique</FormLabel>
                            <FormDescription>
                              Confirmer automatiquement les réservations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Notifications email</FormLabel>
                            <FormDescription>
                              Envoyer des notifications par email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}