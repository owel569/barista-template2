import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, Phone, Mail, MapPin, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ReservationFormData = z.infer<typeof insertReservationSchema>;

interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  createdAt: string;
}

export default function Reservation() {
  const [selectedDate, setSelectedDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ReservationFormData>({
    resolver: zodResolver(insertReservationSchema),
    defaultValues: {
      guests: 2
    }
  });

  const dateValue = watch("date");
  const timeValue = watch("time");

  // Get today's reservations for display
  const { data: todayReservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/date", new Date().toISOString().split('T')[0]],
    enabled: false // Disable for now
  });

  const reservationMutation = useMutation({
    mutationFn: (data: ReservationFormData) => 
      apiRequest("POST", "/api/reservations", data),
    onSuccess: () => {
      toast({
        title: "Réservation confirmée !",
        description: "Votre table a été réservée avec succès.",
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de réservation",
        description: error.message || "Une erreur est survenue lors de la réservation.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ReservationFormData) => {
    reservationMutation.mutate(data);
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  
  // Format date for display (DD/MM/YYYY)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  // Mock calendar data for display
  const mockCalendarDays = [
    { day: 1, available: true },
    { day: 2, available: true },
    { day: 3, available: false },
    { day: 4, available: true },
    { day: 5, available: true },
    { day: 6, available: false },
    { day: 7, available: true },
  ];

  return (
    <section id="reservation" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">
            Réservation de Table
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Réservez votre table en quelques clics et profitez d'une expérience unique dans notre café
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Reservation Form */}
          <div className="bg-coffee-cream rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-semibold text-coffee-dark mb-6">
              <CheckCircle className="inline mr-2 text-coffee-accent" />
              Nouvelle Réservation
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="block text-coffee-dark font-semibold mb-2">
                    Date de réservation *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    {...register("date")}
                    className="focus:border-coffee-accent"
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="time" className="block text-coffee-dark font-semibold mb-2">
                    Heure *
                  </Label>
                  <Select onValueChange={(value) => setValue("time", value)}>
                    <SelectTrigger className="focus:border-coffee-accent">
                      <SelectValue placeholder="Choisir l'heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 26 }, (_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const minutes = i % 2 === 0 ? "00" : "30";
                        const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
                        if (hour > 21) return null;
                        return (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.time && (
                    <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="guests" className="block text-coffee-dark font-semibold mb-2">
                  Nombre de personnes *
                </Label>
                <Select onValueChange={(value) => setValue("guests", parseInt(value))}>
                  <SelectTrigger className="focus:border-coffee-accent">
                    <SelectValue placeholder="Choisir le nombre de personnes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} personne{i > 0 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.guests && (
                  <p className="text-red-500 text-sm mt-1">{errors.guests.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName" className="block text-coffee-dark font-semibold mb-2">
                    Nom complet *
                  </Label>
                  <Input
                    id="customerName"
                    {...register("customerName")}
                    placeholder="Votre nom complet"
                    className="focus:border-coffee-accent"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="block text-coffee-dark font-semibold mb-2">
                    Email *
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail")}
                    placeholder="votre@email.com"
                    className="focus:border-coffee-accent"
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="customerPhone" className="block text-coffee-dark font-semibold mb-2">
                  Téléphone *
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  {...register("customerPhone")}
                  placeholder="06 12 34 56 78"
                  className="focus:border-coffee-accent"
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="specialRequests" className="block text-coffee-dark font-semibold mb-2">
                  Demandes spéciales
                </Label>
                <Textarea
                  id="specialRequests"
                  {...register("specialRequests")}
                  rows={4}
                  placeholder="Allergies, préférences de table, célébrations..."
                  className="focus:border-coffee-accent"
                />
              </div>

              <Button
                type="submit"
                disabled={reservationMutation.isPending}
                className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {reservationMutation.isPending ? "Confirmation..." : "Confirmer la réservation"}
              </Button>
            </form>
          </div>

          {/* Reservation Info & Availability */}
          <div className="space-y-8">
            {/* Availability Calendar */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-coffee-dark">
                  <Calendar className="inline mr-2 text-coffee-accent" />
                  Disponibilités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                    <div key={index} className="text-center font-semibold text-coffee-dark p-2">
                      {day}
                    </div>
                  ))}
                  
                  <div className="text-center p-2 text-gray-400">28</div>
                  <div className="text-center p-2 text-gray-400">29</div>
                  <div className="text-center p-2 text-gray-400">30</div>
                  
                  {mockCalendarDays.map((dayData, index) => (
                    <div
                      key={index}
                      className={`text-center p-2 rounded cursor-pointer transition duration-200 ${
                        dayData.available
                          ? "bg-coffee-green text-white hover:bg-coffee-accent"
                          : "bg-red-500 text-white cursor-not-allowed"
                      }`}
                    >
                      {dayData.day}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-coffee-green rounded mr-2"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    <span>Complet</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-coffee-dark text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Info className="inline mr-2 text-coffee-accent" />
                  Informations Pratiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Clock className="mr-3 text-coffee-accent h-5 w-5" />
                  <span>Ouvert de 8h à 21h tous les jours</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-3 text-coffee-accent h-5 w-5" />
                  <span>01 23 45 67 89</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-3 text-coffee-accent h-5 w-5" />
                  <span>contact@barista-cafe.fr</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-3 text-coffee-accent h-5 w-5 mt-1" />
                  <span>123 Rue du Café<br />75001 Paris, France</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reservations */}
            <Card className="bg-gray-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-coffee-dark">
                  <Calendar className="inline mr-2 text-coffee-accent" />
                  Réservations Récentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-coffee-accent">
                  <div>
                    <div className="font-semibold text-coffee-dark">Marie Dubois</div>
                    <div className="text-sm text-gray-600">2 personnes - 19:30</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-coffee-green">{formatDateShort(today)}</div>
                    <div className="text-xs text-gray-500">Confirmée</div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-coffee-secondary">
                  <div>
                    <div className="font-semibold text-coffee-dark">Jean Martin</div>
                    <div className="text-sm text-gray-600">4 personnes - 12:30</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-coffee-accent">
                      {formatDateShort(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                    </div>
                    <div className="text-xs text-gray-500">En attente</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
