
import React, { useState, useMemo } from 'react';
import { Calendar } from './calendar';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Clock, Users, MapPin } from 'lucide-react';

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  maxCapacity: number;
  currentReservations: number;
}

export interface ReservationCalendarProps {
  availableDates?: Date[];
  timeSlots?: TimeSlot[];
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect?: (date: Date) => void;
  onTimeSelect?: (timeSlot: TimeSlot) => void;
  minDate?: Date;
  maxDate?: Date;
  blackoutDates?: Date[];
  restaurantHours?: {
    open: string;
    close: string;
  };
}

export function ReservationCalendar({
  availableDates = [],
  timeSlots = [],
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  minDate = new Date(),
  maxDate,
  blackoutDates = [],
  restaurantHours = { open: '09:00', close: '23:00' }
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Générer les créneaux horaires par défaut
  const defaultTimeSlots = useMemo(() => {
    if (timeSlots.length > 0) return timeSlots;
    
    const slots: TimeSlot[] = [];
    const startHour = parseInt(restaurantHours.open.split(':')[0]);
    const endHour = parseInt(restaurantHours.close.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        slots.push({
          id: `${hour}-${minute}`,
          time,
          available: Math.random() > 0.3, // Simulation de disponibilité
          maxCapacity: 6,
          currentReservations: Math.floor(Math.random() * 4)
        });
      }
    }
    
    return slots;
  }, [timeSlots, restaurantHours]);

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toDateString();
    return blackoutDates.some(d => d.toDateString() === dateStr) ||
           (availableDates.length > 0 && !availableDates.some(d => d.toDateString() === dateStr));
  };

  const getAvailabilityBadge = (slot: TimeSlot) => {
    const availableSpots = slot.maxCapacity - slot.currentReservations;
    
    if (!slot.available || availableSpots <= 0) {
      return <Badge variant="destructive">Complet</Badge>;
    }
    
    if (availableSpots <= 2) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">
        {availableSpots} place{availableSpots > 1 ? 's' : ''}
      </Badge>;
    }
    
    return <Badge variant="outline" className="text-green-600 border-green-600">
      Disponible
    </Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Sélectionner une Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d: Date | undefined) => d && onDateSelect?.(d)}
            disabled={isDateDisabled}
            initialFocus
            className="rounded-md border"
            fromDate={minDate}
            toDate={maxDate}
          />
          
          {selectedDate && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Date sélectionnée : {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Créneaux horaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Créneaux Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sélectionnez d'abord une date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {defaultTimeSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isDisabled = !slot.available || 
                  (slot.currentReservations >= slot.maxCapacity);
                
                return (
                  <div key={slot.id} className="space-y-1">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={isDisabled}
                      onClick={() => onTimeSelect?.(slot)}
                      className="w-full justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {slot.time}
                    </Button>
                    
                    <div className="flex items-center justify-between text-xs">
                      {getAvailabilityBadge(slot)}
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {slot.currentReservations}/{slot.maxCapacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
