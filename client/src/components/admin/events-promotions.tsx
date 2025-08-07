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
  Star, Coffee, Music, Camera, Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: number;
  title: string;
  description: string;
  type: 'workshop' | 'tasting' | 'live_music' | 'art_exhibition' | 'private_event' | 'celebration';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed';
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
  type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'loyalty_points' | 'free_item';
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
  customerSegment: 'all' | 'new' | 'loyal' | 'vip';
  createdAt: string;
  updatedAt: string;
}

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

export default function EventsPromotions() : JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const { toast } = useToast();

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
          createdAt: new Date(}).toISOString(),
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
          createdAt: new Date()}).toISOString(),
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
          applicableItems: ['café',],
          customerSegment: 'vip',
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
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: selectedEvent ? "Événement modifié" : "Événement créé",
          description: selectedEvent ? "L'événement a été modifié avec succès" : "L'événement a été créé avec succès"
        )});
        setShowEventDialog(false);
        setSelectedEvent(null);
        eventForm.reset();
        fetchEventsAndPromotions();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'événement",
        variant: "destructive"
      });
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
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: selectedPromotion ? "Promotion modifiée" : "Promotion créée",
          description: selectedPromotion ? "La promotion a été modifiée avec succès" : "La promotion a été créée avec succès"
        )});
        setShowPromotionDialog(false);
        setSelectedPromotion(null);
        promotionForm.reset();
        fetchEventsAndPromotions();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la promotion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la promotion",
        variant: "destructive"
      });
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'workshop': return <Coffee className="h-4 w-4" />;
      case 'tasting': return <Star className="h-4 w-4" />;
      case 'live_music': return <Music className="h-4 w-4" />;
      case 'art_exhibition': return <Camera className="h-4 w-4" />;
      case 'private_event': return <Users className="h-4 w-4" />;
      case 'celebration': return <Trophy className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'full': return 'Complet';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return 'Inconnu';
    }
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
            <DialogContent className="max-w-2xl">
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
                    render={({ field )}) => (
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
                        <FormItem>
                          <FormLabel>Nombre maximum de participants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={eventForm.control}
                    name="price"
                    render={({ field )}) => (
                      <FormItem>
                        <FormLabel>Prix (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
            <DialogContent className="max-w-2xl">
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
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
                    render={({ field )}) => (
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
                      render={({ field )}) => (
                        <FormItem>
                          <FormLabel>Valeur de réduction</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="customerSegment"
                      render={({ field )}) => (
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
                      name="startDate"
                      render={({ field )}) => (
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
                      render={({ field )}) => (
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
            {events.map(event => (
              <Card key={event.id)} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(event.status)}>
                      {getStatusText(event.status)}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getEventTypeIcon(event.type)}
                      <span className="text-sm text-gray-600 capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
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
                      {event.location}
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
                            eventForm.reset(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promotion => (
              <Card key={promotion.id)} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Gift className="h-4 w-4" />
                      <span className="text-sm text-gray-600 capitalize">
                        {promotion.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{promotion.name}</CardTitle>
                  <CardDescription>{promotion.description}</CardDescription>
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
                      {new Date(promotion.startDate).toLocaleDateString('fr-FR')} - {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {promotion.customerSegment === 'all' ? 'Tous les clients' : 
                       promotion.customerSegment === 'new' ? 'Nouveaux clients' :
                       promotion.customerSegment === 'loyal' ? 'Clients fidèles' : 'Clients VIP'}
                    </div>
                    {promotion.usageLimit && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Trophy className="h-4 w-4 mr-2" />
                        {promotion.usageCount)}/{promotion.usageLimit} utilisations
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      {promotion.code && (
                        <Badge variant="secondary" className="font-mono">
                          {promotion.code)}
                        </Badge>
                      )}
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            promotionForm.reset(promotion);
                            setShowPromotionDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}