import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock,
  Users,
  Filter,
  Plus,
  Edit,
  CheckCircle,
  Phone,
  XCircle,
  Eye,
  Search,
  User,
  MapPin,
  Mail,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface Reservation {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string;
  time: string;
  guests: number;
  tableId?: number;
  tableName?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  specialRequests?: string;
}

interface Table {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  isAvailable: boolean;
}

interface ReservationManagementProps {
  userRole: string;
}

export default function ReservationManagementComplete({ userRole }: ReservationManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ 
    status: "all", 
    date: "", 
    search: "",
    period: "today" 
  });
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showNewReservationDialog, setShowNewReservationDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/reservations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Statut de réservation mis à jour avec succès" });
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
    mutationFn: (id: number) => apiRequest('DELETE', `/api/reservations/${id}`, {}),
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

  const createReservationMutation = useMutation({
    mutationFn: (reservationData: any) => apiRequest('POST', '/api/reservations', reservationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setShowNewReservationDialog(false);
      toast({ title: "Nouvelle réservation créée avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer la réservation",
        variant: "destructive" 
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">En Attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmée</Badge>;
      case 'arrived':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Arrivée</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Terminée</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Annulée</Badge>;
      case 'no_show':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Absent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'arrived',
      'arrived': 'completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'pending': return 'Confirmer';
      case 'confirmed': return 'Marquer Arrivée';
      case 'arrived': return 'Marquer Terminée';
      default: return null;
    }
  };

  const filterReservationsByPeriod = (reservations: Reservation[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter.period) {
      case 'today':
        return reservations.filter(r => {
          const resDate = new Date(r.date);
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === today.getTime();
        });
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        return reservations.filter(r => {
          const resDate = new Date(r.date);
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === tomorrow.getTime();
        });
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return reservations.filter(r => {
          const resDate = new Date(r.date);
          return resDate >= weekStart && resDate <= weekEnd;
        });
      case 'all':
        return reservations;
      default:
        return reservations;
    }
  };

  const filteredReservations = filterReservationsByPeriod(reservations).filter((reservation: Reservation) => {
    const matchesStatus = filter.status === 'all' || reservation.status === filter.status;
    const matchesDate = !filter.date || reservation.date?.includes(filter.date);
    const matchesSearch = !filter.search || 
      reservation.customerName?.toLowerCase().includes(filter.search.toLowerCase()) ||
      reservation.customerEmail?.toLowerCase().includes(filter.search.toLowerCase()) ||
      reservation.customerPhone?.includes(filter.search) ||
      reservation.id.toString().includes(filter.search);
    return matchesStatus && matchesDate && matchesSearch;
  });

  const getReservationStats = () => {
    const todayReservations = filterReservationsByPeriod(reservations);
    return {
      pending: todayReservations.filter(r => r.status === 'pending').length,
      confirmed: todayReservations.filter(r => r.status === 'confirmed').length,
      arrived: todayReservations.filter(r => r.status === 'arrived').length,
      completed: todayReservations.filter(r => r.status === 'completed').length,
      cancelled: todayReservations.filter(r => r.status === 'cancelled').length,
      noShow: todayReservations.filter(r => r.status === 'no_show').length,
      totalGuests: todayReservations.reduce((sum, r) => sum + (r.guests || 0), 0),
      occupancyRate: Math.round((todayReservations.filter(r => ['confirmed', 'arrived', 'completed'].includes(r.status)).length / Math.max(tables.length * 3, 1)) * 100) // Approximation
    };
  };

  const stats = getReservationStats();

  const getTimeSlotAvailability = (date: string) => {
    const timeSlots = [
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
    ];
    
    return timeSlots.map(time => {
      const reservedTables = reservations.filter(r => 
        r.date === date && 
        r.time === time && 
        ['confirmed', 'arrived'].includes(r.status)
      ).length;
      
      return {
        time,
        available: tables.length - reservedTables,
        total: tables.length,
        isAvailable: (tables.length - reservedTables) > 0
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Réservations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivi et gestion de toutes les réservations
          </p>
        </div>
        <Dialog open={showNewReservationDialog} onOpenChange={setShowNewReservationDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Réservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Réservation</DialogTitle>
            </DialogHeader>
            <NewReservationForm 
              tables={tables}
              onSubmit={(data) => createReservationMutation.mutate(data)}
              isLoading={createReservationMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: "En Attente", value: stats.pending, color: "bg-yellow-500", icon: Clock },
          { label: "Confirmées", value: stats.confirmed, color: "bg-green-500", icon: CheckCircle },
          { label: "Arrivées", value: stats.arrived, color: "bg-blue-500", icon: Users },
          { label: "Terminées", value: stats.completed, color: "bg-purple-500", icon: CheckCircle },
          { label: "Annulées", value: stats.cancelled, color: "bg-red-500", icon: XCircle },
          { label: "Absents", value: stats.noShow, color: "bg-gray-500", icon: AlertCircle },
          { label: "Total Invités", value: stats.totalGuests, color: "bg-emerald-500", icon: Users },
          { label: "Taux Occupation", value: `${stats.occupancyRate}%`, color: "bg-indigo-500", icon: Calendar },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disponibilité des créneaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Disponibilité des Créneaux - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {getTimeSlotAvailability(selectedDate).map((slot) => (
              <div 
                key={slot.time}
                className={`p-3 rounded-lg text-center border ${
                  slot.isAvailable 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-medium">{slot.time}</div>
                <div className="text-sm">
                  {slot.available}/{slot.total}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filter.period} onValueChange={(value) => setFilter(prev => ({ ...prev, period: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="tomorrow">Demain</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="all">Toutes les dates</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En Attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="arrived">Arrivées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="no_show">Absents</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
              placeholder="Filtrer par date"
            />
            
            <Button 
              variant="outline" 
              onClick={() => setFilter({ status: "all", date: "", search: "", period: "today" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Réservations ({filteredReservations.length})</span>
            <Badge variant="secondary">{filteredReservations.length} résultat(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Invités</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune réservation trouvée</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation: Reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">#{reservation.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{reservation.customerName}</div>
                            {reservation.specialRequests && (
                              <div className="text-sm text-gray-500">
                                Demande spéciale
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {reservation.customerEmail && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {reservation.customerEmail}
                            </div>
                          )}
                          {reservation.customerPhone && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {reservation.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" />
                            {reservation.date ? format(new Date(reservation.date), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {reservation.time || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{reservation.guests}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reservation.tableName ? (
                          <Badge variant="outline">{reservation.tableName}</Badge>
                        ) : (
                          <span className="text-gray-500">Non assignée</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedReservation(reservation)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <ReservationDetailsModal reservation={reservation} tables={tables} />
                            </DialogContent>
                          </Dialog>
                          
                          {getNextStatus(reservation.status) && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateStatusMutation.mutate({
                                id: reservation.id,
                                status: getNextStatus(reservation.status)!
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              {getStatusAction(reservation.status)}
                            </Button>
                          )}
                          
                          {reservation.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({
                                id: reservation.id,
                                status: 'cancelled'
                              })}
                              className="text-red-600 hover:text-red-700"
                            >
                              Annuler
                            </Button>
                          )}
                          
                          {reservation.status === 'confirmed' && userRole === 'directeur' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({
                                id: reservation.id,
                                status: 'no_show'
                              })}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Absent
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour les détails de réservation
function ReservationDetailsModal({ reservation, tables }: { reservation: Reservation, tables: Table[] }) {
  const table = tables.find(t => t.id === reservation.tableId);
  
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Détails de la Réservation #{reservation.id}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{reservation.customerName}</span>
            </div>
            {reservation.customerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{reservation.customerEmail}</span>
              </div>
            )}
            {reservation.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{reservation.customerPhone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails Réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date:</span>
              <span className="font-medium">
                {reservation.date ? format(new Date(reservation.date), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Heure:</span>
              <span className="font-medium">{reservation.time || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Invités:</span>
              <span className="font-medium">{reservation.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Table:</span>
              <span className="font-medium">
                {table ? `${table.name} (${table.capacity} places)` : 'Non assignée'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Statut:</span>
              {getStatusBadge(reservation.status)}
            </div>
          </CardContent>
        </Card>
      </div>

      {reservation.specialRequests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demandes Spéciales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{reservation.specialRequests}</p>
          </CardContent>
        </Card>
      )}

      {reservation.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes Internes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{reservation.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Créée le:</span>
            <span className="ml-2">
              {reservation.createdAt ? format(new Date(reservation.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'N/A'}
            </span>
          </div>
          {reservation.updatedAt && (
            <div className="text-sm">
              <span className="text-gray-500">Modifiée le:</span>
              <span className="ml-2">
                {format(new Date(reservation.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour créer une nouvelle réservation
function NewReservationForm({ tables, onSubmit, isLoading }: { 
  tables: Table[], 
  onSubmit: (data: any) => void,
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    time: '',
    guests: 2,
    tableId: '',
    specialRequests: '',
    notes: ''
  });

  const timeSlots = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Nom du client"
          value={formData.customerName}
          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          required
        />
        <Input
          type="email"
          placeholder="Email du client"
          value={formData.customerEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
        />
        <Input
          type="tel"
          placeholder="Téléphone du client"
          value={formData.customerPhone}
          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Nombre d'invités"
          min="1"
          max="20"
          value={formData.guests}
          onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) || 2 }))}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          required
        />
        
        <Select value={formData.time} onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Heure" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map(time => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={formData.tableId} onValueChange={(value) => setFormData(prev => ({ ...prev, tableId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Table (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Assignation automatique</SelectItem>
            {tables.map(table => (
              <SelectItem key={table.id} value={table.id.toString()}>
                {table.name} ({table.capacity} places)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Demandes spéciales du client"
        value={formData.specialRequests}
        onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
      />

      <Textarea
        placeholder="Notes internes"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
      />

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Création...' : 'Créer Réservation'}
        </Button>
      </div>
    </form>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">En Attente</Badge>;
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmée</Badge>;
    case 'arrived':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Arrivée</Badge>;
    case 'completed':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Terminée</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Annulée</Badge>;
    case 'no_show':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Absent</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}