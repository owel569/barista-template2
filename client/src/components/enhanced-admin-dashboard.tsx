import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  LogOut,
  Package,
  UserCheck,
  Clock,
  XCircle,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardCharts from "./dashboard-charts";
import SimpleOrderManagement from "./simple-order-management";
import CustomerManagement from "./customer-management";
import EmployeeManagement from "./employee-management";
import ReservationNotifications from "./reservation-notifications";
import MenuManagement from "./menu-management";
import ContactManagement from "./contact-management";

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

export default function EnhancedAdminDashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch reservations
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // Update reservation status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/reservations/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Succès",
        description: "Statut de réservation mis à jour",
      });
    },
  });

  // Delete reservation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/reservations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Succès",
        description: "Réservation supprimée",
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmé", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Annulé", className: "bg-red-100 text-red-800" },
      completed: { label: "Terminé", className: "bg-gray-100 text-gray-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-cream to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-coffee-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Coffee className="h-8 w-8 text-coffee-accent" />
              <div>
                <h1 className="text-2xl font-bold text-coffee-dark">
                  Tableau de Bord Admin
                </h1>
                <p className="text-coffee-medium text-sm">
                  Gestion du restaurant Barista Café
                </p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-coffee-accent text-coffee-accent hover:bg-coffee-accent hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de Bord</span>
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Réservations</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Employés</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2 data-[state=active]:bg-coffee-accent data-[state=active]:text-white">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardCharts />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <SimpleOrderManagement />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <ReservationNotifications />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-coffee-dark">
                    Total Réservations
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-coffee-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-coffee-dark">{reservations.length}</div>
                  <p className="text-xs text-coffee-medium">
                    Toutes les réservations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-coffee-dark">
                    Confirmées
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reservations.filter(r => r.status === 'confirmed').length}
                  </div>
                  <p className="text-xs text-coffee-medium">
                    Réservations confirmées
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-coffee-dark">
                    En Attente
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {reservations.filter(r => r.status === 'pending').length}
                  </div>
                  <p className="text-xs text-coffee-medium">
                    À confirmer
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-coffee-dark">
                    Annulées
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {reservations.filter(r => r.status === 'cancelled').length}
                  </div>
                  <p className="text-xs text-coffee-medium">
                    Réservations annulées
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Reservations Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="text-coffee-dark">Liste des Réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Invités</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-mono text-sm">
                          #{reservation.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{reservation.customerName}</div>
                            <div className="text-sm text-muted-foreground">{reservation.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{formatDateShort(reservation.date)}</div>
                            <div className="text-sm text-muted-foreground">{reservation.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.guests}</TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <ContactManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}