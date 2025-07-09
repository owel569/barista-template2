import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Bell,
  Repeat,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CalendarManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function CalendarManagement({ userRole = 'directeur' }: CalendarManagementProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('calendar');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'meeting',
    location: '',
    attendees: '',
    priority: 'medium',
    recurring: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données factices pour les événements
  const events = [
    {
      id: 1,
      title: 'Réunion équipe',
      description: 'Réunion hebdomadaire avec l\'équipe de service',
      date: '2025-07-10',
      startTime: '09:00',
      endTime: '10:00',
      type: 'meeting',
      location: 'Salle de réunion',
      attendees: ['Alice', 'Bob', 'Claire'],
      priority: 'high',
      status: 'confirmed',
      recurring: true
    },
    {
      id: 2,
      title: 'Formation nouveau barista',
      description: 'Formation sur les techniques de latte art',
      date: '2025-07-11',
      startTime: '14:00',
      endTime: '16:00',
      type: 'training',
      location: 'Bar principal',
      attendees: ['David', 'Eva'],
      priority: 'medium',
      status: 'pending',
      recurring: false
    },
    {
      id: 3,
      title: 'Livraison café',
      description: 'Réception livraison grains arabica',
      date: '2025-07-12',
      startTime: '08:30',
      endTime: '09:30',
      type: 'delivery',
      location: 'Entrepôt',
      attendees: ['Manager'],
      priority: 'high',
      status: 'confirmed',
      recurring: false
    },
    {
      id: 4,
      title: 'Maintenance machines',
      description: 'Maintenance préventive des machines à café',
      date: '2025-07-13',
      startTime: '16:00',
      endTime: '18:00',
      type: 'maintenance',
      location: 'Cuisine',
      attendees: ['Technicien'],
      priority: 'medium',
      status: 'confirmed',
      recurring: false
    },
    {
      id: 5,
      title: 'Événement spécial',
      description: 'Dégustation de nouveaux mélanges',
      date: '2025-07-14',
      startTime: '18:00',
      endTime: '20:00',
      type: 'event',
      location: 'Salle principale',
      attendees: ['Équipe complète'],
      priority: 'high',
      status: 'confirmed',
      recurring: false
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'training': return <Calendar className="h-4 w-4" />;
      case 'delivery': return <Repeat className="h-4 w-4" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      case 'event': return <CalendarDays className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent = {
      ...eventForm,
      id: Date.now(),
      attendees: eventForm.attendees.split(',').map(a => a.trim()),
      status: 'confirmed'
    };

    toast({
      title: "Événement ajouté",
      description: "L'événement a été ajouté au calendrier avec succès.",
    });

    setEventForm({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'meeting',
      location: '',
      attendees: '',
      priority: 'medium',
      recurring: false
    });
    setIsEventDialogOpen(false);
  };

  const renderCalendarView = () => (
    <div className="space-y-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setSelectedDate(today.toISOString().split('T')[0]);
            }}
          >
            Aujourd'hui
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button onClick={() => setIsEventDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Grille du calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Événements du {new Date(selectedDate).toLocaleDateString('fr-FR')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events
              .filter(event => event.date === selectedDate)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(event.type)}
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(event.priority)}>
                      {event.priority}
                    </Badge>
                    <Badge variant={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    {event.recurring && (
                      <Badge variant="outline">
                        <Repeat className="h-3 w-3 mr-1" />
                        Récurrent
                      </Badge>
                    )}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            {events.filter(event => event.date === selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun événement prévu pour cette date
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEventsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tous les événements</h3>
        <Button onClick={() => setIsEventDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      <div className="grid gap-4">
        {events.map(event => (
          <Card key={event.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getTypeIcon(event.type)}
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(event.date).toLocaleDateString('fr-FR')} • {event.startTime} - {event.endTime}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {event.description}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                    {event.attendees && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Users className="h-3 w-3" />
                        {Array.isArray(event.attendees) ? event.attendees.join(', ') : event.attendees}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(event.priority)}>
                    {event.priority}
                  </Badge>
                  <Badge variant={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  {event.recurring && (
                    <Badge variant="outline">
                      <Repeat className="h-3 w-3 mr-1" />
                      Récurrent
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Gestion du Calendrier</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {renderCalendarView()}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {renderEventsView()}
        </TabsContent>
      </Tabs>

      {/* Dialog pour ajouter un événement */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel événement au calendrier
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={eventForm.type} 
                  onValueChange={(value) => setEventForm({...eventForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="training">Formation</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="event">Événement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select 
                  value={eventForm.priority} 
                  onValueChange={(value) => setEventForm({...eventForm, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startTime">Heure de début *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="attendees">Participants</Label>
                <Input
                  id="attendees"
                  value={eventForm.attendees}
                  onChange={(e) => setEventForm({...eventForm, attendees: e.target.value})}
                  placeholder="Séparés par des virgules"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Ajouter l'événement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}