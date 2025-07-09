import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
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
  ChevronDown,
  User,
  Package2,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Import admin modules
import Dashboard from '@/components/admin/dashboard';
import Reservations from '@/components/admin/reservations';
import Orders from '@/components/admin/orders';
import Customers from '@/components/admin/customers';
import Employees from '@/components/admin/employees';
import MenuManagement from '@/components/admin/menu-management';
import Messages from '@/components/admin/messages';
import AdminSettings from '@/components/admin/settings';
import NotificationsSystem from '@/components/admin/notifications-system';
import Statistics from '@/components/admin/statistics';
import ActivityLogs from '@/components/admin/activity-logs';
import PermissionsManagement from '@/components/admin/permissions-management';
import InventoryManagement from '@/components/admin/inventory-management';
import LoyaltySystem from '@/components/admin/loyalty-system';

interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function AdminHorizontal() {
  const [location, navigate] = useLocation();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [pendingReservations, setPendingReservations] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  const totalNotifications = pendingReservations.length + newMessages.length + pendingOrders.length;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin/login');
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
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [reservationsRes, messagesRes, ordersRes] = await Promise.all([
          fetch('/api/admin/notifications/pending-reservations', { headers }),
          fetch('/api/admin/notifications/new-messages', { headers }),
          fetch('/api/admin/notifications/pending-orders', { headers })
        ]);

        if (reservationsRes.ok) {
          const reservations = await reservationsRes.json();
          setPendingReservations(reservations);
        }

        if (messagesRes.ok) {
          const messages = await messagesRes.json();
          setNewMessages(messages);
        }

        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setPendingOrders(orders);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const currentSection = params.section || 'dashboard';

  const navigateToSection = (section: string) => {
    navigate(`/admin/${section}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const getMenuItems = () => {
    const userRole = user?.role;
    
    const common = [
      { icon: LayoutDashboard, label: 'Tableau de bord', section: 'dashboard' },
      { icon: Calendar, label: 'Réservations', section: 'reservations' },
      { icon: ShoppingCart, label: 'Commandes', section: 'orders' },
      { icon: Users, label: 'Clients', section: 'customers', readonly: userRole === 'employe' },
      { icon: MenuIcon, label: 'Menu', section: 'menu' },
      { icon: MessageSquare, label: 'Messages', section: 'messages' },
    ];

    if (userRole === 'directeur') {
      return [
        ...common,
        { icon: UserCheck, label: 'Employés', section: 'employees' },
        { icon: Settings, label: 'Paramètres', section: 'settings' },
        { icon: BarChart3, label: 'Statistiques', section: 'statistics' },
        { icon: History, label: 'Historique', section: 'logs' },
        { icon: Settings, label: 'Permissions', section: 'permissions' },
        { icon: Package2, label: 'Stocks', section: 'inventory' },
        { icon: Star, label: 'Fidélité', section: 'loyalty' },
      ];
    }

    return common;
  };

  const renderContent = () => {
    const userRole = user?.role;
    
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'reservations':
        return <Reservations userRole={userRole} />;
      case 'orders':
        return <Orders userRole={userRole} />;
      case 'customers':
        return <Customers userRole={userRole} user={user} />;
      case 'employees':
        return userRole === 'directeur' ? <Employees userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'menu':
        return <MenuManagement userRole={userRole} />;
      case 'messages':
        return <Messages userRole={userRole} />;
      case 'settings':
        return userRole === 'directeur' ? <AdminSettings userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'statistics':
        return userRole === 'directeur' ? <Statistics userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'logs':
        return userRole === 'directeur' ? <ActivityLogs userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'permissions':
        return userRole === 'directeur' ? <PermissionsManagement userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'inventory':
        return userRole === 'directeur' ? <InventoryManagement userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'loyalty':
        return userRole === 'directeur' ? <LoyaltySystem userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      default:
        return <Dashboard userRole={userRole} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BC</span>
            </div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Barista Café</h1>
            
            {/* Dropdown Navigation */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2"
              >
                <MenuIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Menu</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-2 space-y-1">
                    {getMenuItems().map((item) => {
                      const isActive = currentSection === item.section;
                      
                      return (
                        <Button
                          key={item.section}
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start h-10 px-3",
                            item.readonly && "opacity-60"
                          )}
                          onClick={() => {
                            navigateToSection(item.section);
                            setIsDropdownOpen(false);
                          }}
                          disabled={item.readonly}
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          <span className="text-sm">
                            {item.label}
                            {item.readonly && <span className="ml-1 text-xs">(lecture)</span>}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
              >
                <Bell className="h-4 w-4" />
                {totalNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 text-white">
                    {totalNotifications}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {renderContent()}
        </div>
      </main>
      
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}