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
import { Users, Plus, Mail, Phone, MapPin } from "lucide-react";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  totalOrders: number;
  totalSpent: string;
  preferredContactMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    preferredContactMethod: "email",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: typeof newCustomer) => {
      console.log("Données client envoyées:", data);
      return apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur création client:", error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la création du client",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      apiRequest("PATCH", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Client mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewCustomer({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      preferredContactMethod: "email",
      notes: ""
    });
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!newCustomer.firstName.trim()) {
      toast({
        title: "Erreur",
        description: "Le prénom est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCustomer.lastName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCustomer.email.trim()) {
      toast({
        title: "Erreur",
        description: "L'email est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCustomer.phone.trim()) {
      toast({
        title: "Erreur",
        description: "Le téléphone est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: newCustomer });
    } else {
      createCustomerMutation.mutate(newCustomer);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || "",
      dateOfBirth: customer.dateOfBirth || "",
      preferredContactMethod: customer.preferredContactMethod,
      notes: customer.notes || ""
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c: Customer) => c.totalOrders > 0).length;
  const averageSpent = totalCustomers > 0 
    ? customers.reduce((sum: number, c: Customer) => sum + parseFloat(c.totalSpent), 0) / totalCustomers 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Clients</h2>
          <p className="text-muted-foreground">Gérez vos clients et leurs informations</p>
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
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Modifier le Client" : "Nouveau Client"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer 
                  ? "Modifiez les informations du client." 
                  : "Ajoutez un nouveau client à votre base de données."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
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
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newCustomer.dateOfBirth}
                    min="1900-01-01"
                    max="3000-12-31"
                    onChange={(e) => setNewCustomer({ ...newCustomer, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="preferredContactMethod">Contact préféré</Label>
                  <Select 
                    value={newCustomer.preferredContactMethod} 
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, preferredContactMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Téléphone</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Notes sur le client..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}>
                  {(createCustomerMutation.isPending || updateCustomerMutation.isPending) 
                    ? (editingCustomer ? "Modification..." : "Création...") 
                    : (editingCustomer ? "Modifier" : "Créer")
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} clients actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépense Moyenne</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSpent.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Par client
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: Customer) => {
                const customerDate = new Date(c.createdAt);
                const now = new Date();
                return customerDate.getMonth() === now.getMonth() && 
                       customerDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Gérez vos clients et consultez leurs informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Total Dépensé</TableHead>
                <TableHead>Contact Préféré</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer: Customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                      {customer.address && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {customer.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                      <div className="text-sm flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {customer.totalOrders} commandes
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {parseFloat(customer.totalSpent).toFixed(2)}€
                  </TableCell>
                  <TableCell className="capitalize">
                    {customer.preferredContactMethod}
                  </TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(customer)}
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