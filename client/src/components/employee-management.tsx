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
import { Users, Plus, Mail, Phone, Briefcase, DollarSign } from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary?: string;
  hireDate: string;
  status: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800"
};

const statusLabels = {
  active: "Actif",
  inactive: "Inactif",
  terminated: "Licencié"
};

export default function EmployeeManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    salary: "",
    hireDate: "",
    status: "active",
    emergencyContact: "",
    emergencyPhone: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: typeof newEmployee) => 
      apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Employé créé avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur création employé:", error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la création de l'employé",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      apiRequest("PATCH", `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditingEmployee(null);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Employé mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'employé",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      salary: "",
      hireDate: "",
      status: "active",
      emergencyContact: "",
      emergencyPhone: "",
      notes: ""
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!newEmployee.firstName.trim()) {
      toast({
        title: "Erreur",
        description: "Le prénom est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.lastName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.email.trim()) {
      toast({
        title: "Erreur",
        description: "L'email est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.phone.trim()) {
      toast({
        title: "Erreur",
        description: "Le téléphone est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.position.trim()) {
      toast({
        title: "Erreur",
        description: "Le poste est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.department.trim()) {
      toast({
        title: "Erreur",
        description: "Le département est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.hireDate.trim()) {
      toast({
        title: "Erreur",
        description: "La date d'embauche est requise",
        variant: "destructive",
      });
      return;
    }
    
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: newEmployee });
    } else {
      createEmployeeMutation.mutate(newEmployee);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary || "",
      hireDate: employee.hireDate,
      status: employee.status,
      emergencyContact: employee.emergencyContact || "",
      emergencyPhone: employee.emergencyPhone || "",
      notes: employee.notes || ""
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Employés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeEmployees = (employees as Employee[]).filter(emp => emp.status === 'active').length;
  const totalSalaries = (employees as Employee[])
    .filter(emp => emp.salary && emp.status === 'active')
    .reduce((sum, emp) => sum + parseFloat(emp.salary || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Employés</h2>
          <p className="text-muted-foreground">Gérez votre équipe et leurs informations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Modifier l'Employé" : "Nouvel Employé"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee 
                  ? "Modifiez les informations de l'employé." 
                  : "Ajoutez un nouvel employé à votre équipe."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Poste</Label>
                  <Select value={newEmployee.position} onValueChange={(value) => setNewEmployee({ ...newEmployee, position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un poste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="server">Serveur</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="barista">Barista</SelectItem>
                      <SelectItem value="cashier">Caissier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Département</Label>
                  <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Cuisine</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="management">Direction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salary">Salaire (€)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hireDate">Date d'embauche</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={newEmployee.status} onValueChange={(value) => setNewEmployee({ ...newEmployee, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="terminated">Licencié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Contact d'urgence</Label>
                  <Input
                    id="emergencyContact"
                    value={newEmployee.emergencyContact}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContact: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Téléphone d'urgence</Label>
                  <Input
                    id="emergencyPhone"
                    value={newEmployee.emergencyPhone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newEmployee.notes}
                  onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })}
                  placeholder="Notes sur l'employé..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}>
                  {(createEmployeeMutation.isPending || updateEmployeeMutation.isPending) 
                    ? (editingEmployee ? "Modification..." : "Création...") 
                    : (editingEmployee ? "Modifier" : "Créer")
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(employees as Employee[]).length}</div>
            <p className="text-xs text-muted-foreground">
              {activeEmployees} actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masse Salariale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalaries.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground">
              Par mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuisine</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(employees as Employee[]).filter(emp => emp.department === 'kitchen' && emp.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(employees as Employee[]).filter(emp => emp.department === 'service' && emp.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Employés</CardTitle>
          <CardDescription>
            Gérez votre équipe et consultez leurs informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Salaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Embauché le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employees as Employee[]).map((employee: Employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                      {employee.emergencyContact && (
                        <div className="text-sm text-muted-foreground">
                          Urgence: {employee.emergencyContact}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {employee.email}
                      </div>
                      <div className="text-sm flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{employee.position}</TableCell>
                  <TableCell className="capitalize">{employee.department}</TableCell>
                  <TableCell>
                    {employee.salary ? `${parseFloat(employee.salary).toFixed(0)}€` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[employee.status as keyof typeof statusColors]}>
                      {statusLabels[employee.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}