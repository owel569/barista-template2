import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Plus, 
  Download, 
  Edit, 
  Trash2,
  Coffee,
  Utensils,
  BarChart3,
  LogOut
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
  createdAt: string;
}

interface Stats {
  today_reservations: number;
  occupancy_rate: number;
  available_tables: number;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reservations
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    enabled: false // Disable for demo, would work with real API
  });

  // Mock data for demonstration
  const mockReservations: Reservation[] = [
    {
      id: 1,
      customerName: "Marie Dubois",
      customerEmail: "marie.dubois@email.com",
      customerPhone: "06 12 34 56 78",
      date: "2024-11-15",
      time: "19:30",
      guests: 2,
      status: "confirmed",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      customerName: "Jean Martin",
      customerEmail: "jean.martin@email.com",
      customerPhone: "06 87 65 43 21",
      date: "2024-11-16",
      time: "12:30",
      guests: 4,
      status: "pending",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      customerName: "Sophie Laurent",
      customerEmail: "sophie.laurent@email.com",
      customerPhone: "06 55 44 33 22",
      date: "2024-11-15",
      time: "14:00",
      guests: 3,
      status: "confirmed",
      createdAt: new Date().toISOString()
    }
  ];

  const mockStats = {
    today_reservations: 12,
    occupancy_rate: 85,
    available_tables: 3
  };

  const displayReservations = reservations.length > 0 ? reservations : mockReservations;

  // Mutation for updating reservation status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/reservations/${id}/status`, { status }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la réservation a été modifié.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting reservation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reservations/${id}`),
    onSuccess: () => {
      toast({
        title: "Réservation supprimée",
        description: "La réservation a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-coffee-green text-white">Confirmée</Badge>;
      case "pending":
        return <Badge className="bg-coffee-secondary text-coffee-dark">En attente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      case "completed":
        return <Badge className="bg-coffee-accent text-white">Terminée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      deleteMutation.mutate(id);
    }
  };

  const mockTables = [
    { id: 1, status: "libre" },
    { id: 2, status: "occupee" },
    { id: 3, status: "libre" },
    { id: 4, status: "reservee" },
    { id: 5, status: "libre" },
    { id: 6, status: "occupee" }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-bold text-coffee-dark mb-4">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-lg text-gray-700">
              Gestion complète des réservations, menu et commandes
            </p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-coffee-dark text-coffee-dark hover:bg-coffee-dark hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reservations Management */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-coffee-dark">
                    <CheckCircle className="inline mr-2 text-coffee-accent" />
                    Gestion des Réservations
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button className="bg-coffee-green text-white hover:bg-opacity-90">
                      <Plus className="mr-1 h-4 w-4" />
                      Nouvelle
                    </Button>
                    <Button className="bg-coffee-accent text-white hover:bg-opacity-90">
                      <Download className="mr-1 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-coffee-cream">
                      <tr>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">ID</th>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">Client</th>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">Date/Heure</th>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">Personnes</th>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">Statut</th>
                        <th className="px-4 py-3 text-left text-coffee-dark font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayReservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-coffee-dark font-mono text-sm">
                            #{reservation.id.toString().padStart(3, '0')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-coffee-dark font-semibold">
                              {reservation.customerName}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {reservation.customerEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-coffee-dark font-semibold">
                              {new Date(reservation.date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {reservation.time}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-coffee-dark">
                            {reservation.guests}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(reservation.id, 
                                  reservation.status === "pending" ? "confirmed" : "pending"
                                )}
                                className="text-coffee-accent hover:text-coffee-dark"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(reservation.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics & Quick Actions */}
          <div className="space-y-6">
            {/* Statistics Cards */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-coffee-dark">
                  <TrendingUp className="inline mr-2 text-coffee-accent" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Réservations aujourd'hui</span>
                  <span className="text-2xl font-bold text-coffee-accent">
                    {mockStats.today_reservations}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux d'occupation</span>
                  <span className="text-2xl font-bold text-coffee-green">
                    {mockStats.occupancy_rate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tables disponibles</span>
                  <span className="text-2xl font-bold text-coffee-secondary">
                    {mockStats.available_tables}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-coffee-dark">
                  <Coffee className="inline mr-2 text-coffee-accent" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-coffee-accent hover:bg-coffee-primary text-white justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle réservation
                </Button>
                <Button className="w-full bg-coffee-dark hover:bg-coffee-accent text-white justify-start">
                  <Utensils className="mr-2 h-4 w-4" />
                  Gérer le menu
                </Button>
                <Button className="w-full bg-coffee-green hover:bg-coffee-accent text-white justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Voir les rapports
                </Button>
              </CardContent>
            </Card>

            {/* Table Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-coffee-dark">
                  <Users className="inline mr-2 text-coffee-accent" />
                  État des Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {mockTables.map((table) => (
                    <div
                      key={table.id}
                      className={`text-center py-2 rounded font-semibold text-sm ${
                        table.status === "libre"
                          ? "bg-coffee-green text-white"
                          : table.status === "occupee"
                          ? "bg-red-500 text-white"
                          : "bg-coffee-secondary text-coffee-dark"
                      }`}
                    >
                      T{table.id}
                    </div>
                  ))}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-coffee-green rounded mr-2"></div>
                    <span>Libre</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    <span>Occupée</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-coffee-secondary rounded mr-2"></div>
                    <span>Réservée</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
