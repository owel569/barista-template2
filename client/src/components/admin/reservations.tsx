import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ReservationsFixed() : JSX.Element {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
        toast({
          title: 'Réservations actualisées',
          description: `${data.length} réservations chargées`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les réservations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
                            body: JSON.stringify({ status })
        });

        if (response.ok) {
        await fetchReservations();
        toast({
          title: 'Statut mis à jour',
          description: `Réservation ${status}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditForm(reservation);
    setIsEditModalOpen(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDeleteModalOpen(true);
  };

  const saveReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm});
      
      if (response.ok) {
        await fetchReservations();
        setIsEditModalOpen(false);
        toast({
          title: 'Réservation mise à jour',
          description: 'Les modifications ont été sauvegardées',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la réservation',
        variant: 'destructive',
      });
    }
  };

  const deleteReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        await fetchReservations();
        setIsDeleteModalOpen(false);
        toast({
          title: 'Réservation supprimée',
          description: 'La réservation a été supprimée avec succès',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la réservation',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmé':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
      case 'annulé':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmé':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'en_attente':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'annulé':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            );}
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
            Réservations
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des réservations du restaurant
          </p>
        </div>
        <Button onClick={fetchReservations} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all'}
        >
          Toutes ({reservations.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending'}
        >
          En attente ({reservations.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed'}
        >
          Confirmées ({reservations.filter(r => r.status === 'confirmed').length})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('cancelled'}
        >
          Annulées ({reservations.filter(r => r.status === 'cancelled').length})
        </Button>
      </div>

      {/* Liste des réservations */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune réservation trouvée
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(reservation.status} flex items-center gap-1`}>
                          {getStatusIcon(reservation.status}
                          {reservation.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          #{reservation.id}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{reservation.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(reservation.date).toLocaleDateString(}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{reservation.guests} personnes</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{reservation.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{reservation.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReservation(reservation}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReservation(reservation}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReservation(reservation}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    {reservation.status === 'pending' && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateReservationStatus(reservation.id, 'confirmed'}
                          className="bg-green-50 hover:bg-green-100 text-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateReservationStatus(reservation.id, 'cancelled'}
                          className="bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );}
      </div>

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              Réservation #{selectedReservation?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <p className="text-sm">{selectedReservation.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedReservation.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <p className="text-sm">{selectedReservation.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge className={getStatusColor(selectedReservation.status}>
                    {selectedReservation.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{new Date(selectedReservation.date).toLocaleDateString(}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Heure</Label>
                  <p className="text-sm">{selectedReservation.time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nombre de personnes</Label>
                  <p className="text-sm">{selectedReservation.guests}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Créé le</Label>
                  <p className="text-sm">{new Date(selectedReservation.createdAt).toLocaleDateString(}</p>
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Réservation #{selectedReservation?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du client</Label>
                  <Input
                    value={editForm.customerName || ''}
                    onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editForm.customerEmail || ''}
                    onChange={(e) => setEditForm({...editForm, customerEmail: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={editForm.customerPhone || ''}
                    onChange={(e) => setEditForm({...editForm, customerPhone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={editForm.status || ''}
                    onValueChange={(value) => setEditForm({...editForm, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Heure</Label>
                  <Input
                    type="time"
                    value={editForm.time || ''}
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Nombre de personnes</Label>
                  <Input
                    type="number"
                    value={editForm.guests || ''}
                    onChange={(e) => setEditForm({...editForm, guests: parseInt(e.target.value});}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false}>
              Annuler
            </Button>
            <Button onClick={saveReservation}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la réservation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteReservation}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}