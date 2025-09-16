import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Menu, X, Home, Calendar, ShoppingCart, Users, Coffee, MessageSquare,
  Settings, BarChart3, FileText, Shield, Package, Gift, DollarSign,
  Database, Calendar as CalendarIcon, Truck, Wrench, Bell, LogOut,
  Sun, Moon, Wifi, WifiOff, Brain
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { ErrorBoundary, LoadingFallback, NotFoundFallback } from '@/components/admin/error-boundary';
import { AdminComponentWrapper } from '@/components/admin/AdminComponentWrapper';

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
import AdvancedMaintenance from '@/components/admin/advanced-maintenance';
import DeliveryTracking from '@/components/admin/delivery-tracking';
import OnlineOrdering from '@/components/admin/online-ordering';
import TableManagement from '@/components/admin/table-management';
import EventsPromotions from '@/components/admin/events-promotions';
import UserProfileEnhanced from '@/components/admin/user-profile-enhanced-optimized';
import AnalyticsDashboard from '@/components/admin/analytics-dashboard';
import AdvancedPOS from '@/components/admin/advanced-pos';
import StaffScheduling from '@/components/admin/staff-scheduling';
import QualityControl from '@/components/admin/quality-control';
import CustomerFeedback from '@/components/admin/customer-feedback';

// Import nouveaux modules avancés
import AnalyticsDashboardModule from '@/components/admin/modules/AnalyticsDashboard';
import InventoryManagementModule from '@/components/admin/modules/InventoryManagement';
import LoyaltyProgramModule from '@/components/admin/modules/LoyaltyProgram';
import DashboardModule from '@/components/admin/modules/Dashboard';
import DashboardConsolidated from '@/components/admin/dashboard-consolidated';

// Mock logger for demonstration purposes if not globally available
const logger = {
  error: (message: string, context?: any) => console.error(message, context),
};


export default function AdminFinal() : JSX.Element {
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

  const { hasPermission } = usePermissions();

  useEffect(() => {
    // Vérifier l'authentification une seule fois
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Décoder le token pour obtenir les infos utilisateur
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length < 2 || !tokenParts[1]) {
        throw new Error('Token invalide');
      }
      const payload = JSON.parse(atob(tokenParts[1]));
      setUser(payload);
    } catch (error) {
      logger.error('Token invalide:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
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
      component: Dashboard, // This will now point to the consolidated dashboard
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
      id: 'inventory-smart',
      name: 'Gestion Stock IA',
      icon: Package,
      component: InventoryManagementModule,
      adminOnly: true,
      notification: notifications.lowStockItems
    },
    {
      id: 'loyalty',
      name: 'Fidélité',
      icon: Gift,
      component: LoyaltySystem
    },
    {
      id: 'loyalty-advanced',
      name: 'Programme Fidélité+',
      icon: Gift,
      component: LoyaltyProgramModule,
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
    },
    {
      id: 'advanced-maintenance',
      name: 'Maintenance Avancée',
      icon: Wrench,
      component: AdvancedMaintenance,
      adminOnly: true
    },
    {
      id: 'delivery',
      name: 'Livraisons',
      icon: Truck,
      component: DeliveryTracking
    },
    {
      id: 'online-ordering',
      name: 'Commandes Web',
      icon: Wifi,
      component: OnlineOrdering
    },
    {
      id: 'tables',
      name: 'Gestion Tables',
      icon: Home,
      component: TableManagement
    },
    {
      id: 'user-profiles',
      name: 'Profils Clients',
      icon: Users,
      component: UserProfileEnhanced
    },
    {
      id: 'analytics',
      name: 'Analytics Avancées',
      icon: BarChart3,
      component: AnalyticsDashboard
    },
    {
      id: 'analytics-dashboard',
      name: 'Tableau Analytics IA',
      icon: BarChart3,
      component: AnalyticsDashboardModule,
      adminOnly: true
    },
    {
      id: 'pos',
      name: 'Point de Vente',
      icon: ShoppingCart,
      component: AdvancedPOS
    },
    {
      id: 'staff-scheduling',
      name: 'Planning Personnel',
      icon: Calendar,
      component: StaffScheduling,
      adminOnly: true
    },
    {
      id: 'quality',
      name: 'Contrôle Qualité',
      icon: Shield,
      component: QualityControl
    },
    {
      id: 'feedback',
      name: 'Feedback Clients',
      icon: MessageSquare,
      component: CustomerFeedback
    },
    {
      id: 'events',
      name: 'Événements & Promotions',
      icon: Calendar,
      component: EventsPromotions
    },
    {
      id: 'dashboard-ai',
      name: 'IA Dashboard',
      icon: Brain,
      component: DashboardModule,
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

  // Safe component resolution with proper fallback
  const getCurrentComponent = () => {
    if (activeModule === 'dashboard') {
      return DashboardConsolidated;
    }

    if (currentModule?.component) {
      return currentModule.component;
    }

    // Fallback to default Dashboard
    return Dashboard;
  };

  const CurrentComponent = getCurrentComponent();

  // Placeholder for RoleValidator if not defined elsewhere
  const RoleValidator = ({ userRole, allowedRoles, children }: { userRole?: string; allowedRoles: string[]; children: React.ReactNode }) => {
    if (userRole && allowedRoles.includes(userRole)) {
      return <>{children}</>;
    }
    return <div className="p-4 text-center text-red-500">Accès non autorisé pour ce rôle.</div>;
  };

  // Placeholder for validUserRole if not defined elsewhere
  const validUserRole = user?.role;
  const [loading, setLoading] = useState(true); // Assuming loading state is needed for renderComponent

  // Safe component rendering with role validation and error handling
  const renderComponent = () => {
    if (loading) {
      return <LoadingFallback />;
    }

    const componentProps = {
      userRole: validUserRole,
      user: user
    };

    try {
      switch (activeModule) {
        case 'dashboard':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <DashboardConsolidated {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'reservations':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <Reservations {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'orders':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <Orders {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'customers':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <Customers {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'menu':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <MenuManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'messages':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <Messages {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'employees':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <Employees {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'settings':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <AdminSettings {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'statistics':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <Statistics {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'logs':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <ActivityLogs {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'inventory':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <InventoryManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'inventory-smart':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <InventoryManagementModule {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'loyalty':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <LoyaltySystem {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'loyalty-advanced':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <LoyaltyProgramModule {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'permissions':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <PermissionsManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'schedule':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <WorkSchedule {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'accounting':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <AccountingSystem {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'backup':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <BackupSystem {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'reports':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <ReportsSystem {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'calendar':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <CalendarManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'suppliers':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <SuppliersManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'maintenance':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <MaintenanceManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'advanced-maintenance':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <AdvancedMaintenance {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'delivery':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <DeliveryTracking {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'online-ordering':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <OnlineOrdering {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'tables':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <TableManagement {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'user-profiles':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <UserProfileEnhanced {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'analytics':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <AnalyticsDashboard {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'analytics-dashboard':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <AnalyticsDashboardModule {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'pos':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant', 'employe']}>
                <AdvancedPOS {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'staff-scheduling':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <StaffScheduling {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'quality':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant']}>
                <QualityControl {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'feedback':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant']}>
                <CustomerFeedback {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'events':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur', 'gerant']}>
                <EventsPromotions {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        case 'dashboard-ai':
          return (
            <ErrorBoundary level="component" showDetails={false}>
              <RoleValidator userRole={validUserRole} allowedRoles={['directeur']}>
                <DashboardModule {...componentProps} />
              </RoleValidator>
            </ErrorBoundary>
          );

        default:
          return <NotFoundFallback />;
      }
    } catch (error) {
      console.error('Erreur lors du rendu du composant:', error);
      return (
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de rendu</h3>
            <p className="text-gray-600 mb-4">
              Une erreur s'est produite lors du chargement de ce composant.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header compact avec menu déroulant */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo compact */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Coffee className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-orange-600 dark:text-orange-400 hidden sm:block">
              Barista Café
            </h1>
          </div>

          {/* Menu déroulant compact */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-2 text-sm font-medium h-9"
            >
              <Menu className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{currentModule?.name || 'Dashboard'}</span>
              <span className="sm:hidden">Menu</span>
            </Button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {availableModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-2 py-2 rounded-md text-xs transition-colors text-left w-full",
                        activeModule === module.id
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <module.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-xs">{module.name}</span>
                      {module.notification && module.notification > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1 py-0">
                          {module.notification}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Infos utilisateur compact */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-orange-500 text-white text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
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
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="p-4">
        {/* Affichage du composant actuel avec ErrorBoundary */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <ErrorBoundary
            fallback={({ error, resetError }) => (
              <NotFoundFallback moduleName={currentModule?.name || 'Module inconnu'} />
            )}
          >
            <React.Suspense fallback={<LoadingFallback />}>
              {CurrentComponent && renderComponent()}
            </React.Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}