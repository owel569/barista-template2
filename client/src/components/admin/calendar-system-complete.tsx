import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, MapPin, Edit, Trash2, Plus, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export default function CalendarSystemComplete({ userRole }: CalendarSystemProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    type: 'meeting' as 'meeting' | 'event' | 'task' | 'reminder',
    attendees: '',
    location: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  });

  const { toast } = useToast();

  // Données d'exemple pour les événements
  const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'Réunion équipe',
      description: 'Réunion hebdomadaire de l\'équipe pour faire le point',
      start_time: '2025-07-10T09:00:00',
      end_time: '2025-07-10T10:00:00',
      type: 'meeting',
      attendees: 'Sophie, Pierre, Marie',
      location: 'Salle de réunion',
      priority: 'high',
      created_by: 1,
      created_at: '2025-07-09T14:00:00',
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Formation barista',
      description: 'Session de formation pour les nouveaux employés',
      start_time: '2025-07-11T14:00:00',
      end_time: '2025-07-11T17:00:00',
      type: 'event',
      attendees: 'Nouveaux employés',
      location: 'Bar principal',
      priority: 'medium',
      created_by: 1,
      created_at: '2025-07-08T10:00:00',
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Inventaire mensuel',
      description: 'Comptage et vérification du stock',
      start_time: '2025-07-12T08:00:00',
      end_time: '2025-07-12T12:00:00',
      type: 'task',
      attendees: 'Équipe gestion',
      location: 'Réserve',
      priority: 'high',
      created_by: 1,
      created_at: '2025-07-05T16:00:00',
      status: 'scheduled'
    }
  ];

  const getEventsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => 
      event.start_time.split('T')[0] === dateStr
    );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...eventForm,
      id: editingEvent?.id || Date.now(),
      created_at: editingEvent?.created_at || new Date().toISOString(),
      created_by: 1
    };

    if (editingEvent) {
      toast({
        title: 'Succès',
        description: 'Événement modifié avec succès',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Nouvel événement créé avec succès',
      });
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      type: 'meeting',
      attendees: '',
      location: '',
      priority: 'medium',
      status: 'scheduled'
    });
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      type: event.type,
      attendees: event.attendees,
      location: event.location,
      priority: event.priority,
      status: event.status
    });
    setIsDialogOpen(true);
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Système de Calendrier</h2>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEvent(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                </DialogTitle>
                <DialogDescription>
                  Planifiez vos événements et réunions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={eventForm.type} onValueChange={(value: any) => setEventForm({...eventForm, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
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
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Début</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Fin</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={eventForm.priority} onValueChange={(value: any) => setEventForm({...eventForm, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="attendees">Participants</Label>
                  <Input
                    id="attendees"
                    value={eventForm.attendees}
                    onChange={(e) => setEventForm({...eventForm, attendees: e.target.value})}
                    placeholder="Séparez les noms par des virgules"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingEvent(null);
                  }}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingEvent ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="events">Liste des événements</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-medium">
                {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <Button
                variant="outline"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              Aujourd'hui
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => {
                  const dayEvents = getEventsByDate(day);
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`p-1 rounded text-xs cursor-pointer ${getTypeColor(event.type)}`}
                            onClick={() => handleEdit(event)}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">
                              {new Date(event.start_time).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge className={getTypeColor(event.type)}>
                          {event.type === 'meeting' ? 'Réunion' :
                           event.type === 'event' ? 'Événement' :
                           event.type === 'task' ? 'Tâche' : 'Rappel'}
                        </Badge>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority === 'high' ? 'Élevée' :
                           event.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </Badge>
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status === 'scheduled' ? 'Programmé' :
                           event.status === 'in_progress' ? 'En cours' :
                           event.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(event.start_time).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(event.start_time).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
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
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === 'directeur' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun événement programmé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total événements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-gray-600">Ce mois-ci</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Réunions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.type === 'meeting').length}
                </div>
                <p className="text-xs text-gray-600">Programmées</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tâches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.type === 'task').length}
                </div>
                <p className="text-xs text-gray-600">À effectuer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Haute priorité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {events.filter(e => e.priority === 'high').length}
                </div>
                <p className="text-xs text-gray-600">Urgents</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Événements par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['meeting', 'event', 'task', 'reminder'].map(type => {
                  const count = events.filter(e => e.type === type).length;
                  const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getTypeColor(type).split(' ')[0]}`}></div>
                        <span className="capitalize">
                          {type === 'meeting' ? 'Réunions' :
                           type === 'event' ? 'Événements' :
                           type === 'task' ? 'Tâches' : 'Rappels'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{count}</span>
                        <span className="text-sm text-gray-400">({percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}