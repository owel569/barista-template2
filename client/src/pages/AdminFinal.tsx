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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    pendingReservations: 0,
    newMessages: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });

  const { hasPermission } = usePermissions(user?.role || 'employe');

  useEffect(() => {
    // Vérifier l'authentification une seule fois
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
  }, [navigate]);

  // Gestionnaire d'erreurs global pour éviter les unhandledrejection
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Promesse rejetée gérée:', event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.warn('Erreur globale:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Fetch notifications périodiquement (avec gestion d'erreurs)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
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
    localStorage.removeItem('auth_token'); // Nettoyer l'ancien token aussi
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
    if (module.adminOnly && user?.role !== 'directeur') return false;
    return true;
  });

  const currentModule = availableModules.find(m => m.id === activeModule);
  const CurrentComponent = currentModule?.component || Dashboard;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe avec menu déroulant */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo et nom */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-orange-600">Barista Café - Admin</h1>
          </div>

          {/* Menu déroulant central */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2 text-sm font-medium"
            >
              <Menu className="h-4 w-4 mr-2" />
              {currentModule?.name || 'Dashboard'}
              <span className="ml-2">▼</span>
            </Button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {availableModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors text-left w-full",
                        activeModule === module.id
                          ? "bg-orange-100 text-orange-700"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <module.icon className="h-4 w-4" />
                      <span className="truncate">{module.name}</span>
                      {module.notification && module.notification > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs">
                          {module.notification}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Infos utilisateur et déconnexion */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-orange-500 text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('auth_token');
                navigate('/login');
              }}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="pt-20 px-6 pb-6">
        {/* Affichage du composant actuel */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <CurrentComponent />
        </div>
      </main>
    </div>
  );
}