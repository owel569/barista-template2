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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, MapPin, Edit, Trash2, Plus, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarSystemProps {
  userRole: 'directeur' | 'employe';
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'meeting' | 'event' | 'task' | 'reminder';
  attendees: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  created_by: number;
  created_at: string;
}

export default function CalendarSystem({ userRole }: CalendarSystemProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données des événements
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/admin/calendar/events'],
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (newEvent: Omit<CalendarEvent, 'id' | 'created_at'>) => 
      apiRequest('/api/admin/calendar/events', {
        method: 'POST',
        body: JSON.stringify(newEvent),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calendar/events'] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: 'Succès',
        description: 'Événement créé avec succès',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...updateData }: Partial<CalendarEvent> & { id: number }) =>
      apiRequest(`/api/admin/calendar/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calendar/events'] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: 'Succès',
        description: 'Événement modifié avec succès',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/calendar/events/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calendar/events'] });
      toast({
        title: 'Succès',
        description: 'Événement supprimé avec succès',
      });
    },
  });

  // Fonctions utilitaires
  const getEventsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => 
      format(new Date(event.start_time), 'yyyy-MM-dd') === dateStr
    );
  };

  const getEventsByWeek = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'task': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reminder': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      type: formData.get('type') as 'meeting' | 'event' | 'task' | 'reminder',
      attendees: formData.get('attendees') as string,
      location: formData.get('location') as string,
      priority: formData.get('priority') as 'low' | 'medium' | 'high',
      created_by: 1, // ID utilisateur actuel
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, ...eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const renderCalendarView = () => {
    if (viewMode === 'week') {
      const weekEvents = getEventsByWeek(selectedDate);
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      return (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="min-h-[200px] border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                {format(day, 'EEE dd', { locale: fr })}
              </div>
              <div className="space-y-1">
                {getEventsByDate(day).map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded text-xs cursor-pointer ${getTypeColor(event.type)}`}
                    onClick={() => {
                      setEditingEvent(event);
                      setIsDialogOpen(true);
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {format(new Date(event.start_time), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {getEventsByDate(selectedDate).map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{event.title}</h3>
                    <Badge className={getTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    <Badge className={getPriorityColor(event.priority)}>
                      {event.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(event.start_time), 'HH:mm')} - 
                      {format(new Date(event.end_time), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    {event.attendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.attendees}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingEvent(event);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEventMutation.mutate(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderEventDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? 'Modifier l\'événement' : 'Nouveau événement'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmitEvent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingEvent?.title || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={editingEvent?.type || 'meeting'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="task">Tâche</SelectItem>
                  <SelectItem value="reminder">Rappel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={editingEvent?.description || ''}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Début</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                defaultValue={editingEvent?.start_time ? 
                  new Date(editingEvent.start_time).toISOString().slice(0, 16) : 
                  ''
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">Fin</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                defaultValue={editingEvent?.end_time ? 
                  new Date(editingEvent.end_time).toISOString().slice(0, 16) : 
                  ''
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                name="location"
                defaultValue={editingEvent?.location || ''}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select name="priority" defaultValue={editingEvent?.priority || 'medium'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="attendees">Participants</Label>
            <Input
              id="attendees"
              name="attendees"
              placeholder="Noms des participants (séparés par des virgules)"
              defaultValue={editingEvent?.attendees || ''}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending}>
              {editingEvent ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Gestion du Calendrier</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
          {renderEventDialog()}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                ← Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
              >
                Suivant →
              </Button>
            </div>
            <div className="text-lg font-medium">
              {format(selectedDate, 'MMMM yyyy', { locale: fr })}
            </div>
          </div>
          {renderCalendarView()}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge className={getTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.start_time), 'dd/MM/yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(new Date(event.start_time), 'HH:mm')} - 
                      {format(new Date(event.end_time), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du calendrier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications push</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recevoir des notifications pour les événements
                  </p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rappels par email</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recevoir des rappels par email
                  </p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vue par défaut</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vue à afficher au démarrage
                  </p>
                </div>
                <Select defaultValue="week">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Jour</SelectItem>
                    <SelectItem value="week">Semaine</SelectItem>
                    <SelectItem value="month">Mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}