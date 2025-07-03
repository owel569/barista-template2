import React, { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Calendar, 
  ShoppingCart, 
  Users, 
  MenuIcon, 
  MessageSquare,
  Settings,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Moon,
  Sun,
  Menu
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import ReservationsManagement from "./admin/reservations-management";
import OrdersManagement from "./admin/orders-management";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: Home,
    href: "/admin",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "reservations",
    label: "Réservations",
    icon: Calendar,
    href: "/admin/reservations",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "orders",
    label: "Commandes",
    icon: ShoppingCart,
    href: "/admin/orders",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "customers",
    label: "Clients",
    icon: Users,
    href: "/admin/customers",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "menu",
    label: "Menu",
    icon: MenuIcon,
    href: "/admin/menu",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    href: "/admin/messages",
    roles: ["directeur", "employe", "admin"]
  },
  {
    id: "employees",
    label: "Employés",
    icon: User,
    href: "/admin/employees",
    roles: ["directeur", "admin"]
  },
  {
    id: "analytics",
    label: "Statistiques",
    icon: BarChart3,
    href: "/admin/analytics",
    roles: ["directeur", "admin"]
  },
  {
    id: "activity",
    label: "Historique",
    icon: History,
    href: "/admin/activity",
    roles: ["directeur", "admin"]
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    href: "/admin/settings",
    roles: ["directeur", "admin"]
  }
];

interface AdminDashboardLayoutProps {
  userRole: string;
  user: any;
}

export default function AdminDashboardLayout({ userRole, user }: AdminDashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  const renderContent = () => {
    switch (location) {
      case "/admin":
        return <DashboardMain userRole={userRole} />;
      case "/admin/reservations":
        return <ReservationsManagement userRole={userRole} />;
      case "/admin/orders":
        return <OrdersManagement userRole={userRole} />;
      case "/admin/customers": 
        return <CustomersManagement userRole={userRole} />;
      case "/admin/menu":
        return <MenuManagement userRole={userRole} />;
      case "/admin/messages":
        return <MessagesManagement userRole={userRole} />;
      case "/admin/employees":
        if (userRole === "directeur" || userRole === "admin") {
          return <EmployeesManagement />;
        }
        return <div className="p-6 text-center">Accès non autorisé</div>;
      case "/admin/analytics":
        if (userRole === "directeur" || userRole === "admin") {
          return <AnalyticsManagement />;
        }
        return <div className="p-6 text-center">Accès non autorisé</div>;
      case "/admin/activity":
        if (userRole === "directeur" || userRole === "admin") {
          return <ActivityManagement />;
        }
        return <div className="p-6 text-center">Accès non autorisé</div>;
      case "/admin/settings":
        if (userRole === "directeur" || userRole === "admin") {
          return <SettingsManagement />;
        }
        return <div className="p-6 text-center">Accès non autorisé</div>;
      default:
        return <DashboardMain userRole={userRole} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BC</span>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Barista Café
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userRole === "directeur" ? "Directeur" : userRole === "admin" ? "Admin" : "Employé"}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-1 h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-left h-10",
                  sidebarCollapsed ? "px-2" : "px-3",
                  isActive && "bg-amber-500 text-white hover:bg-amber-600"
                )}
                onClick={() => navigate(item.href)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-left h-10",
              sidebarCollapsed ? "px-2" : "px-3",
              "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Déconnexion</span>}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Tableau de bord</span>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">
                  {userRole === "directeur" ? "Directeur" : userRole === "admin" ? "Admin" : "Employé"}
                </span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="h-9 w-9 p-0"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 relative"
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 h-9 px-3"
                  >
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden md:block">
                      {user.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Connecté en tant que
                  </div>
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userRole === "directeur" ? "Directeur" : userRole === "admin" ? "Admin" : "Employé"}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Composants temporaires pour les sections non encore implémentées
function DashboardMain({ userRole }: { userRole: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Tableau de bord {userRole === "directeur" ? "Directeur" : userRole === "admin" ? "Admin" : "Employé"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Réservations aujourd'hui</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Commandes en cours</h3>
          <p className="text-3xl font-bold text-amber-600">8</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Clients actifs</h3>
          <p className="text-3xl font-bold text-green-600">45</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Revenus du jour</h3>
          <p className="text-3xl font-bold text-purple-600">2,450€</p>
        </div>
      </div>
    </div>
  );
}

function CustomersManagement({ userRole }: { userRole: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Clients</h1>
      <p>Module de gestion des clients (en développement)</p>
    </div>
  );
}

function MenuManagement({ userRole }: { userRole: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Menu</h1>
      <p>Module de gestion du menu (en développement)</p>
    </div>
  );
}

function MessagesManagement({ userRole }: { userRole: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <p>Module de gestion des messages (en développement)</p>
    </div>
  );
}

function EmployeesManagement() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Employés</h1>
      <p>Module de gestion des employés (en développement)</p>
    </div>
  );
}

function AnalyticsManagement() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Statistiques</h1>
      <p>Module de statistiques avancées (en développement)</p>
    </div>
  );
}

function ActivityManagement() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Historique</h1>
      <p>Module d'historique des activités (en développement)</p>
    </div>
  );
}

function SettingsManagement() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      <p>Module de paramètres généraux (en développement)</p>
    </div>
  );
}