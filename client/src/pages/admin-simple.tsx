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
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import NotificationsSystem from '@/components/admin/notifications-system';
import Statistics from '@/components/admin/statistics';
import ActivityLogs from '@/components/admin/activity-logs';

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
}

export default function AdminSimple() {
  const [location, navigate] = useLocation();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Gestion du routage par URL avec paramètres
  useEffect(() => {
    const section = params.section || 'dashboard';
    setCurrentSection(section);
  }, [params.section]);

  // Fonction pour naviguer vers une section
  const navigateToSection = (section: string) => {
    const basePath = user?.role === 'directeur' ? '/admin' : '/employe';
    if (section === 'dashboard') {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${section}`);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setIsLoading(false);
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('admin-token');
          setIsLoading(false);
          navigate('/login');
        }
      } catch (error) {
        localStorage.removeItem('admin-token');
        setIsLoading(false);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Dependency array empty to run only once

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    navigate('/login');
  };

  const getMenuItems = () => {
    const common = [
      { icon: LayoutDashboard, label: 'Tableau de bord', section: 'dashboard' },
      { icon: Calendar, label: 'Réservations', section: 'reservations' },
      { icon: ShoppingCart, label: 'Commandes', section: 'orders' },
      { icon: Users, label: 'Clients', section: 'customers', readonly: user?.role === 'employe' },
      { icon: MenuIcon, label: 'Menu', section: 'menu' },
      { icon: MessageSquare, label: 'Messages', section: 'messages' },
    ];

    if (user?.role === 'directeur') {
      return [
        ...common,
        { icon: UserCheck, label: 'Employés', section: 'employees' },
        { icon: Settings, label: 'Paramètres', section: 'settings' },
        { icon: BarChart3, label: 'Statistiques', section: 'statistics' },
        { icon: History, label: 'Historique', section: 'logs' },
      ];
    }

    return common;
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'reservations':
        return 'Gestion des Réservations';
      case 'orders':
        return 'Gestion des Commandes';
      case 'customers':
        return 'Gestion des Clients';
      case 'menu':
        return 'Gestion du Menu';
      case 'messages':
        return 'Gestion des Messages';
      case 'employees':
        return 'Gestion des Employés';
      case 'settings':
        return 'Paramètres Généraux';
      case 'statistics':
        return 'Statistiques Avancées';
      case 'logs':
        return 'Historique des Actions';
      default:
        return 'Administration';
    }
  };

  const renderContent = () => {
    const userRole = user?.role || 'employe';
    
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'reservations':
        return <Reservations userRole={userRole} />;
      case 'orders':
        return <Orders userRole={userRole} />;
      case 'customers':
        return <Customers userRole={userRole} />;
      case 'menu':
        return <MenuManagement canDelete={userRole === 'directeur'} />;
      case 'messages':
        return <Messages />;
      case 'employees':
        return userRole === 'directeur' ? <Employees /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'settings':
        return userRole === 'directeur' ? <AdminSettings /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'statistics':
        return userRole === 'directeur' ? <Statistics /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
      case 'logs':
        return userRole === 'directeur' ? <ActivityLogs /> : <div className="p-6"><h2 className="text-2xl font-bold">Accès non autorisé</h2><p>Module réservé aux directeurs</p></div>;
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
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BC</span>
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">Barista Café</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0">
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <NotificationsSystem 
                  isOpen={isNotificationsOpen} 
                  onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {getMenuItems().map((item) => {
            const isActive = currentSection === item.section;
            
            return (
              <Button
                key={item.section}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed ? "px-2" : "px-3",
                  item.readonly && "opacity-60"
                )}
                onClick={() => {
                  navigateToSection(item.section);
                }}
                disabled={item.readonly}
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="ml-3 truncate">
                    {item.label}
                    {item.readonly && <span className="ml-1 text-xs">(lecture)</span>}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                </p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn("transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}