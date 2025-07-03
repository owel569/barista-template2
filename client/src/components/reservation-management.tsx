import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock,
  Users,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function ReservationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ date: "", status: "", client: "" });

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/reservations/${id}/status`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le statut",
        variant: "destructive" 
      });
    }
  });

  const deleteReservationMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/reservations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Réservation supprimée avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la réservation",
        variant: "destructive" 
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En Attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReservations = reservations.filter((reservation: Reservation) => {
    const matchesDate = !filter.date || reservation.date.includes(filter.date);
    const matchesStatus = !filter.status || filter.status === 'all' || reservation.status === filter.status;
    const matchesClient = !filter.client || 
      reservation.customerName.toLowerCase().includes(filter.client.toLowerCase()) ||
      reservation.customerEmail.toLowerCase().includes(filter.client.toLowerCase());
    
    return matchesDate && matchesStatus && matchesClient;
  });

  if (isLoading) {
    return <div className="p-6">Chargement des réservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h2>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Réservation
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client</label>
              <Input
                placeholder="Nom ou email du client"
                value={filter.client}
                onChange={(e) => setFilter({ ...filter, client: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations à Venir ({filteredReservations?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Invités</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations?.map((reservation: any) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reservation.customerName}</div>
                      {reservation.specialRequests && (
                        <div className="text-sm text-gray-500">
                          Note: {reservation.specialRequests}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{format(new Date(reservation.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      <Clock className="w-4 h-4 text-gray-500 ml-2" />
                      <span>{reservation.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      {reservation.guests}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{reservation.customerEmail}</div>
                      <div className="text-gray-500">{reservation.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {reservation.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'confirmed' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {reservation.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'cancelled' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReservationMutation.mutate(reservation.id)}
                        disabled={deleteReservationMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredReservations?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune réservation trouvée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}