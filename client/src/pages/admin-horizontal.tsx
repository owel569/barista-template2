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
  Star,
  DollarSign,
  Truck,
  FileText,
  Database,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebSocket } from '@/hooks/useWebSocket';

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
import WorkSchedule from '@/components/admin/work-schedule';
import TestAllFeatures from '@/components/admin/test-all-features';
import Accounting from '@/components/admin/accounting';
import Suppliers from '@/components/admin/suppliers';
import Reports from '@/components/admin/reports';
import CalendarManagement from '@/components/admin/calendar-management';
import BackupSystem from '@/components/admin/backup-system';
import MaintenanceSystem from '@/components/admin/maintenance-system';

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

  // Utiliser useWebSocket pour les notifications temps réel
  const { isConnected } = useWebSocket();

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
        { icon: Calendar, label: 'Planning', section: 'schedule' },
        { icon: DollarSign, label: 'Comptabilité', section: 'accounting' },
        { icon: Truck, label: 'Fournisseurs', section: 'suppliers' },
        { icon: FileText, label: 'Rapports', section: 'reports' },
        { icon: CalendarIcon, label: 'Calendrier', section: 'calendar' },
        { icon: Database, label: 'Sauvegardes', section: 'backup' },
        { icon: Wrench, label: 'Maintenance', section: 'maintenance' },
        { icon: BarChart3, label: 'Test Complet', section: 'test' },
      ];
    }

    return common;
  };

  const renderContent = () => {
    const userRole = user?.role as 'directeur' | 'employe';
    
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'reservations':
        return <Reservations userRole={userRole} user={user} />;
      case 'orders':
        return <Orders userRole={userRole} user={user} />;
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
      case 'schedule':
        return userRole === 'directeur' ? <WorkSchedule userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'accounting':
        return userRole === 'directeur' ? <Accounting userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'suppliers':
        return userRole === 'directeur' ? <Suppliers userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'reports':
        return userRole === 'directeur' ? <Reports userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'calendar':
        return userRole === 'directeur' ? <CalendarManagement userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'backup':
        return userRole === 'directeur' ? <BackupSystem userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'maintenance':
        return userRole === 'directeur' ? <MaintenanceSystem userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'test':
        return userRole === 'directeur' ? <TestAllFeatures userRole={userRole} /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
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
            
            <NotificationsSystem 
              isOpen={isNotificationsOpen} 
              onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
              userRole={user?.role as 'directeur' | 'employe'}
            />
            
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