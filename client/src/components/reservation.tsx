import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Utilise le même type que ton schéma Zod, donc snake_case !
type ReservationFormData = z.infer<typeof insertReservationSchema>;

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
    reset,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(insertReservationSchema),
    defaultValues: {
      guests: 2,
    },
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
        description:
          error.message || "Une erreur est survenue lors de la réservation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    reservationMutation.mutate(data);
  };

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];

  // Format date for display (DD/MM/YYYY)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
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
                  <Label
                    htmlFor="date"
                    className="block text-coffee-dark font-semibold mb-2"
                  >
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.date.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="time"
                    className="block text-coffee-dark font-semibold mb-2"
                  >
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
                        const time = `${hour.toString().padStart(2, "0")}:${minutes}`;
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.time.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="guests"
                  className="block text-coffee-dark font-semibold mb-2"
                >
                  Nombre de personnes *
                </Label>
                <Select onValueChange={(value) => setValue("guests", parseInt(value))}>
                  <SelectTrigger className="focus:border-coffee-accent">
                    <SelectValue placeholder="Choisir le nombre de personnes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} personne{i > 0 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.guests && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.guests.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="customer_name"
                    className="block text-coffee-dark font-semibold mb-2"
                  >
                    Nom complet *
                  </Label>
                  <Input
                    id="customer_name"
                    {...register("customer_name")}
                    placeholder="Votre nom complet"
                    className="focus:border-coffee-accent"
                  />
                  {errors.customer_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customer_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="customer_email"
                    className="block text-coffee-dark font-semibold mb-2"
                  >
                    Email *
                  </Label>
                  <Input
                    id="customer_email"
                    type="email"
                    {...register("customer_email")}
                    placeholder="votre@email.com"
                    className="focus:border-coffee-accent"
                  />
                  {errors.customer_email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customer_email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="customer_phone"
                  className="block text-coffee-dark font-semibold mb-2"
                >
                  Téléphone *
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  {...register("customer_phone")}
                  placeholder="06 12 34 56 78"
                  className="focus:border-coffee-accent"
                />
                {errors.customer_phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customer_phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="special_requests"
                  className="block text-coffee-dark font-semibold mb-2"
                >
                  Demandes spéciales
                </Label>
                <Textarea
                  id="special_requests"
                  {...register("special_requests")}
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
                {reservationMutation.isPending
                  ? "Confirmation..."
                  : "Confirmer la réservation"}
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
                  {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                    <div
                      key={index}
                      className="text-center font-semibold text-coffee-dark p-2"
                    >
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
                  <span>
                    123 Rue du Café
                    <br />
                    75001 Paris, France
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}