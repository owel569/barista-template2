import React from 'react';
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle, 
  X,
  ShoppingCart,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  specialRequests?: string;
  preorderTotal: string;
  notificationSent: boolean;
  createdAt: string;
  reservationItems?: ReservationItem[];
}

interface ReservationItem {
  id: number;
  menuItemName: string;
  quantity: number;
  unitPrice: string;
  notes?: string;
}

export default function ReservationNotifications() : JSX.Element {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des réservations
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["/api/admin/reservations"],
    refetchInterval: 30000, // Actualisation toutes les 30 secondes
  });

  // Récupération des réservations avec notifications non envoyées
  const { data: newReservations = [] } = useQuery({
    queryKey: ["/api/admin/notifications/pending-reservations"],
    refetchInterval: 10000, // Vérification toutes les 10 secondes
  });

  // Mutation pour marquer les notifications comme envoyées
  const markNotificationSentMutation = useMutation({
    mutationFn: (reservationId: number) => 
      apiRequest("PATCH", `/api/admin/reservations/${reservationId}/notification-sent`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/pending-reservations"] });
    },
  });

  // Notification audio et visuelle pour nouvelles réservations
  useEffect(() => {
    if (newReservations.length > 0) {
      // Notification sonore (si autorisée par le navigateur)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0wWIdBDuNz+vHeSsFJnvG7+uAP...');
        audio.play().catch(() => {
          // Ignorer les erreurs de lecture audio
        });
      } catch (error) {
        // Ignorer les erreurs de création audio
      }

      // Toast notification
      toast({
        title: `${newReservations.length} nouvelle(s) réservation(s)`,
        description: "Consultez le tableau de bord pour plus de détails",
      });
    }
  }, [newReservations.length, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500 text-white">Confirmée</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      case "completed":
        return <Badge className="bg-blue-500 text-white">Terminée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReservationsToShow = () => {
    if (showAll) {
      return reservations;
    }
    
    // Afficher les réservations d'aujourd'hui et de demain par défaut
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return reservations.filter((reservation: Reservation) => 
      reservation.date === today || reservation.date === tomorrow
    );
  };

  const handleMarkNotificationSent = (reservationId: number) => {
    markNotificationSentMutation.mutate(reservationId);
  };

  const reservationsToShow = getReservationsToShow();
  const pendingNotifications = newReservations.length;

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur de notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-coffee-accent" />
            {pendingNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                {pendingNotifications}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold text-coffee-dark">
            Réservations {showAll ? "Toutes" : "Aujourd'hui/Demain"}
          </h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            className="border-coffee-secondary"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showAll ? "Masquer anciennes" : "Voir toutes"}
          </Button>
          {pendingNotifications > 0 && (
            <Badge className="bg-red-500 text-white px-3 py-1">
              {pendingNotifications} nouvelles
            </Badge>
          )}
        </div>
      </div>

      {/* Liste des réservations */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-accent mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des réservations...</p>
            </div>
          ) : reservationsToShow.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune réservation pour la période sélectionnée</p>
              </CardContent>
            </Card>
          ) : (
            reservationsToShow.map((reservation: Reservation) => (
              <Card 
                key={reservation.id} 
                className={`border-l-4 ${
                  !reservation.notificationSent 
                    ? 'border-l-red-500 bg-red-50' 
                    : reservation.status === 'pending' 
                      ? 'border-l-yellow-500' 
                      : 'border-l-green-500'
                } hover:shadow-md transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-coffee-dark">
                      {reservation.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!reservation.notificationSent && (
                        <Badge className="bg-red-500 text-white">
                          <Bell className="h-3 w-3 mr-1" />
                          Nouveau
                        </Badge>
                      )}
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-coffee-accent" />
                        {formatDate(reservation.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-coffee-accent" />
                        {formatTime(reservation.time)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-coffee-accent" />
                        {reservation.guests} personne(s)
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-coffee-accent" />
                        {reservation.customerPhone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-coffee-accent" />
                        {reservation.customerEmail}
                      </div>
                    </div>
                  </div>

                  {/* Précommande */}
                  {parseFloat(reservation.preorderTotal) > 0 && (
                    <div className="bg-coffee-cream p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2 text-coffee-accent" />
                          Précommande
                        </span>
                        <span className="font-bold text-coffee-accent">
                          {reservation.preorderTotal}€
                        </span>
                      </div>
                      {reservation.reservationItems && reservation.reservationItems.length > 0 && (
                        <div className="space-y-1">
                          {reservation.reservationItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.menuItemName}</span>
                              <span>{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Demandes spéciales */}
                  {reservation.specialRequests && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Demandes spéciales:</strong> {reservation.specialRequests}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {!reservation.notificationSent && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleMarkNotificationSent(reservation.id)}
                        size="sm"
                        className="bg-coffee-accent hover:bg-coffee-primary text-white"
                        disabled={markNotificationSentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer comme vue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}