import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar, Gift, Percent, Users, Clock, MapPin, 
  Plus, Edit, Trash2, Eye, Share2, Mail, 
  Star, Coffee, Music, Camera, Trophy, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
type EventType = 'workshop' | 'tasting' | 'live_music' | 'art_exhibition' | 'private_event' | 'celebration';
type EventStatus = 'draft' | 'published' | 'full' | 'cancelled' | 'completed';
type PromotionType = 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'loyalty_points' | 'free_item';
type CustomerSegment = 'all' | 'new' | 'loyal' | 'vip';

interface Event {
  id: number;
  title: string;
  description: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  status: EventStatus;
  imageUrl?: string;
  requirements?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  type: PromotionType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  applicableItems: string[];
  code?: string;
  customerSegment: CustomerSegment;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const eventSchema = z.object({
  title: z.string().min(3, "Titre requis (minimum 3 caractères)"),
  description: z.string().min(10, "Description requise (minimum 10 caractères)"),
  type: z.string().min(1, "Type d'événement requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  location: z.string().min(1, "Lieu requis"),
  maxAttendees: z.number().min(1, "Nombre maximum de participants requis"),
  price: z.number().min(0, "Prix requis"),
  imageUrl: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

const promotionSchema = z.object({
  name: z.string().min(3, "Nom requis (minimum 3 caractères)"),
  description: z.string().min(10, "Description requise (minimum 10 caractères)"),
  type: z.string().min(1, "Type de promotion requis"),
  discountValue: z.number().min(0, "Valeur de réduction requise"),
  minOrderValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  usageLimit: z.number().optional(),
  code: z.string().optional(),
  customerSegment: z.string().min(1, "Segment client requis"),
});

export default function EventsPromotions(): JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const { toast } = useToast();

  // Form hooks
  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      maxAttendees: 0,
      price: 0,
      imageUrl: '',
      requirements: []
    }
  });

  const promotionForm = useForm<z.infer<typeof promotionSchema>>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 0,
      code: '',
      customerSegment: 'all'
    }
  });

  useEffect(() => {
    fetchEventsAndPromotions();
  }, []);

  const fetchEventsAndPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [eventsRes, promotionsRes] = await Promise.all([
        fetch('/api/admin/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/promotions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (eventsRes.ok && promotionsRes.ok) {
        const [eventsData, promotionsData] = await Promise.all([
          eventsRes.json(),
          promotionsRes.json()
        ]);
        
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements et promotions:', error);
      // Données d'exemple pour la démonstration
      setEvents([
        {
          id: 1,
          title: 'Dégustation Café Premium',
          description: 'Découvrez nos cafés d\'exception avec notre torréfacteur expert',
          type: 'tasting',
          date: '2024-07-15',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Barista Café - Salle principale',
          maxAttendees: 12,
          currentAttendees: 8,
          price: 25.00,
          status: 'published',
          tags: ['café', 'dégustation', 'expert'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Atelier Latte Art',
          description: 'Apprenez l\'art du latte art avec nos baristas professionnels',
          type: 'workshop',
          date: '2024-07-20',
          startTime: '10:00',
          endTime: '12:00',
          location: 'Barista Café - Espace formation',
          maxAttendees: 8,
          currentAttendees: 3,
          price: 35.00,
          status: 'published',
          tags: ['latte art', 'atelier', 'formation'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Concert Jazz & Café',
          description: 'Une soirée musicale exceptionnelle avec des artistes locaux',
          type: 'live_music',
          date: '2024-07-25',
          startTime: '20:00',
          endTime: '22:30',
          location: 'Barista Café - Grande salle',
          maxAttendees: 50,
          currentAttendees: 42,
          price: 15.00,
          status: 'published',
          tags: ['jazz', 'musique', 'soirée'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

      setPromotions([
        {
          id: 1,
          name: 'Happy Hour Café',
          description: '20% de réduction sur tous les cafés de 14h à 16h',
          type: 'percentage',
          discountValue: 20,
          startDate: '2024-07-01',
          endDate: '2024-07-31',
          isActive: true,
          usageLimit: 1000,
          usageCount: 156,
          applicableItems: ['café', 'espresso', 'cappuccino'],
          customerSegment: 'all',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Fidélité VIP',
          description: 'Café gratuit à partir de 10 achats pour les clients VIP',
          type: 'loyalty_points',
          discountValue: 100,
          startDate: '2024-07-01',
          endDate: '2024-12-31',
          isActive: true,
          usageLimit: 500,
          usageCount: 23,
          applicableItems: ['café'],
          customerSegment: 'vip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Nouveau Client -50%',
          description: 'Première commande à moitié prix pour les nouveaux clients',
          type: 'percentage',
          discountValue: 50,
          minOrderValue: 10,
          maxDiscount: 15,
          startDate: '2024-07-01',
          endDate: '2024-12-31',
          isActive: true,
          code: 'NOUVEAU50',
          customerSegment: 'new',
          applicableItems: ['café', 'pâtisserie', 'sandwich'],
          usageCount: 89,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (data: z.infer<typeof eventSchema>) => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedEvent ? `/api/admin/events/${selectedEvent.id}` : '/api/admin/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          status: selectedEvent?.status || 'draft',
          currentAttendees: selectedEvent?.currentAttendees || 0,
          tags: [],
          createdAt: selectedEvent?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: selectedEvent ? "Événement modifié" : "Événement créé",
          description: selectedEvent ? "L'événement a été modifié avec succès" : "L'événement a été créé avec succès"
        });
        setShowEventDialog(false);
        setSelectedEvent(null);
        eventForm.reset();
        fetchEventsAndPromotions();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
      // Simulation de création/modification pour la demo
      const newEvent: Event = {
        id: selectedEvent?.id || Math.floor(Math.random() * 1000),
        ...data,
        type: data.type as EventType,
        status: selectedEvent?.status || 'draft',
        currentAttendees: selectedEvent?.currentAttendees || 0,
        tags: [],
        createdAt: selectedEvent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedEvent) {
        setEvents(prev => prev.map(e => e.id === selectedEvent.id ? newEvent : e));
      } else {
        setEvents(prev => [...prev, newEvent]);
      }

      toast({
        title: selectedEvent ? "Événement modifié" : "Événement créé",
        description: selectedEvent ? "L'événement a été modifié avec succès" : "L'événement a été créé avec succès"
      });
      setShowEventDialog(false);
      setSelectedEvent(null);
      eventForm.reset();
    }
  };

  const handlePromotionSubmit = async (data: z.infer<typeof promotionSchema>) => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedPromotion ? `/api/admin/promotions/${selectedPromotion.id}` : '/api/admin/promotions';
      const method = selectedPromotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          isActive: selectedPromotion?.isActive ?? true,
          usageCount: selectedPromotion?.usageCount || 0,
          applicableItems: [],
          createdAt: selectedPromotion?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: selectedPromotion ? "Promotion modifiée" : "Promotion créée",
          description: selectedPromotion ? "La promotion a été modifiée avec succès" : "La promotion a été créée avec succès"
        });
        setShowPromotionDialog(false);
        setSelectedPromotion(null);
        promotionForm.reset();
        fetchEventsAndPromotions();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la promotion:', error);
      // Simulation de création/modification pour la demo
      const newPromotion: Promotion = {
        id: selectedPromotion?.id || Math.floor(Math.random() * 1000),
        ...data,
        type: data.type as PromotionType,
        customerSegment: data.customerSegment as CustomerSegment,
        isActive: selectedPromotion?.isActive ?? true,
        usageCount: selectedPromotion?.usageCount || 0,
        applicableItems: [],
        createdAt: selectedPromotion?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedPromotion) {
        setPromotions(prev => prev.map(p => p.id === selectedPromotion.id ? newPromotion : p));
      } else {
        setPromotions(prev => [...prev, newPromotion]);
      }

      toast({
        title: selectedPromotion ? "Promotion modifiée" : "Promotion créée",
        description: selectedPromotion ? "La promotion a été modifiée avec succès" : "La promotion a été créée avec succès"
      });
      setShowPromotionDialog(false);
      setSelectedPromotion(null);
      promotionForm.reset();
    }
  };

  // Helper functions
  const getEventTypeIcon = (type: EventType) => {
    const icons = {
      workshop: <Coffee className="h-4 w-4" />,
      tasting: <Star className="h-4 w-4" />,
      live_music: <Music className="h-4 w-4" />,
      art_exhibition: <Camera className="h-4 w-4" />,
      private_event: <Users className="h-4 w-4" />,
      celebration: <Trophy className="h-4 w-4" />
    };
    return icons[type] || <Calendar className="h-4 w-4" />;
  };

  const getStatusColor = (status: EventStatus) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      full: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: EventStatus) => {
    const texts = {
      published: 'Publié',
      draft: 'Brouillon',
      full: 'Complet',
      cancelled: 'Annulé',
      completed: 'Terminé'
    };
    return texts[status] || 'Inconnu';
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      setEvents(prev => prev.filter(e => e.id !== id));
      toast({ 
        title: "Événement supprimé", 
        description: "L'événement a été supprimé avec succès" 
      });
    }
  };

  const handleDeletePromotion = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette promotion ?")) {
      setPromotions(prev => prev.filter(p => p.id !== id));
      toast({ 
        title: "Promotion supprimée", 
        description: "La promotion a été supprimée avec succès" 
      });
    }
  };

  const formatEventType = (type: string) => {
    const types = {
      workshop: 'Atelier',
      tasting: 'Dégustation',
      live_music: 'Concert',
      art_exhibition: 'Exposition',
      private_event: 'Événement privé',
      celebration: 'Célébration'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatPromotionType = (type: string) => {
    const types = {
      percentage: 'Pourcentage',
      fixed_amount: 'Montant fixe',
      buy_one_get_one: 'Achetez-en un, obtenez-en un',
      loyalty_points: 'Points de fidélité',
      free_item: 'Article gratuit'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatCustomerSegment = (segment: string) => {
    const segments = {
      all: 'Tous les clients',
      new: 'Nouveaux clients',
      loyal: 'Clients fidèles',
      vip: 'Clients VIP'
    };
    return segments[segment as keyof typeof segments] || segment;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Événements & Promotions</h2>
        <div className="flex space-x-2">
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedEvent(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedEvent ? "Modifier l'événement" : "Créer un événement"}
                </DialogTitle>
                <DialogDescription>
                  Configurez les détails de votre événement
                </DialogDescription>
              </DialogHeader>
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit(handleEventSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input placeholder="Titre de l'événement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="workshop">Atelier</SelectItem>
                              <SelectItem value="tasting">Dégustation</SelectItem>
                              <SelectItem value="live_music">Concert</SelectItem>
                              <SelectItem value="art_exhibition">Exposition</SelectItem>
                              <SelectItem value="private_event">Événement privé</SelectItem>
                              <SelectItem value="celebration">Célébration</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description de l'événement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de début</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de fin</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lieu</FormLabel>
                          <FormControl>
                            <Input placeholder="Lieu de l'événement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="maxAttendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre maximum de participants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de l'image (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowEventDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedEvent ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setSelectedPromotion(null)}>
                <Gift className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPromotion ? "Modifier la promotion" : "Créer une promotion"}
                </DialogTitle>
                <DialogDescription>
                  Configurez les détails de votre promotion
                </DialogDescription>
              </DialogHeader>
              <Form {...promotionForm}>
                <form onSubmit={promotionForm.handleSubmit(handlePromotionSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de la promotion" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Pourcentage</SelectItem>
                              <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                              <SelectItem value="buy_one_get_one">Achetez-en un, obtenez-en un</SelectItem>
                              <SelectItem value="loyalty_points">Points de fidélité</SelectItem>
                              <SelectItem value="free_item">Article gratuit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={promotionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description de la promotion" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valeur de réduction</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="customerSegment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment client</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le segment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Tous les clients</SelectItem>
                              <SelectItem value="new">Nouveaux clients</SelectItem>
                              <SelectItem value="loyal">Clients fidèles</SelectItem>
                              <SelectItem value="vip">Clients VIP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="minOrderValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commande minimum (€) - Optionnel</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="maxDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Réduction maximum (€) - Optionnel</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite d'utilisation - Optionnel</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code promo - Optionnel</FormLabel>
                          <FormControl>
                            <Input placeholder="CODE123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowPromotionDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedPromotion ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Événements ({events.length})</TabsTrigger>
          <TabsTrigger value="promotions">Promotions ({promotions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(event.status)}>
                      {getStatusText(event.status)}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getEventTypeIcon(event.type)}
                      <span className="text-sm text-gray-600">
                        {formatEventType(event.type)}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {event.currentAttendees}/{event.maxAttendees} participants
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-orange-600">
                        {event.price > 0 ? `${event.price.toFixed(2)}€` : 'Gratuit'}
                      </span>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            eventForm.reset({
                              title: event.title,
                              description: event.description,
                              type: event.type,
                              date: event.date,
                              startTime: event.startTime,
                              endTime: event.endTime,
                              location: event.location,
                              maxAttendees: event.maxAttendees,
                              price: event.price,
                              imageUrl: event.imageUrl || '',
                              requirements: event.requirements || []
                            });
                            setShowEventDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {events.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
              <p className="text-gray-600">Créez votre premier événement pour commencer.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Gift className="h-4 w-4" />
                      <span className="text-sm text-gray-600">
                        {formatPromotionType(promotion.type)}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{promotion.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{promotion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Percent className="h-4 w-4 mr-2" />
                      {promotion.type === 'percentage' ? `${promotion.discountValue}%` : 
                       promotion.type === 'fixed_amount' ? `${promotion.discountValue}€` : 
                       `${promotion.discountValue} points`}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {new Date(promotion.startDate).toLocaleDateString('fr-FR')} - {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {formatCustomerSegment(promotion.customerSegment)}
                      </span>
                    </div>
                    {promotion.usageLimit && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Trophy className="h-4 w-4 mr-2" />
                        {promotion.usageCount}/{promotion.usageLimit} utilisations
                      </div>
                    )}
                    {promotion.minOrderValue && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-xs">Min: {promotion.minOrderValue}€</span>
                        {promotion.maxDiscount && (
                          <span className="text-xs ml-2">Max: {promotion.maxDiscount}€</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      {promotion.code && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {promotion.code}
                        </Badge>
                      )}
                      <div className="flex space-x-1 ml-auto">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            promotionForm.reset({
                              name: promotion.name,
                              description: promotion.description,
                              type: promotion.type,
                              discountValue: promotion.discountValue,
                              minOrderValue: promotion.minOrderValue || 0,
                              maxDiscount: promotion.maxDiscount || 0,
                              startDate: promotion.startDate,
                              endDate: promotion.endDate,
                              usageLimit: promotion.usageLimit || 0,
                              code: promotion.code || '',
                              customerSegment: promotion.customerSegment
                            });
                            setShowPromotionDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePromotion(promotion.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {promotions.length === 0 && (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune promotion</h3>
              <p className="text-gray-600">Créez votre première promotion pour attirer vos clients.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}