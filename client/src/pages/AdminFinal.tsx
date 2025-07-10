import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, X, Home, Calendar, ShoppingCart, Users, Coffee, MessageSquare,
  Settings, BarChart3, FileText, Shield, Package, Gift, DollarSign,
  Database, Calendar as CalendarIcon, Truck, Wrench, Bell, LogOut,
  Sun, Moon, Wifi, WifiOff, RefreshCw, Euro, TrendingUp, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function AdminFinal() {
  const [, navigate] = useLocation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDirecteur, setIsDirecteur] = useState(false);
  const [stats, setStats] = useState({
    todayReservations: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    occupancyRate: 75,
    pendingReservations: 0,
    newMessages: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    // Vérifier l'authentification une seule fois
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      setIsDirecteur(payload.role === 'directeur');
    } catch (error) {
      console.error('Token invalide:', error);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Charger les statistiques une seule fois au début
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          pendingReservations: data.pendingReservations || 0,
          newMessages: data.newMessages || 0,
          pendingOrders: data.pendingOrders || 0,
          todayReservations: 8,
          monthlyRevenue: 12450,
          activeOrders: 5
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Configuration des modules selon les permissions
  const adminModules = [
    {
      id: 'dashboard',
      name: 'Tableau de bord',
      icon: Home,
      always: true
    },
    {
      id: 'reservations',
      name: 'Réservations',
      icon: Calendar,
      notification: stats.pendingReservations
    },
    {
      id: 'orders',
      name: 'Commandes',
      icon: ShoppingCart,
      notification: stats.pendingOrders
    },
    {
      id: 'customers',
      name: 'Clients',
      icon: Users
    },
    {
      id: 'menu',
      name: 'Menu',
      icon: Coffee
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: MessageSquare,
      notification: stats.newMessages
    },
    {
      id: 'employees',
      name: 'Employés',
      icon: Shield,
      adminOnly: true
    },
    {
      id: 'inventory',
      name: 'Inventaire',
      icon: Package
    },
    {
      id: 'loyalty',
      name: 'Fidélité',
      icon: Gift
    },
    {
      id: 'accounting',
      name: 'Comptabilité',
      icon: DollarSign,
      adminOnly: true
    },
    {
      id: 'statistics',
      name: 'Statistiques',
      icon: BarChart3
    },
    {
      id: 'reports',
      name: 'Rapports',
      icon: FileText,
      adminOnly: true
    },
    {
      id: 'calendar',
      name: 'Planning',
      icon: CalendarIcon
    },
    {
      id: 'suppliers',
      name: 'Fournisseurs',
      icon: Truck,
      adminOnly: true
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: Wrench,
      adminOnly: true
    },
    {
      id: 'backups',
      name: 'Sauvegardes',
      icon: Database,
      adminOnly: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell
    },
    {
      id: 'settings',
      name: 'Paramètres',
      icon: Settings,
      adminOnly: true
    }
  ];

  // Filtrer les modules selon les permissions
  const availableModules = adminModules.filter(module => {
    if (module.always) return true;
    if (module.adminOnly && !isDirecteur) return false;
    return true;
  });

  const renderMainContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tableau de bord
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Vue d'ensemble de l'activité du café
                </p>
              </div>
              <Button onClick={fetchStats} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Réservations aujourd'hui
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.todayReservations}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Chiffre d'affaires mensuel
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.monthlyRevenue}€
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Commandes actives
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.activeOrders}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                      <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Taux d'occupation
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.occupancyRate}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={stats.occupancyRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertes et notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Alertes importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.pendingReservations > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Réservations en attente
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {stats.pendingReservations} réservations nécessitent une confirmation
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {stats.newMessages > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Nouveaux messages
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {stats.newMessages} messages non lus
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Coffee className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Module {availableModules.find(m => m.id === activeModule)?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ce module sera disponible prochainement.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", isDarkMode && "dark")}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-600 dark:text-gray-400"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Barista Café
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administration
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Statut connexion */}
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">En ligne</span>
            </div>

            {/* Notifications */}
            <div className="flex items-center space-x-2">
              {stats.pendingReservations > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.pendingReservations} réservations
                </Badge>
              )}
              {stats.newMessages > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.newMessages} messages
                </Badge>
              )}
            </div>

            {/* Thème */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-400"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDirecteur ? 'Directeur' : 'Employé'}
                </p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-amber-600 text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {availableModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeModule === module.id;
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive 
                          ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-r-2 border-amber-600" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{module.name}</span>
                          {module.notification && module.notification > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {module.notification}
                            </Badge>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 m-6">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}