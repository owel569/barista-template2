import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building,
  Shield,
  Award,
  TrendingUp,
  AlertCircle,
  Eye,
  UserCheck,
  UserX,
  Briefcase
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  position: string;
  department: string;
  salary: number;
  hourlyRate?: number;
  hireDate: string;
  isActive: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  contractType: string;
  weeklyHours: number;
  permissions: string[];
  notes?: string;
  lastLogin?: string;
  performance?: number;
  vacationDays?: number;
  sickDays?: number;
}

interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  break: number;
  status: string;
  notes?: string;
}

interface EmployeeManagementProps {
  userRole: string;
}

export default function EmployeeManagementComplete({ userRole }: EmployeeManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filter, setFilter] = useState({ 
    search: "", 
    department: "all", 
    status: "all",
    position: "all",
    sortBy: "name" 
  });
  
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    department: "",
    salary: 0,
    hourlyRate: 0,
    hireDate: "",
    contractType: "CDI",
    weeklyHours: 35,
    emergencyContact: "",
    emergencyPhone: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: shifts = [] } = useQuery<WorkShift[]>({
    queryKey: ['/api/work-shifts'],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (employeeData: any) => apiRequest('POST', '/api/employees', employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Employé créé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer l'employé",
        variant: "destructive" 
      });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditingEmployee(null);
      setIsDialogOpen(false);
      toast({ title: "Employé mis à jour avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour l'employé",
        variant: "destructive" 
      });
    }
  });

  const toggleEmployeeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest('PATCH', `/api/employees/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Statut de l'employé mis à jour" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le statut",
        variant: "destructive" 
      });
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/employees/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employé supprimé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer l'employé",
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      position: "",
      department: "",
      salary: 0,
      hourlyRate: 0,
      hireDate: "",
      contractType: "CDI",
      weeklyHours: 35,
      emergencyContact: "",
      emergencyPhone: "",
      notes: ""
    });
  };

  const getPositionBadge = (position: string) => {
    const positions = {
      'directeur': { label: 'Directeur', color: 'bg-purple-100 text-purple-800' },
      'manager': { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
      'barista': { label: 'Barista', color: 'bg-amber-100 text-amber-800' },
      'serveur': { label: 'Serveur', color: 'bg-green-100 text-green-800' },
      'cuisinier': { label: 'Cuisinier', color: 'bg-orange-100 text-orange-800' },
      'caissier': { label: 'Caissier', color: 'bg-cyan-100 text-cyan-800' },
    };
    const pos = positions[position as keyof typeof positions] || 
                { label: position, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={pos.color}>{pos.label}</Badge>;
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'service': 'bg-blue-500',
      'cuisine': 'bg-orange-500',
      'administration': 'bg-purple-500',
      'nettoyage': 'bg-green-500',
    };
    return colors[department as keyof typeof colors] || 'bg-gray-500';
  };

  const calculateWorkDays = (hireDate: string) => {
    return differenceInDays(new Date(), new Date(hireDate));
  };

  const getPerformanceColor = (performance?: number) => {
    if (!performance) return 'text-gray-500';
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-blue-600';
    if (performance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredEmployees = employees
    .filter(employee => {
      const matchesSearch = !filter.search || 
        employee.firstName.toLowerCase().includes(filter.search.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(filter.search.toLowerCase()) ||
        employee.email.toLowerCase().includes(filter.search.toLowerCase()) ||
        employee.phone?.includes(filter.search) ||
        employee.position.toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesDepartment = filter.department === 'all' || employee.department === filter.department;
      const matchesStatus = filter.status === 'all' || 
        (filter.status === 'active' && employee.isActive) ||
        (filter.status === 'inactive' && !employee.isActive);
      const matchesPosition = filter.position === 'all' || employee.position === filter.position;
      
      return matchesSearch && matchesDepartment && matchesStatus && matchesPosition;
    })
    .sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'hireDate':
          return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
        case 'salary':
          return b.salary - a.salary;
        case 'performance':
          return (b.performance || 0) - (a.performance || 0);
        default:
          return 0;
      }
    });

  const getEmployeeStats = () => {
    const activeEmployees = employees.filter(e => e.isActive);
    const totalSalary = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
    
    return {
      total: employees.length,
      active: activeEmployees.length,
      newThisMonth: employees.filter(e => {
        const hired = new Date(e.hireDate);
        const now = new Date();
        return hired.getMonth() === now.getMonth() && hired.getFullYear() === now.getFullYear();
      }).length,
      averageSalary: activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0,
      departments: [...new Set(employees.map(e => e.department))].length,
      totalPayroll: totalSalary
    };
  };

  const stats = getEmployeeStats();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: newEmployee });
    } else {
      createEmployeeMutation.mutate(newEmployee);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Employés</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ressources humaines et planification
          </p>
        </div>
        {userRole === 'directeur' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Modifier l\'Employé' : 'Créer un Nouvel Employé'}
                </DialogTitle>
              </DialogHeader>
              <EmployeeForm
                employee={newEmployee}
                onChange={setNewEmployee}
                onSubmit={handleSubmit}
                isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Employés", value: stats.total, color: "bg-blue-500", icon: Users },
          { label: "Employés Actifs", value: stats.active, color: "bg-green-500", icon: UserCheck },
          { label: "Nouvelles Embauches", value: stats.newThisMonth, color: "bg-indigo-500", icon: Calendar },
          { label: "Salaire Moyen", value: `${stats.averageSalary.toFixed(0)}€`, color: "bg-emerald-500", icon: DollarSign },
          { label: "Départements", value: stats.departments, color: "bg-orange-500", icon: Building },
          { label: "Masse Salariale", value: `${(stats.totalPayroll / 1000).toFixed(1)}k€`, color: "bg-purple-500", icon: TrendingUp },
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

      {/* Répartition par département */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Département</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...new Set(employees.map(e => e.department))].map(dept => {
              const count = employees.filter(e => e.department === dept && e.isActive).length;
              const total = employees.filter(e => e.department === dept).length;
              const percentage = employees.length > 0 ? (count / employees.length) * 100 : 0;
              
              return (
                <div key={dept} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-12 h-12 ${getDepartmentColor(dept)} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-medium capitalize">{dept}</div>
                  <div className="text-sm text-gray-600">{count}/{total} actifs</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filter.department} onValueChange={(value) => setFilter(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="cuisine">Cuisine</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="nettoyage">Nettoyage</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.position} onValueChange={(value) => setFilter(prev => ({ ...prev, position: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Poste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les postes</SelectItem>
                <SelectItem value="directeur">Directeur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="barista">Barista</SelectItem>
                <SelectItem value="serveur">Serveur</SelectItem>
                <SelectItem value="cuisinier">Cuisinier</SelectItem>
                <SelectItem value="caissier">Caissier</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.sortBy} onValueChange={(value) => setFilter(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="hireDate">Date d'embauche</SelectItem>
                <SelectItem value="salary">Salaire</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setFilter({ search: "", department: "all", status: "all", position: "all", sortBy: "name" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employés ({filteredEmployees.length})</span>
            <Badge variant="secondary">{filteredEmployees.length} résultat(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Salaire</TableHead>
                  <TableHead>Ancienneté</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun employé trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee: Employee) => {
                    const workDays = calculateWorkDays(employee.hireDate);
                    const years = Math.floor(workDays / 365);
                    const months = Math.floor((workDays % 365) / 30);
                    
                    return (
                      <TableRow key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.contractType} - {employee.weeklyHours}h/sem
                            </div>
                            {employee.emergencyContact && (
                              <div className="text-xs text-gray-500">
                                Urgence: {employee.emergencyContact}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {employee.email}
                            </div>
                            {employee.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {employee.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getPositionBadge(employee.position)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDepartmentColor(employee.department)}`} />
                            <span className="capitalize">{employee.department}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">{employee.salary.toLocaleString()}€</div>
                            {employee.hourlyRate && (
                              <div className="text-sm text-gray-500">
                                {employee.hourlyRate}€/h
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div>{years > 0 ? `${years} an${years > 1 ? 's' : ''}` : ''}</div>
                            <div className="text-gray-500">
                              {months > 0 ? `${months} mois` : workDays < 30 ? `${workDays} jours` : ''}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {employee.performance ? (
                            <div className="text-center">
                              <div className={`font-medium ${getPerformanceColor(employee.performance)}`}>
                                {employee.performance}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {employee.performance >= 90 ? 'Excellent' :
                                 employee.performance >= 75 ? 'Bon' :
                                 employee.performance >= 60 ? 'Moyen' : 'Faible'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {employee.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedEmployee(employee)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <EmployeeDetailsModal employee={employee} shifts={shifts.filter(s => s.employeeId === employee.id)} />
                              </DialogContent>
                            </Dialog>
                            
                            {userRole === 'directeur' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEmployee(employee);
                                    setNewEmployee({
                                      firstName: employee.firstName,
                                      lastName: employee.lastName,
                                      email: employee.email,
                                      phone: employee.phone || "",
                                      address: employee.address || "",
                                      position: employee.position,
                                      department: employee.department,
                                      salary: employee.salary,
                                      hourlyRate: employee.hourlyRate || 0,
                                      hireDate: employee.hireDate,
                                      contractType: employee.contractType,
                                      weeklyHours: employee.weeklyHours,
                                      emergencyContact: employee.emergencyContact || "",
                                      emergencyPhone: employee.emergencyPhone || "",
                                      notes: employee.notes || ""
                                    });
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleEmployeeStatusMutation.mutate({
                                    id: employee.id,
                                    isActive: !employee.isActive
                                  })}
                                  className={employee.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                >
                                  {employee.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour le formulaire employé
function EmployeeForm({ employee, onChange, onSubmit, isLoading }: {
  employee: any;
  onChange: (employee: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={employee.firstName}
            onChange={(e) => onChange({ ...employee, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={employee.lastName}
            onChange={(e) => onChange({ ...employee, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={employee.email}
            onChange={(e) => onChange({ ...employee, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={employee.phone}
            onChange={(e) => onChange({ ...employee, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={employee.address}
          onChange={(e) => onChange({ ...employee, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Poste</Label>
          <Select
            value={employee.position}
            onValueChange={(value) => onChange({ ...employee, position: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un poste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="directeur">Directeur</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="barista">Barista</SelectItem>
              <SelectItem value="serveur">Serveur</SelectItem>
              <SelectItem value="cuisinier">Cuisinier</SelectItem>
              <SelectItem value="caissier">Caissier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Département</Label>
          <Select
            value={employee.department}
            onValueChange={(value) => onChange({ ...employee, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="cuisine">Cuisine</SelectItem>
              <SelectItem value="administration">Administration</SelectItem>
              <SelectItem value="nettoyage">Nettoyage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="salary">Salaire mensuel (€)</Label>
          <Input
            id="salary"
            type="number"
            value={employee.salary}
            onChange={(e) => onChange({ ...employee, salary: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            value={employee.hourlyRate}
            onChange={(e) => onChange({ ...employee, hourlyRate: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="weeklyHours">Heures par semaine</Label>
          <Input
            id="weeklyHours"
            type="number"
            value={employee.weeklyHours}
            onChange={(e) => onChange({ ...employee, weeklyHours: parseInt(e.target.value) || 35 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hireDate">Date d'embauche</Label>
          <Input
            id="hireDate"
            type="date"
            value={employee.hireDate}
            onChange={(e) => onChange({ ...employee, hireDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contractType">Type de contrat</Label>
          <Select
            value={employee.contractType}
            onValueChange={(value) => onChange({ ...employee, contractType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="Stage">Stage</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyContact">Contact d'urgence</Label>
          <Input
            id="emergencyContact"
            value={employee.emergencyContact}
            onChange={(e) => onChange({ ...employee, emergencyContact: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="emergencyPhone">Téléphone d'urgence</Label>
          <Input
            id="emergencyPhone"
            type="tel"
            value={employee.emergencyPhone}
            onChange={(e) => onChange({ ...employee, emergencyPhone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={employee.notes}
          onChange={(e) => onChange({ ...employee, notes: e.target.value })}
          placeholder="Notes RH, évaluations, commentaires..."
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant pour les détails de l'employé
function EmployeeDetailsModal({ employee, shifts }: { employee: Employee, shifts: WorkShift[] }) {
  const workDays = differenceInDays(new Date(), new Date(employee.hireDate));
  const years = Math.floor(workDays / 365);
  const months = Math.floor((workDays % 365) / 30);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Profil Employé - {employee.firstName} {employee.lastName}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{employee.phone}</span>
              </div>
            )}
            {employee.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <span className="text-sm">{employee.address}</span>
              </div>
            )}
            {employee.emergencyContact && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium text-gray-700">Contact d'urgence</div>
                <div className="text-sm">{employee.emergencyContact}</div>
                {employee.emergencyPhone && (
                  <div className="text-sm text-gray-600">{employee.emergencyPhone}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Poste:</span>
              <span className="font-medium capitalize">{employee.position}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Département:</span>
              <span className="font-medium capitalize">{employee.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Contrat:</span>
              <span className="font-medium">{employee.contractType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Heures/semaine:</span>
              <span className="font-medium">{employee.weeklyHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Embauché le:</span>
              <span className="font-medium">
                {format(new Date(employee.hireDate), 'dd/MM/yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Ancienneté:</span>
              <span className="font-medium">
                {years > 0 && `${years} an${years > 1 ? 's' : ''} `}
                {months > 0 && `${months} mois`}
                {workDays < 30 && `${workDays} jours`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rémunération et performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rémunération & Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Salaire mensuel:</span>
              <span className="font-medium">{employee.salary.toLocaleString()}€</span>
            </div>
            {employee.hourlyRate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Taux horaire:</span>
                <span className="font-medium">{employee.hourlyRate}€</span>
              </div>
            )}
            {employee.performance && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Performance:</span>
                <span className={`font-medium ${
                  employee.performance >= 90 ? 'text-green-600' :
                  employee.performance >= 75 ? 'text-blue-600' :
                  employee.performance >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {employee.performance}%
                </span>
              </div>
            )}
            {employee.vacationDays !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Jours de congé:</span>
                <span className="font-medium">{employee.vacationDays}</span>
              </div>
            )}
            {employee.sickDays !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Jours maladie:</span>
                <span className="font-medium">{employee.sickDays}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Horaires récents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horaires Récents</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucun horaire enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Horaires</TableHead>
                    <TableHead>Pause</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.slice(0, 5).map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>
                        {format(new Date(shift.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {shift.startTime} - {shift.endTime}
                      </TableCell>
                      <TableCell>{shift.break}min</TableCell>
                      <TableCell>
                        <Badge variant={shift.status === 'completed' ? 'default' : 'secondary'}>
                          {shift.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {employee.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes RH</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}