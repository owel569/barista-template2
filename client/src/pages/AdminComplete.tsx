import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Home, Calendar, ShoppingCart, Users, Coffee, MessageSquare, Shield, 
  Settings, BarChart3, FileText, Package, Gift, DollarSign, Database, 
  Truck, Wrench, Bell, ChevronLeft, ChevronRight, Menu, Sun, Moon,
  Calendar as CalendarIcon, TrendingUp, AlertTriangle, LogOut, User,
  Activity, Layers, PieChart, Target, Zap, Clock, MapPin, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';
import { useWebSocket } from '@/hooks/useWebSocket';

// Import all admin modules
import Dashboard from '@/components/admin/dashboard';
import Reservations from '@/components/admin/reservations';
import Orders from '@/components/admin/orders';
import Customers from '@/components/admin/customers';
import Employees from '@/components/admin/employees';
import MenuManagement from '@/components/admin/menu-management';
import Messages from '@/components/admin/messages';
import AdminSettings from '@/components/admin/settings';
import Statistics from '@/components/admin/statistics';
import ActivityLogs from '@/components/admin/activity-logs';
import PermissionsManagement from '@/components/admin/permissions-management';
import InventoryManagement from '@/components/admin/inventory-management';
import LoyaltySystem from '@/components/admin/loyalty-system';
import WorkSchedule from '@/components/admin/work-schedule';
import AccountingSystem from '@/components/admin/accounting-system';
import BackupSystem from '@/components/admin/backup-system';
import ReportsSystem from '@/components/admin/reports-system';
import CalendarManagement from '@/components/admin/calendar-management';
import SuppliersManagement from '@/components/admin/suppliers-management';
import MaintenanceSystem from '@/components/admin/maintenance-system';
import NotificationsSystem from '@/components/admin/notifications-system';

// Interface pour les notifications
interface NotificationData {
  pendingReservations: number;
  pendingOrders: number;
  newMessages: number;
  lowStockItems: number;
  maintenanceAlerts: number;
  systemAlerts: number;
}

// Interface pour les informations utilisateur
interface UserData {
  id: number;
  username: string;
  role: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: string;
}

// Hook pour les permissions utilisateur
const usePermissions = (user: UserData | null) => {
  const isAdmin = user?.role === 'directeur' || user?.role === 'admin';
  const isEmployee = user?.role === 'employe' || user?.role === 'employee';
  
  return {
    isAdmin,
    isEmployee,
    canAccess: (module: string) => {
      if (isAdmin) return true;
      if (isEmployee) {
        // Modules accessibles aux employés
        const employeeModules = [
          'dashboard', 'reservations', 'orders', 'customers', 'menu', 
          'messages', 'statistics', 'logs', 'inventory', 'loyalty', 
          'calendar', 'notifications'
        ];
        return employeeModules.includes(module);
      }
      return false;
    },
    canEdit: (module: string) => {
      if (isAdmin) return true;
      if (isEmployee) {
        // Modules modifiables par les employés
        const editableModules = [
          'reservations', 'orders', 'menu', 'messages', 'inventory', 'loyalty'
        ];
        return editableModules.includes(module);
      }
      return false;
    },
    canDelete: (module: string) => {
      if (isAdmin) return true;
      // Employés ne peuvent pas supprimer dans la plupart des modules
      return false;
    }
  };
};

// Configuration des modules d'administration
const getAdminModules = (permissions: any, notifications: NotificationData) => [
  {
    id: 'dashboard',
    name: 'Tableau de bord',
    icon: Home,
    component: Dashboard,
    always: true,
    description: 'Vue d\'ensemble des activités'
  },
  {
    id: 'reservations',
    name: 'Réservations',
    icon: Calendar,
    component: Reservations,
    notification: notifications.pendingReservations,
    description: 'Gestion des réservations clients'
  },
  {
    id: 'orders',
    name: 'Commandes',
    icon: ShoppingCart,
    component: Orders,
    notification: notifications.pendingOrders,
    description: 'Suivi des commandes'
  },
  {
    id: 'customers',
    name: 'Clients',
    icon: Users,
    component: Customers,
    description: 'Gestion de la clientèle'
  },
  {
    id: 'menu',
    name: 'Menu',
    icon: Coffee,
    component: MenuManagement,
    description: 'Gestion du menu et des produits'
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: MessageSquare,
    component: Messages,
    notification: notifications.newMessages,
    description: 'Messages de contact'
  },
  {
    id: 'inventory',
    name: 'Inventaire',
    icon: Package,
    component: InventoryManagement,
    notification: notifications.lowStockItems,
    description: 'Gestion des stocks'
  },
  {
    id: 'loyalty',
    name: 'Fidélité',
    icon: Gift,
    component: LoyaltySystem,
    description: 'Programme de fidélité'
  },
  {
    id: 'calendar',
    name: 'Calendrier',
    icon: CalendarIcon,
    component: CalendarManagement,
    description: 'Planning et événements'
  },
  {
    id: 'statistics',
    name: 'Statistiques',
    icon: BarChart3,
    component: Statistics,
    description: 'Analyses et métriques'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    component: NotificationsSystem,
    description: 'Centre de notifications'
  },
  {
    id: 'logs',
    name: 'Journaux',
    icon: FileText,
    component: ActivityLogs,
    description: 'Historique des activités'
  },
  // Modules réservés aux administrateurs
  {
    id: 'employees',
    name: 'Employés',
    icon: Shield,
    component: Employees,
    adminOnly: true,
    description: 'Gestion des employés'
  },
  {
    id: 'permissions',
    name: 'Permissions',
    icon: Shield,
    component: PermissionsManagement,
    adminOnly: true,
    description: 'Gestion des permissions'
  },
  {
    id: 'accounting',
    name: 'Comptabilité',
    icon: DollarSign,
    component: AccountingSystem,
    adminOnly: true,
    description: 'Gestion financière'
  },
  {
    id: 'reports',
    name: 'Rapports',
    icon: TrendingUp,
    component: ReportsSystem,
    adminOnly: true,
    description: 'Rapports détaillés'
  },
  {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: Truck,
    component: SuppliersManagement,
    adminOnly: true,
    description: 'Gestion des fournisseurs'
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    icon: Wrench,
    component: MaintenanceSystem,
    adminOnly: true,
    notification: notifications.maintenanceAlerts,
    description: 'Maintenance des équipements'
  },
  {
    id: 'backups',
    name: 'Sauvegardes',
    icon: Database,
    component: BackupSystem,
    adminOnly: true,
    description: 'Sauvegarde des données'
  },
  {
    id: 'settings',
    name: 'Paramètres',
    icon: Settings,
    component: AdminSettings,
    adminOnly: true,
    description: 'Configuration générale'
  }
];

// Composant principal de l'administration
const AdminComplete: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Notifications WebSocket
  const { notifications: wsNotifications, isConnected } = useWebSocket();
  
  // Conversion des notifications WebSocket au format attendu
  const notifications = {
    pendingReservations: wsNotifications.filter(n => n.type === 'reservation').length,
    pendingOrders: wsNotifications.filter(n => n.type === 'order').length,
    newMessages: wsNotifications.filter(n => n.type === 'message').length,
    lowStockItems: wsNotifications.filter(n => n.type === 'stock').length,
    maintenanceAlerts: wsNotifications.filter(n => n.type === 'maintenance').length,
    systemAlerts: wsNotifications.filter(n => n.type === 'system').length,
  };

  // Permissions utilisateur
  const permissions = usePermissions(user);

  // Récupération des données utilisateur
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/verify'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Effet pour définir l'utilisateur
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
    setIsLoading(userLoading);
  }, [userData, userLoading]);

  // Vérification de l'authentification
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      setLocation('/login');
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté avec succès.'
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la déconnexion.',
        variant: 'destructive'
      });
    }
  };

  // Filtrage des modules selon les permissions
  const availableModules = getAdminModules(permissions, notifications).filter(
    module => module.always || permissions.canAccess(module.id)
  );

  // Composant du module actuel
  const ActiveModuleComponent = availableModules.find(m => m.id === activeModule)?.component || Dashboard;

  // Calcul du total des notifications
  const totalNotifications = notifications.pendingReservations + 
    notifications.pendingOrders + 
    notifications.newMessages + 
    notifications.lowStockItems + 
    notifications.maintenanceAlerts + 
    notifications.systemAlerts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={cn(
          "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          {/* Header du sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={cn("flex items-center space-x-3", sidebarCollapsed && "justify-center")}>
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Coffee className="h-4 w-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-gray-900 dark:text-white">Barista Admin</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1">
            {availableModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeModule === module.id 
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <module.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{module.name}</span>
                    {module.notification && module.notification > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {module.notification}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {availableModules.find(m => m.id === activeModule)?.name || 'Tableau de bord'}
                </h1>
                {!isConnected && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Connexion WebSocket perdue
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                {totalNotifications > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveModule('notifications')}
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {totalNotifications}
                    </Badge>
                  </Button>
                )}

                {/* Toggle theme */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>

                {/* Menu utilisateur */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.firstName || user?.username}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <Badge variant="secondary" className="w-fit">
                          {user?.role === 'directeur' ? 'Directeur' : 'Employé'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveModule('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Contenu du module */}
          <main className="flex-1 overflow-auto p-6">
            <ActiveModuleComponent />
          </main>
        </div>
      </div>
  );
};

export default AdminComplete;