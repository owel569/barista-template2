import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, Users, Phone, Mail, Check, X, Edit, Plus } from 'lucide-react';
import ReservationDialog from './reservation-dialog';
import { useToast } from '@/hooks/use-toast';
// import { PhoneInput } from '@/components/ui/phone-input'; // Remplacé par Input standard
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reservation {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  notes?: string;
  tableNumber?: number;
  createdAt: string;
}

interface ReservationsProps {
  userRole: 'directeur' | 'employe';
}

export default function Reservations({ userRole }: ReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
    
    // Actualisation automatique toutes les 15 secondes
    const interval = setInterval(() => {
      fetchReservations();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, statusFilter, dateFilter, searchTerm]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }

    // Filter by date
    const today = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(res => {
        const resDate = new Date(res.date);
        return resDate.toDateString() === today.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      filtered = filtered.filter(res => {
        const resDate = new Date(res.date);
        return resDate >= today && resDate <= weekFromNow;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(res => 
        res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.phone.includes(searchTerm)
      );
    }

    setFilteredReservations(filtered);
  };

  const updateReservationStatus = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReservations(prev => prev.map(res => 
          res.id === id ? { ...res, status: newStatus } : res
        ));
        toast({
          title: "Succès",
          description: `Statut mis à jour vers ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleAddReservation = async (reservationData: any) => {
    try {
      const response = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        await fetchReservations();
        toast({
          title: "Succès",
          description: "Réservation créée avec succès",
        });
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation",
        variant: "destructive",
      });
    }
  };

  const handleEditReservation = async (reservationData: any) => {
    try {
      const response = await fetch(`/api/admin/reservations/${selectedReservation?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        await fetchReservations();
        toast({
          title: "Succès",
          description: "Réservation modifiée avec succès",
        });
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réservation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmée':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'annulée':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmée':
        return 'Confirmée';
      case 'en_attente':
        return 'En attente';
      case 'annulée':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Réservations
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredReservations.length} réservation(s) trouvée(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            {userRole === 'directeur' ? 'Directeur' : 'Employé'}
          </Badge>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réservation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="confirmée">Confirmée</SelectItem>
                  <SelectItem value="annulée">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => {
                setStatusFilter('all');
                setDateFilter('today');
                setSearchTerm('');
              }} variant="outline">
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune réservation trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucune réservation ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {reservation.customerName}
                      </h3>
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(reservation.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{reservation.guests} personne(s)</span>
                      </div>
                      {reservation.tableNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Table {reservation.tableNumber}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span>{reservation.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>{reservation.phone}</span>
                      </div>
                    </div>
                    
                    {reservation.notes && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <span className="font-medium">Note:</span> {reservation.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {reservation.status === 'en_attente' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateReservationStatus(reservation.id, 'confirmée')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateReservationStatus(reservation.id, 'annulée')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </>
                    )}
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReservation(reservation)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Détails de la réservation</DialogTitle>
                          <DialogDescription>
                            Consultez et gérez les détails de cette réservation
                          </DialogDescription>
                        </DialogHeader>
                        {selectedReservation && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Client</Label>
                                <p className="text-sm font-medium">{selectedReservation.customerName}</p>
                              </div>
                              <div>
                                <Label>Statut</Label>
                                <Badge className={getStatusColor(selectedReservation.status)}>
                                  {getStatusText(selectedReservation.status)}
                                </Badge>
                              </div>
                              <div>
                                <Label>Date</Label>
                                <p className="text-sm">{format(new Date(selectedReservation.date), 'dd/MM/yyyy', { locale: fr })}</p>
                              </div>
                              <div>
                                <Label>Heure</Label>
                                <p className="text-sm">{selectedReservation.time}</p>
                              </div>
                              <div>
                                <Label>Nombre de personnes</Label>
                                <p className="text-sm">{selectedReservation.guests}</p>
                              </div>
                              {selectedReservation.tableNumber && (
                                <div>
                                  <Label>Table</Label>
                                  <p className="text-sm">Table {selectedReservation.tableNumber}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm">{selectedReservation.email}</p>
                            </div>
                            <div>
                              <Label>Téléphone</Label>
                              <p className="text-sm">{selectedReservation.phone}</p>
                            </div>
                            {selectedReservation.notes && (
                              <div>
                                <Label>Notes</Label>
                                <p className="text-sm">{selectedReservation.notes}</p>
                              </div>
                            )}
                            <div>
                              <Label>Créée le</Label>
                              <p className="text-sm">{format(new Date(selectedReservation.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogue d'ajout de réservation */}
      <ReservationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddReservation}
        isEdit={false}
      />

      {/* Dialogue de modification de réservation */}
      <ReservationDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedReservation(null);
        }}
        onSave={handleEditReservation}
        reservation={selectedReservation}
        isEdit={true}
      />
    </div>
  );
}