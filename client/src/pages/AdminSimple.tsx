import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Menu as MenuIcon, 
  MessageSquare, 
  Settings,
  UserCheck,
  BarChart3,
  History,
  LogOut,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Package2,
  Star,
  Shield,
  Database,
  Clock,
  FileText,
  Server,
  Building2,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';

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
import CalendarSystem from '@/components/admin/calendar-system-complete';
import DragDropSystem from '@/components/admin/drag-drop-system';
import NotificationsSystem from '@/components/admin/notifications-system';
import SystemMonitoring from '@/components/admin/system-monitoring';
import SuppliersManagement from '@/components/admin/suppliers-management';
import MaintenanceSystem from '@/components/admin/maintenance-system';

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface NotificationCount {
  newReservations: number;
  newMessages: number;
  pendingOrders: number;
}

export default function AdminSimple() {
  const [location, navigate] = useLocation();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationCount>({
    newReservations: 0,
    newMessages: 0,
    pendingOrders: 0
  });

  const { permissions, hasPermission } = usePermissions(user);
  const { isConnected } = useWebSocket();

  const currentSection = params.section || 'dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Charger les notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const [reservations, messages, orders] = await Promise.all([
          fetch('/api/admin/notifications/pending-reservations', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/notifications/new-messages', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/notifications/pending-orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [resData, msgData, ordData] = await Promise.all([
          reservations.json().catch(() => ({ count: 0 })),
          messages.json().catch(() => ({ count: 0 })),
          orders.json().catch(() => ({ count: 0 }))
        ]);

        setNotifications({
          newReservations: resData.count || 0,
          newMessages: msgData.count || 0,
          pendingOrders: ordData.count || 0
        });
      } catch (error) {
        console.error('Erreur de chargement des notifications:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const navigateToSection = (section: string) => {
    navigate(`/admin/${section}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      { icon: LayoutDashboard, label: 'Tableau de bord', section: 'dashboard', module: 'dashboard' },
      { icon: Calendar, label: 'Réservations', section: 'reservations', module: 'reservations', badge: notifications.newReservations },
      { icon: ShoppingCart, label: 'Commandes', section: 'orders', module: 'orders', badge: notifications.pendingOrders },
      { icon: Users, label: 'Clients', section: 'customers', module: 'customers' },
      { icon: MenuIcon, label: 'Menu', section: 'menu', module: 'menu' },
      { icon: MessageSquare, label: 'Messages', section: 'messages', module: 'messages', badge: notifications.newMessages },
    ];

    // Ajouter les modules directeur uniquement
    if (user?.role === 'directeur') {
      items.push(
        { icon: UserCheck, label: 'Employés', section: 'employees', module: 'employees' },
        { icon: Settings, label: 'Paramètres', section: 'settings', module: 'settings' },
        { icon: BarChart3, label: 'Statistiques', section: 'statistics', module: 'statistics' },
        { icon: History, label: 'Historique', section: 'logs', module: 'logs' },
        { icon: Shield, label: 'Permissions', section: 'permissions', module: 'permissions' },
        { icon: Package2, label: 'Stocks', section: 'inventory', module: 'inventory' },
        { icon: Star, label: 'Fidélité', section: 'loyalty', module: 'loyalty' },
        { icon: Clock, label: 'Planning', section: 'schedule', module: 'schedule' },
        { icon: Database, label: 'Comptabilité', section: 'accounting', module: 'accounting' },
        { icon: Database, label: 'Sauvegardes', section: 'backups', module: 'backups' },
        { icon: FileText, label: 'Rapports', section: 'reports', module: 'reports' },
        { icon: Calendar, label: 'Calendrier', section: 'calendar', module: 'calendar' },
        { icon: Bell, label: 'Notifications', section: 'notifications', module: 'notifications' },
        { icon: Settings, label: 'Glisser-Déposer', section: 'dragdrop', module: 'dragdrop' },
        { icon: Server, label: 'Monitoring', section: 'monitoring', module: 'monitoring' },
        { icon: Building2, label: 'Fournisseurs', section: 'suppliers', module: 'suppliers' },
        { icon: Wrench, label: 'Maintenance', section: 'maintenance', module: 'maintenance' }
      );
    }

    // Filtrer par permissions
    return items.filter(item => hasPermission(item.module, 'view'));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard': return <Dashboard />;
      case 'reservations': return <Reservations />;
      case 'orders': return <Orders />;
      case 'customers': return <Customers />;
      case 'menu': return <MenuManagement />;
      case 'messages': return <Messages />;
      case 'employees': return hasPermission('employees', 'view') ? <Employees /> : <div>Accès non autorisé</div>;
      case 'settings': return hasPermission('settings', 'view') ? <AdminSettings /> : <div>Accès non autorisé</div>;
      case 'statistics': return hasPermission('statistics', 'view') ? <Statistics /> : <div>Accès non autorisé</div>;
      case 'logs': return hasPermission('logs', 'view') ? <ActivityLogs /> : <div>Accès non autorisé</div>;
      case 'permissions': return hasPermission('employees', 'view') ? <PermissionsManagement /> : <div>Accès non autorisé</div>;
      case 'inventory': return hasPermission('employees', 'view') ? <InventoryManagement userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'loyalty': return hasPermission('employees', 'view') ? <LoyaltySystem /> : <div>Accès non autorisé</div>;
      case 'schedule': return hasPermission('employees', 'view') ? <WorkSchedule /> : <div>Accès non autorisé</div>;
      case 'accounting': return hasPermission('employees', 'view') ? <AccountingSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'backups': return hasPermission('employees', 'view') ? <BackupSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'reports': return hasPermission('employees', 'view') ? <ReportsSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'calendar': return hasPermission('employees', 'view') ? <CalendarSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'notifications': return hasPermission('employees', 'view') ? <NotificationsSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'dragdrop': return hasPermission('employees', 'view') ? <DragDropSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'monitoring': return hasPermission('employees', 'view') ? <SystemMonitoring userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'suppliers': return hasPermission('employees', 'view') ? <SuppliersManagement userRole={user.role} /> : <div>Accès non autorisé</div>;
      case 'maintenance': return hasPermission('employees', 'view') ? <MaintenanceSystem userRole={user.role} /> : <div>Accès non autorisé</div>;
      default: return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalNotifications = notifications.newReservations + notifications.newMessages + notifications.pendingOrders;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo et toggle */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <img 
                  src="https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Barista Café" 
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="font-bold text-lg text-gray-900 dark:text-white">Barista Café</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {getMenuItems().map((item) => (
                <button
                  key={item.section}
                  onClick={() => navigateToSection(item.section)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    currentSection === item.section
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isSidebarCollapsed && item.badge && item.badge > 0 && (
                    <div className="absolute left-8 top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!isSidebarCollapsed && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getMenuItems().find(item => item.section === currentSection)?.label || 'Administration'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Interface {user.role} - {user.username}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status WebSocket */}
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {totalNotifications}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}