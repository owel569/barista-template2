import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  ShoppingCart, 
  MessageSquare, 
  Clock,
  Star,
  Package,
  Gift,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface TestAllFeaturesProps {
  userRole?: 'directeur' | 'employe';
}

export default function TestAllFeatures({ userRole = 'directeur' }: TestAllFeaturesProps) {
  const [selectedTest, setSelectedTest] = useState('');
  const [testData, setTestData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des données pour tous les modules
  const { data: employees = [], refetch: refetchEmployees } = useQuery({
    queryKey: ['/api/employees'],
    refetchInterval: 5000,
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['/api/admin/customers'],
    refetchInterval: 5000,
  });

  const { data: reservations = [], refetch: refetchReservations } = useQuery({
    queryKey: ['/api/reservations'],
    refetchInterval: 5000,
  });

  const { data: menuItems = [], refetch: refetchMenu } = useQuery({
    queryKey: ['/api/menu/items'],
    refetchInterval: 5000,
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders'],
    refetchInterval: 5000,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['/api/contact/messages'],
    refetchInterval: 5000,
  });

  // Mutations pour créer des données de test
  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({ title: 'Employé créé avec succès' });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({ title: 'Client créé avec succès' });
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      toast({ title: 'Réservation créée avec succès' });
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      toast({ title: 'Article de menu créé avec succès' });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Commande créée avec succès' });
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/contact/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/messages'] });
      toast({ title: 'Message créé avec succès' });
    },
  });

  // Fonction pour actualiser toutes les données
  const refreshAllData = () => {
    refetchEmployees();
    refetchCustomers();
    refetchReservations();
    refetchMenu();
    refetchOrders();
    refetchMessages();
    queryClient.invalidateQueries();
    toast({ title: 'Toutes les données actualisées' });
  };

  // Formulaires de test pour chaque module
  const renderTestForm = () => {
    switch (selectedTest) {
      case 'employee':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={testData.firstName || ''}
                  onChange={(e) => setTestData({...testData, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={testData.lastName || ''}
                  onChange={(e) => setTestData({...testData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testData.email || ''}
                onChange={(e) => setTestData({...testData, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={testData.position || ''}
                  onChange={(e) => setTestData({...testData, position: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={testData.department || ''}
                  onChange={(e) => setTestData({...testData, department: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={testData.phone || ''}
                  onChange={(e) => setTestData({...testData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="salary">Salaire</Label>
                <Input
                  id="salary"
                  value={testData.salary || ''}
                  onChange={(e) => setTestData({...testData, salary: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hireDate">Date d'embauche</Label>
              <Input
                id="hireDate"
                type="date"
                value={testData.hireDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setTestData({...testData, hireDate: e.target.value})}
              />
            </div>
            <Button 
              onClick={() => createEmployeeMutation.mutate({
                ...testData,
                status: 'active',
                hireDate: testData.hireDate || new Date().toISOString().split('T')[0]
              })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer Employé
            </Button>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={testData.firstName || ''}
                  onChange={(e) => setTestData({...testData, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={testData.lastName || ''}
                  onChange={(e) => setTestData({...testData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testData.email || ''}
                onChange={(e) => setTestData({...testData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={testData.phone || ''}
                onChange={(e) => setTestData({...testData, phone: e.target.value})}
              />
            </div>
            <Button 
              onClick={() => createCustomerMutation.mutate({
                ...testData,
                totalSpent: '0',
                loyaltyPoints: 0
              })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer Client
            </Button>
          </div>
        );

      case 'reservation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Nom du client</Label>
              <Input
                id="customerName"
                value={testData.customerName || ''}
                onChange={(e) => setTestData({...testData, customerName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email du client</Label>
              <Input
                id="customerEmail"
                type="email"
                value={testData.customerEmail || ''}
                onChange={(e) => setTestData({...testData, customerEmail: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Téléphone du client</Label>
              <Input
                id="customerPhone"
                value={testData.customerPhone || ''}
                onChange={(e) => setTestData({...testData, customerPhone: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={testData.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTestData({...testData, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={testData.time || '12:00'}
                  onChange={(e) => setTestData({...testData, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="partySize">Nombre de personnes</Label>
              <Input
                id="partySize"
                type="number"
                value={testData.partySize || '2'}
                onChange={(e) => setTestData({...testData, partySize: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="specialRequests">Demandes spéciales</Label>
              <Textarea
                id="specialRequests"
                value={testData.specialRequests || ''}
                onChange={(e) => setTestData({...testData, specialRequests: e.target.value})}
              />
            </div>
            <Button 
              onClick={() => createReservationMutation.mutate({
                ...testData,
                status: 'en_attente',
                tableId: 1
              })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer Réservation
            </Button>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du produit</Label>
              <Input
                id="name"
                value={testData.name || ''}
                onChange={(e) => setTestData({...testData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={testData.description || ''}
                onChange={(e) => setTestData({...testData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={testData.price || ''}
                  onChange={(e) => setTestData({...testData, price: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={testData.category || ''} onValueChange={(value) => setTestData({...testData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cafes">Cafés</SelectItem>
                    <SelectItem value="boissons">Boissons</SelectItem>
                    <SelectItem value="patisseries">Pâtisseries</SelectItem>
                    <SelectItem value="plats">Plats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => createMenuItemMutation.mutate({
                ...testData,
                available: true,
                categoryId: 1
              })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer Article Menu
            </Button>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={testData.firstName || ''}
                onChange={(e) => setTestData({...testData, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={testData.lastName || ''}
                onChange={(e) => setTestData({...testData, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testData.email || ''}
                onChange={(e) => setTestData({...testData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={testData.subject || ''}
                onChange={(e) => setTestData({...testData, subject: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={testData.message || ''}
                onChange={(e) => setTestData({...testData, message: e.target.value})}
              />
            </div>
            <Button 
              onClick={() => createMessageMutation.mutate({
                ...testData,
                status: 'nouveau'
              })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer Message
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Sélectionnez un module à tester
            </p>
          </div>
        );
    }
  };

  const testButtons = [
    { id: 'employee', label: 'Employés', icon: Users, count: employees.length },
    { id: 'customer', label: 'Clients', icon: Users, count: customers.length },
    { id: 'reservation', label: 'Réservations', icon: Calendar, count: reservations.length },
    { id: 'menu', label: 'Menu', icon: Package, count: menuItems.length },
    { id: 'message', label: 'Messages', icon: MessageSquare, count: messages.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Complet des Fonctionnalités</h2>
        <Button onClick={refreshAllData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser tout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de sélection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Modules disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testButtons.map((button) => (
                <Button
                  key={button.id}
                  variant={selectedTest === button.id ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => {
                    setSelectedTest(button.id);
                    setTestData({});
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button.icon className="h-4 w-4" />
                    {button.label}
                  </div>
                  <Badge variant="secondary">{button.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer un nouvel élément
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderTestForm()}
          </CardContent>
        </Card>
      </div>

      {/* Résumé des données */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des données actuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {testButtons.map((button) => (
              <div key={button.id} className="text-center">
                <div className="bg-primary/10 rounded-lg p-4 mb-2">
                  <button.icon className="h-6 w-6 mx-auto text-primary" />
                </div>
                <div className="font-semibold">{button.count}</div>
                <div className="text-sm text-muted-foreground">{button.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}