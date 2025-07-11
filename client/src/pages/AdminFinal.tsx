import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, X, Home, Calendar, ShoppingCart, Users, Coffee, MessageSquare,
  Settings, BarChart3, FileText, Shield, Package, Gift, DollarSign,
  Database, Calendar as CalendarIcon, Truck, Wrench, Bell, LogOut,
  Sun, Moon, Wifi, WifiOff
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
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
import MaintenanceManagement from '@/components/admin/maintenance-management';

export default function AdminFinal() {
  const [, navigate] = useLocation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    pendingReservations: 0,
    newMessages: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });

  const { permissions, isLoading, hasPermission, isDirecteur } = usePermissions();

  useEffect(() => {
    // Vérifier l'authentification une seule fois
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Décoder le token pour obtenir les infos utilisateur
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      // Synchroniser les tokens
      localStorage.setItem('token', token);
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Token invalide:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Fetch notifications périodiquement
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('/api/admin/notifications/count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.log('Erreur notifications:', error);
      }
    };

    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
      id: 'settings',
      name: 'Paramètres',
      icon: Settings,
      component: AdminSettings,
      adminOnly: true
    },
    {
      id: 'statistics',
      name: 'Statistiques',
      icon: BarChart3,
      component: Statistics
    },
    {
      id: 'logs',
      name: 'Journaux',
      icon: FileText,
      component: ActivityLogs
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
      id: 'permissions',
      name: 'Permissions',
      icon: Shield,
      component: PermissionsManagement,
      adminOnly: true
    },
    {
      id: 'schedule',
      name: 'Planning',
      icon: CalendarIcon,
      component: WorkSchedule
    },
    {
      id: 'accounting',
      name: 'Comptabilité',
      icon: DollarSign,
      component: AccountingSystem,
      adminOnly: true
    },
    {
      id: 'backup',
      name: 'Sauvegardes',
      icon: Database,
      component: BackupSystem,
      adminOnly: true
    },
    {
      id: 'reports',
      name: 'Rapports',
      icon: BarChart3,
      component: ReportsSystem
    },
    {
      id: 'calendar',
      name: 'Calendrier',
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
      component: MaintenanceManagement,
      adminOnly: true
    }
  ];

  // Filtrer les modules selon les permissions
  const availableModules = adminModules.filter(module => {
    if (module.always) return true;
    if (module.adminOnly && !isDirecteur) return false;
    return true;
  });

  const currentModule = availableModules.find(m => m.id === activeModule);
  const CurrentComponent = currentModule?.component || Dashboard;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", isDarkMode && "dark")}>
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
        "bg-white dark:bg-gray-800 shadow-lg",
        sidebarCollapsed ? "w-16" : "w-72",
        "border-r border-gray-200 dark:border-gray-700"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Coffee className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Barista Café</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Administration</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {availableModules.map((module) => (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveModule(module.id)}
              className={cn(
                "w-full justify-start relative",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <module.icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-2 flex-1 text-left">{module.name}</span>
                  {module.notification && module.notification > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 px-2 py-1 text-xs min-w-[20px] h-5"
                    >
                      {module.notification}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.role === 'directeur' ? 'Directeur' : 'Employé'}
                </p>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="flex-1"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "ml-16" : "ml-72"
      )}>
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentModule?.name || 'Tableau de bord'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDirecteur ? 'Accès directeur' : 'Accès employé'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Connecté</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <CurrentComponent />
        </div>
      </div>
    </div>
  );
}