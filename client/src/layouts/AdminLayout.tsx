import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingCart, 
  Calendar, 
  Users, 
  BarChart3, 
  Package, 
  ClipboardList,
  Settings,
  UserCog,
  FileText,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface AdminLayoutProps {
  children: React.ReactNode | ((user: any) => React.ReactNode);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/menu', icon: Coffee, label: 'Gestion Menu' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Commandes' },
    { path: '/admin/reservations', icon: Calendar, label: 'Réservations' },
    { path: '/admin/customers', icon: Users, label: 'Clients' },
    { path: '/admin/statistics', icon: BarChart3, label: 'Statistiques' },
    { path: '/admin/inventory', icon: Package, label: 'Inventaire' },
    { path: '/admin/schedule', icon: Clock, label: 'Planning' },
    { path: '/admin/reports', icon: FileText, label: 'Rapports' },
    { path: '/admin/permissions', icon: UserCog, label: 'Permissions' },
    { path: '/admin/profile', icon: Settings, label: 'Profil' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location === path;
    }
    return location.startsWith(path);
  };

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(user);
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Coffee className="h-8 w-8 text-amber-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Admin Panel
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path, item.exact) ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-4 left-3 right-3">
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.firstName?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header mobile */}
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow h-16 flex items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
            Administration
          </h1>
        </div>

        {/* Main content */}
        <main className="flex-1">
          {renderChildren()}
        </main>
      </div>
    </div>
  );
}