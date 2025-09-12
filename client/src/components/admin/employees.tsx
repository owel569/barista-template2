import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Employee, WorkShift } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Users, 
  UserCheck, 
  Clock, 
  Mail,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const employeeSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  position: z.string().min(2, 'Le poste doit contenir au moins 2 caractères'),
  department: z.string().min(2, 'Le département doit contenir au moins 2 caractères'),
  phone: z.string().min(8, 'Le téléphone doit contenir au moins 8 chiffres')
    .regex(/^(\+212|0)[0-9]{8,9}$|^(\+33|0)[0-9]{9}$|^(\+|00)[1-9][0-9]{1,14}$/, 
      'Format invalide. Utilisez +212XXXXXXXXX (Maroc), +33XXXXXXXXX (France) ou format international'),
  hireDate: z.string(),
  salary: z.coerce.number()
    .positive('Le salaire doit être supérieur à 0')
    .min(1000, 'Salaire minimum : 1000 DH')
    .max(50000, 'Salaire maximum : 50000 DH'),
  status: z.enum(['active', 'inactive']).default('active'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeesProps {
  userRole?: 'directeur' | 'employe' | 'gerant';
}

export default function Employees({ userRole = 'directeur' }: EmployeesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      department: '',
      phone: '',
      hireDate: format(new Date(), 'yyyy-MM-dd'),
      salary: 3000,
      status: 'active',
    },
  });

  const { data: employees = [], isLoading, refetch } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiRequest('/api/admin/employees'),
  });

  const { data: workShifts = [] } = useQuery<WorkShift[]>({
    queryKey: ['work-shifts'],
    queryFn: () => apiRequest('/api/admin/work-shifts'),
  });

  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => 
      apiRequest('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
      toast.toast({
        title: 'Succès',
        description: 'Employé créé avec succès',
      });
    },
    onError: (error: Error) => {
      toast.toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de l\'employé',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeFormData }) =>
      apiRequest(`/api/admin/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
      toast.toast({
        title: 'Succès',
        description: 'Employé mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      toast.toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour de l\'employé',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/employees/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.toast({
        title: "Succès",
        description: "Employé supprimé avec succès",
      });
    },
    onError: (error: Error) => {
      toast.toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression de l\'employé',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      hireDate: employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : '',
      status: employee.status === 'on_leave' || employee.status === 'terminated' ? 'inactive' : employee.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.toast({
      title: "Actualisation",
      description: "Liste des employés actualisée",
    });
  };

  // Calculer les statistiques
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const todayShifts = workShifts.filter(shift => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return shift.date === today;
  }).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Employés</h1>
          <p className="text-muted-foreground">
            {totalEmployees} employé(s) - {activeEmployees} actif(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingEmployee(null);
                  form.reset();
                }}
                disabled={userRole === 'employe' || createMutation.isPending}
                title={userRole === 'employe' ? 'Accès non autorisé' : 'Ajouter un nouvel employé'}
              >
                {createMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Nouvel Employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
                </DialogTitle>
                <DialogDescription>
                  {editingEmployee 
                    ? 'Modifiez les informations de cet employé' 
                    : 'Ajoutez un nouvel employé à votre équipe'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poste</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Département</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <InternationalPhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Numéro de téléphone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'embauche</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salaire (DH)</FormLabel>
                          <FormControl>
                            <div>
                              <Input
                                type="number"
                                step="0.01"
                                min="1000"
                                max="50000"
                                {...field}
                                placeholder="2500.50"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                💰 Salaire en dirhams marocains (DH). Min: 1000 DH, Max: 50000 DH
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : editingEmployee ? (
                        <Pencil className="h-4 w-4 mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {editingEmployee ? 'Modifier' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +5% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeEmployees / totalEmployees) * 100)}% de l'effectif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipes Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayShifts}</div>
            <p className="text-xs text-muted-foreground">
              {todayShifts > 0 ? 'En service' : 'Aucun service aujourd\'hui'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table des employés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Employés</CardTitle>
          <CardDescription>
            Gestion complète de votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Date d'embauche</TableHead>
                <TableHead>Salaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {employee.email}
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      {employee.hireDate 
                        ? format(new Date(employee.hireDate), 'dd/MM/yyyy', { locale: fr })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        {employee.salary?.toLocaleString('fr-FR')} DH
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                        className={employee.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {employee.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(employee)}
                          disabled={userRole === 'employe'}
                          title={userRole === 'employe' ? 'Accès non autorisé' : 'Modifier l\'employé'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {(userRole === 'directeur' || userRole === 'gerant') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            disabled={deleteMutation.isPending}
                            title="Supprimer cet employé"
                          >
                            {deleteMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Aucun employé trouvé
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}