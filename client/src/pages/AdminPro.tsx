import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AuthContext } from '@/contexts/auth-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { usePermissions } from '@/hooks/usePermissions';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  Users, 
  UtensilsCrossed, 
  MessageSquare, 
  UserCog, 
  Settings, 
  BarChart3, 
  FileText, 
  Shield, 
  Package,
  Gift,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown
} from 'lucide-react';

// Import des composants admin
import DashboardMain from '@/components/admin/dashboard-main';
import Reservations from '@/components/admin/reservations';
import Orders from '@/components/admin/orders';
import Customers from '@/components/admin/customers';
import MenuManagement from '@/components/admin/menu-management';
import Messages from '@/components/admin/messages';
import Employees from '@/components/admin/employees';
import AdminSettings from '@/components/admin/settings';
import Statistics from '@/components/admin/statistics';
import ActivityLogs from '@/components/admin/activity-logs';
import PermissionsManagement from '@/components/admin/permissions-management';
import InventoryManagement from '@/components/admin/inventory-management';
import LoyaltySystem from '@/components/admin/loyalty-system';
import NotificationsSystem from '@/components/admin/notifications-system';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  permission: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, component: DashboardMain, permission: 'dashboard' },
  { id: 'reservations', label: 'Réservations', icon: Calendar, component: Reservations, permission: 'reservations' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, component: Orders, permission: 'orders' },
  { id: 'customers', label: 'Clients', icon: Users, component: Customers, permission: 'customers' },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, component: MenuManagement, permission: 'menu' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, component: Messages, permission: 'messages' },
  { id: 'employees', label: 'Employés', icon: UserCog, component: Employees, permission: 'employees' },
  { id: 'settings', label: 'Paramètres', icon: Settings, component: AdminSettings, permission: 'settings' },
  { id: 'statistics', label: 'Statistiques', icon: BarChart3, component: Statistics, permission: 'statistics' },
  { id: 'logs', label: 'Historique', icon: FileText, component: ActivityLogs, permission: 'logs' },
  { id: 'permissions', label: 'Permissions', icon: Shield, component: PermissionsManagement, permission: 'permissions' },
  { id: 'inventory', label: 'Inventaire', icon: Package, component: InventoryManagement, permission: 'inventory' },
  { id: 'loyalty', label: 'Fidélité', icon: Gift, component: LoyaltySystem, permission: 'loyalty' },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSystem, permission: 'notifications' }
];

interface AdminProContentProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
}

const AdminProContent: React.FC<AdminProContentProps> = ({ currentMenu, setCurrentMenu }) => {
  const [, setLocation] = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme, setTheme, isDark } = useTheme();
  const { canAccess, isDirecteur } = usePermissions();
  const { notifications, unreadCount, markAsRead, clearNotifications } = useWebSocket();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  // Filtrer les éléments du menu selon les permissions
  const visibleMenuItems = menuItems.filter(item => canAccess(item.permission));

  // Obtenir le composant actuel
  const currentMenuItem = visibleMenuItems.find(item => item.id === currentMenu);
  const CurrentComponent = currentMenuItem?.component || DashboardMain;

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleNotificationClick = (notificationId: number) => {
    markAsRead(notificationId);
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Logo et titre */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Barista Café</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administration</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentMenu(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-amber-600 text-white text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentMenuItem?.label || 'Tableau de bord'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDirecteur ? 'Interface Directeur' : 'Interface Employé'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className="relative p-2"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                {notificationMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                        {notifications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearNotifications}
                            className="text-xs"
                          >
                            Effacer tout
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          Aucune notification
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              !notification.read ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.read ? 'bg-amber-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {new Date(notification.timestamp).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Profile Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 p-2"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-amber-600 text-white text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <CurrentComponent />
        </main>
      </div>

      {/* Overlay pour fermer les menus */}
      {(profileMenuOpen || notificationMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setProfileMenuOpen(false);
            setNotificationMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

const AdminPro: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="light">
      <AdminProContent currentMenu={currentMenu} setCurrentMenu={setCurrentMenu} />
    </ThemeProvider>
  );
};

export default AdminPro;