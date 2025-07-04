import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Menu as MenuIcon, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BarChart3,
  History,
  User,
  LogOut,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  exact?: boolean;
  readonly?: boolean;
}

interface AdminSidebarProps {
  userRole: 'directeur' | 'employe';
  username: string;
  onLogout: () => void;
}

export function AdminSidebar({ userRole, username, onLogout }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getPermittedMenuItems = (): MenuItem[] => {
    const commonItems: MenuItem[] = [
      { icon: LayoutDashboard, label: 'Tableau de bord', href: '/admin', exact: true },
      { icon: Calendar, label: 'Réservations', href: '/admin/reservations' },
      { icon: ShoppingCart, label: 'Commandes', href: '/admin/orders' },
      { icon: Users, label: 'Clients', href: '/admin/customers', readonly: userRole === 'employe' },
      { icon: MenuIcon, label: 'Menu', href: '/admin/menu' },
      { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
    ];

    const directeurOnlyItems: MenuItem[] = [
      { icon: UserCheck, label: 'Employés', href: '/admin/employees' },
      { icon: Settings, label: 'Paramètres', href: '/admin/settings' },
      { icon: BarChart3, label: 'Statistiques', href: '/admin/statistics' },
      { icon: History, label: 'Historique', href: '/admin/logs' },
    ];

    return userRole === 'directeur' 
      ? [...commonItems, ...directeurOnlyItems]
      : commonItems;
  };

  const menuItems = getPermittedMenuItems();

  return (
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
                  {userRole === 'directeur' ? 'Directeur' : 'Employé'}
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

      {/* Top bar controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? location === item.href 
            : location.startsWith(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed ? "px-2" : "px-3",
                  item.readonly && "opacity-60 cursor-not-allowed"
                )}
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
            </Link>
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
                {username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userRole === 'directeur' ? 'Directeur' : 'Employé'}
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          onClick={onLogout}
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
  );
}