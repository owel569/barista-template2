import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, Plus, Edit, Trash2, ChevronLeft, ChevronRight, 
  Users, Coffee, PartyPopper, Settings
} from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  type: 'reservation' | 'event' | 'maintenance' | 'staff' | 'promotion';
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  attendees?: string[];
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface CalendarStats {
  totalEvents: number;
  eventsThisWeek: number;
  reservationsToday: number;
  maintenanceScheduled: number;
}

export default function CalendarManagement() : JSX.Element {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [eventsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/calendar/events?date=${currentDate.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/calendar/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (eventsRes.ok && statsRes.ok) {
        const [eventsData, statsData] = await Promise.all([
          eventsRes.json(),
          statsRes.json()
        ]);

        setEvents(eventsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reservation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'event':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'staff':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'promotion':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="h-4 w-4" />;
      case 'event':
        return <PartyPopper className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'staff':
        return <Users className="h-4 w-4" />;
      case 'promotion':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'reservation': return 'Réservation';
      case 'event': return 'Événement';
      case 'maintenance': return 'Maintenance';
      case 'staff': return 'Personnel';
      case 'promotion': return 'Promotion';
      default: return 'Autre';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }

    return days;
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const monthDays = getMonthDays(currentDate);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion du Calendrier
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Planning des événements et réservations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Jour
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Événement
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Événements
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalEvents}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Cette Semaine
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.eventsThisWeek}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Réservations Aujourd'hui
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.reservationsToday}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Maintenance Programmée
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.maintenanceScheduled}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="events">Liste des Événements</TabsTrigger>
          <TabsTrigger value="types">Types d'Événements</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {currentDate.toLocaleDateString('fr-FR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                <Button variant="outline" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grille du calendrier */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day, index) => {
                  const dayEvents = getDayEvents(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border rounded-lg ${
                        day.isCurrentMonth 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-gray-50 dark:bg-gray-900'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        day.isCurrentMonth 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getTypeColor(event.type)}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
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

        <TabsContent value="events" className="space-y-6">
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(event.type)}`}>
                        {getTypeIcon(event.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          <Badge className={getStatusColor(event.status)}>
                            {getStatusText(event.status)}
                          </Badge>
                          <Badge variant="outline">{getTypeText(event.type)}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <p className="font-medium">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Horaires:</span>
                            <p className="font-medium">{event.startTime} - {event.endTime}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                            <p className="font-medium">{event.attendees?.length || 0} personnes</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Description:</span>
                            <p className="font-medium truncate">{event.description || 'Aucune'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: 'reservation', name: 'Réservations', description: 'Réservations de tables clients', count: events.filter(e => e.type === 'reservation').length },
              { type: 'event', name: 'Événements', description: 'Événements spéciaux et animations', count: events.filter(e => e.type === 'event').length },
              { type: 'maintenance', name: 'Maintenance', description: 'Entretien et réparations', count: events.filter(e => e.type === 'maintenance').length },
              { type: 'staff', name: 'Personnel', description: 'Réunions et formations', count: events.filter(e => e.type === 'staff').length },
              { type: 'promotion', name: 'Promotions', description: 'Campagnes marketing et offres', count: events.filter(e => e.type === 'promotion').length }
            ].map((type) => (
              <Card key={type.type} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(type.type)}`}>
                      {getTypeIcon(type.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Événements actifs:
                    </span>
                    <Badge variant="outline">
                      {type.count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['reservation', 'event', 'maintenance', 'staff', 'promotion'].map((type) => {
                    const typeEvents = events.filter(e => e.type === type);
                    const percentage = events.length > 0 ? (typeEvents.length / events.length) * 100 : 0;

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="font-medium capitalize">{getTypeText(type)}</span>
                        <div className="text-right">
                          <p className="font-semibold">{typeEvents.length} événements</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques Hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Événements confirmés:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {events.filter(e => e.status === 'confirmed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>En attente:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {events.filter(e => e.status === 'scheduled').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Terminés:</span>
                    <Badge className="bg-gray-100 text-gray-800">
                      {events.filter(e => e.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de confirmation:</span>
                    <span className="font-semibold">
                      {events.length > 0 
                        ? Math.round((events.filter(e => e.status === 'confirmed').length / events.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}