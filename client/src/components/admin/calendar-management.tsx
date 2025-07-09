import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface CalendarManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function CalendarManagement({ userRole = 'directeur' }: CalendarManagementProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des réservations pour le calendrier
  const { data: reservations = [] } = useQuery({
    queryKey: ['/api/reservations'],
    refetchInterval: 5000,
  });

  // Récupération des employés
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    refetchInterval: 5000,
  });

  // Événements factices pour démonstration
  const events = [
    {
      id: 1,
      title: 'Formation équipe',
      date: '2025-07-10',
      time: '09:00',
      type: 'formation',
      description: 'Formation sur les nouvelles procédures',
      participants: ['Alice Johnson', 'Bob Smith'],
      location: 'Salle de formation'
    },
    {
      id: 2,
      title: 'Réunion mensuelle',
      date: '2025-07-15',
      time: '14:00',
      type: 'reunion',
      description: 'Bilan du mois et objectifs',
      participants: ['Tous les employés'],
      location: 'Bureau principal'
    },
    {
      id: 3,
      title: 'Inventaire stock',
      date: '2025-07-20',
      time: '08:00',
      type: 'inventaire',
      description: 'Inventaire mensuel complet',
      participants: ['Claire Davis', 'David Wilson'],
      location: 'Entrepôt'
    },
    {
      id: 4,
      title: 'Événement spécial',
      date: '2025-07-25',
      time: '18:00',
      type: 'evenement',
      description: 'Soirée dégustation café',
      participants: ['Tous'],
      location: 'Café principal'
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'formation': return 'bg-blue-500';
      case 'reunion': return 'bg-green-500';
      case 'inventaire': return 'bg-orange-500';
      case 'evenement': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'formation': return 'default';
      case 'reunion': return 'secondary';
      case 'inventaire': return 'destructive';
      case 'evenement': return 'outline';
      default: return 'secondary';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const renderCalendarGrid = () => {
    const days = getDaysInMonth();
    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {weekDays.map(day => (
            <div key={day} className="bg-white dark:bg-gray-800 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`
                  bg-white dark:bg-gray-800 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700
                  ${!day.isCurrentMonth ? 'opacity-40' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => {
                  // Action au clic sur un jour
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setIsEventDialogOpen(true);
                      }}
                    >
                      {event.time} - {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 p-1">
                      +{dayEvents.length - 2} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEventsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Événements à venir</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      <div className="space-y-3">
        {events.map(event => (
          <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant={getEventTypeBadge(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.participants.join(', ')}
                    </div>
                  </div>
                  <p className="text-sm mt-2">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion du Calendrier</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="list">Liste</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrer
          </Button>
        </div>
      </div>

      {selectedView === 'month' && (
        <div className="space-y-4">
          {/* Navigation du calendrier */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {renderCalendarGrid()}
        </div>
      )}

      {selectedView === 'list' && renderEventsList()}

      {/* Dialog pour les détails d'événement */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getEventTypeBadge(selectedEvent.type)}>
                  {selectedEvent.type}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.participants.join(', ')}</span>
                </div>
              </div>
              <p>{selectedEvent.description}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                  Fermer
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}