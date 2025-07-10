import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, X, Home, Calendar, ShoppingCart, Users, Coffee, MessageSquare,
  Settings, BarChart3, FileText, Shield, Package, Gift, DollarSign,
  Database, Calendar as CalendarIcon, Truck, Wrench, Bell, LogOut,
  Sun, Moon, ChevronDown, Wifi, WifiOff
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';

// Import admin modules
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

export default function AdminComplete() {
  const [, navigate] = useLocation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { permissions, isLoading, hasPermission, isDirecteur } = usePermissions();
  const { isConnected, notifications, refreshNotifications } = useWebSocket();

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Décoder le token pour obtenir les infos utilisateur
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error('Token invalide:', error);
      navigate('/login');
    }

    // Rafraîchir les notifications
    refreshNotifications();
  }, [navigate, refreshNotifications]);

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
      component: Dashboard,
      always: true
    },
    {
      id: 'reservations',
      name: 'Réservations',
      icon: Calendar,
      component: Reservations,
      notification: notifications.pendingReservations
    },
    {
      id: 'orders',
      name: 'Commandes',
      icon: ShoppingCart,
      component: Orders,
      notification: notifications.pendingOrders
    },
    {
      id: 'customers',
      name: 'Clients',
      icon: Users,
      component: Customers
    },
    {
      id: 'menu',
      name: 'Menu',
      icon: Coffee,
      component: MenuManagement
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: MessageSquare,
      component: Messages,
      notification: notifications.newMessages
    },
    {
      id: 'employees',
      name: 'Employés',
      icon: Shield,
      component: Employees,
      adminOnly: true
    },
    {
      id: 'inventory',
      name: 'Inventaire',
      icon: Package,
      component: InventoryManagement,
      notification: notifications.lowStockItems
    },
    {
      id: 'loyalty',
      name: 'Fidélité',
      icon: Gift,
      component: LoyaltySystem
    },
    {
      id: 'accounting',
      name: 'Comptabilité',
      icon: DollarSign,
      component: AccountingSystem,
      adminOnly: true
    },
    {
      id: 'statistics',
      name: 'Statistiques',
      icon: BarChart3,
      component: Statistics
    },
    {
      id: 'reports',
      name: 'Rapports',
      icon: FileText,
      component: ReportsSystem,
      adminOnly: true
    },
    {
      id: 'calendar',
      name: 'Planning',
      icon: CalendarIcon,
      component: CalendarManagement
    },
    {
      id: 'suppliers',
      name: 'Fournisseurs',
      icon: Truck,
      component: SuppliersManagement,
      adminOnly: true
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: Wrench,
      component: MaintenanceSystem,
      adminOnly: true
    },
    {
      id: 'backups',
      name: 'Sauvegardes',
      icon: Database,
      component: BackupSystem,
      adminOnly: true
    },
    {
      id: 'permissions',
      name: 'Permissions',
      icon: Shield,
      component: PermissionsManagement,
      adminOnly: true
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: FileText,
      component: ActivityLogs,
      adminOnly: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      component: NotificationsSystem
    },
    {
      id: 'settings',
      name: 'Paramètres',
      icon: Settings,
      component: AdminSettings,
      adminOnly: true
    }
  ];

  // Filtrer les modules selon les permissions
  const availableModules = adminModules.filter(module => {
    if (module.always) return true;
    if (module.adminOnly && !isDirecteur) return false;
    return hasPermission(module.id, 'view');
  });

  const currentModule = availableModules.find(m => m.id === activeModule);
  const CurrentComponent = currentModule?.component || Dashboard;

  if (isLoading) {
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
            {/* Statut connexion WebSocket */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>

            {/* Notifications */}
            <div className="flex items-center space-x-2">
              {notifications.pendingReservations > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {notifications.pendingReservations} réservations
                </Badge>
              )}
              {notifications.newMessages > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {notifications.newMessages} messages
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
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentModule?.name || 'Tableau de bord'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isDirecteur ? 'Interface Directeur' : 'Interface Employé'} - 
                Gestion complète du café
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <CurrentComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}