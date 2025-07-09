import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Employee, WorkShift } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkScheduleProps {
  userRole?: 'directeur' | 'employe';
}

export default function WorkSchedule({ userRole = 'directeur' }: WorkScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [newShift, setNewShift] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    position: 'Barista',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/admin/employees'],
    retry: 1,
  });

  const { data: workShifts = [], isLoading: shiftsLoading } = useQuery<WorkShift[]>({
    queryKey: ['/api/admin/work-shifts'],
    retry: 1,
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/work-shifts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/work-shifts'] });
      setIsDialogOpen(false);
      setNewShift({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '17:00',
        position: 'Barista',
        status: 'scheduled',
        notes: ''
      });
      toast({
        title: 'Succès',
        description: 'Horaire créé avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de l\'horaire',
        variant: 'destructive',
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/admin/work-shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/work-shifts'] });
      setIsDialogOpen(false);
      setEditingShift(null);
      toast({
        title: 'Succès',
        description: 'Horaire mis à jour avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour de l\'horaire',
        variant: 'destructive',
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/work-shifts/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/work-shifts'] });
      toast({
        title: 'Succès',
        description: 'Horaire supprimé avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de l\'horaire',
        variant: 'destructive',
      });
    },
  });

  const handleCreateShift = () => {
    const data = {
      ...newShift,
      employeeId: parseInt(newShift.employeeId),
    };
    createShiftMutation.mutate(data);
  };

  const handleUpdateShift = () => {
    if (editingShift) {
      const data = {
        ...newShift,
        employeeId: parseInt(newShift.employeeId),
      };
      updateShiftMutation.mutate({ id: editingShift.id, data });
    }
  };

  const handleEdit = (shift: WorkShift) => {
    setEditingShift(shift);
    setNewShift({
      employeeId: shift.employeeId.toString(),
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      status: shift.status,
      notes: shift.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet horaire ?')) {
      deleteShiftMutation.mutate(id);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Barista': return 'bg-yellow-100 text-yellow-800';
      case 'Serveur': return 'bg-blue-100 text-blue-800';
      case 'Cuisinier': return 'bg-purple-100 text-purple-800';
      case 'Manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu';
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const currentWeekShifts = workShifts.filter(shift => {
    const shiftDate = parseISO(shift.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  const isReadOnly = userRole === 'employe';

  if (employeesLoading || shiftsLoading) {
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
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Planning des Employés</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {userRole === 'directeur' ? 'Directeur' : 'Employé'}
            {isReadOnly && ' (lecture seule)'}
          </Badge>
          {!isReadOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un horaire
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingShift ? 'Modifier l\'horaire' : 'Ajouter un horaire'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingShift ? 'Modifiez les détails de l\'horaire' : 'Créez un nouvel horaire pour un employé'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employé</label>
                    <Select value={newShift.employeeId} onValueChange={(value) => setNewShift(prev => ({ ...prev, employeeId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un employé" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input
                        type="date"
                        value={newShift.date}
                        onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Poste</label>
                      <Select value={newShift.position} onValueChange={(value) => setNewShift(prev => ({ ...prev, position: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Barista">Barista</SelectItem>
                          <SelectItem value="Serveur">Serveur</SelectItem>
                          <SelectItem value="Cuisinier">Cuisinier</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Heure de début</label>
                      <Input
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Heure de fin</label>
                      <Input
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut</label>
                    <Select value={newShift.status} onValueChange={(value) => setNewShift(prev => ({ ...prev, status: value as 'scheduled' | 'completed' | 'cancelled' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Planifié</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={newShift.notes}
                      onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes optionnelles..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={editingShift ? handleUpdateShift : handleCreateShift}
                      disabled={!newShift.employeeId || !newShift.date}
                    >
                      {editingShift ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Sélection de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Semaine du {format(weekStart, 'dd MMM', { locale: fr })} au {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              ← Semaine précédente
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Semaine suivante →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des horaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires de la semaine ({currentWeekShifts.length} services)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Horaires</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Notes</TableHead>
                  {!isReadOnly && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentWeekShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 6 : 7} className="text-center py-8 text-gray-500">
                      Aucun horaire planifié pour cette semaine
                    </TableCell>
                  </TableRow>
                ) : (
                  currentWeekShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(shift.employeeId)}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(shift.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {shift.startTime} - {shift.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPositionColor(shift.position)}>
                          {shift.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(shift.status)}>
                          {getStatusLabel(shift.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {shift.notes || '-'}
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(shift)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(shift.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Services cette semaine</p>
                <p className="text-2xl font-bold">{currentWeekShifts.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Employés actifs</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heures planifiées</p>
                <p className="text-2xl font-bold">
                  {currentWeekShifts.reduce((total, shift) => {
                    const start = new Date(`2000-01-01T${shift.startTime}`);
                    const end = new Date(`2000-01-01T${shift.endTime}`);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(0)}h
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}