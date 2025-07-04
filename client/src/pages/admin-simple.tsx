import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
}

export default function AdminSimple() {
  const [location, navigate] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin-token');
      if (!token) {
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
          navigate('/login');
        }
      } catch (error) {
        localStorage.removeItem('admin-token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      { icon: LayoutDashboard, label: 'Tableau de bord', href: '/admin', exact: true },
      { icon: Calendar, label: 'Réservations', href: '/admin/reservations' },
      { icon: ShoppingCart, label: 'Commandes', href: '/admin/orders' },
      { icon: Users, label: 'Clients', href: '/admin/customers', readonly: user?.role === 'employe' },
      { icon: MenuIcon, label: 'Menu', href: '/admin/menu' },
      { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
    ];

    if (user?.role === 'directeur') {
      return [
        ...common,
        { icon: UserCheck, label: 'Employés', href: '/admin/employees' },
        { icon: Settings, label: 'Paramètres', href: '/admin/settings' },
        { icon: BarChart3, label: 'Statistiques', href: '/admin/statistics' },
        { icon: History, label: 'Historique', href: '/admin/logs' },
      ];
    }

    return common;
  };

  const getCurrentSection = () => {
    const path = location.replace('/admin', '') || '';
    switch (path) {
      case '':
      case '/':
        return 'Tableau de bord';
      case '/reservations':
        return 'Gestion des Réservations';
      case '/orders':
        return 'Gestion des Commandes';
      case '/customers':
        return 'Gestion des Clients';
      case '/menu':
        return 'Gestion du Menu';
      case '/messages':
        return 'Gestion des Messages';
      case '/employees':
        return 'Gestion des Employés';
      case '/settings':
        return 'Paramètres Généraux';
      case '/statistics':
        return 'Statistiques Avancées';
      case '/logs':
        return 'Historique des Actions';
      default:
        return 'Administration';
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                  <Bell className="h-4 w-4" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">3</Badge>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {getMenuItems().map((item) => {
            const isActive = item.exact 
              ? location === item.href 
              : location.startsWith(item.href);
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed ? "px-2" : "px-3",
                  item.readonly && "opacity-60"
                )}
                onClick={() => navigate(item.href)}
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
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getCurrentSection()}
              </h1>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {user.role === 'directeur' ? 'Directeur' : 'Employé'}
              </Badge>
            </div>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Interface d'Administration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Système d'Administration Opérationnel
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Bienvenue dans votre espace d'administration. Utilisez la navigation latérale pour accéder aux différents modules.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Réservations</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les réservations clients</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Commandes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Suivi des commandes</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Clients</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Base de données clients {user.role === 'employe' && '(lecture seule)'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}