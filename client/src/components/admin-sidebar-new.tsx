import React, { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Coffee, 
  MessageSquare, 
  UserCheck, 
  Settings, 
  TrendingUp, 
  Clock,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Bell
} from "lucide-react";
import { getNavigationModules, hasPermission, UserRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarNewProps {
  userRole: UserRole;
  user: any;
  isCollapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const iconMap = {
  BarChart3,
  Calendar,
  ShoppingCart,
  Users,
  Coffee,
  MessageSquare,
  UserCheck,
  Settings,
  TrendingUp,
  Clock
};

export default function AdminSidebarNew({
  userRole,
  user,
  isCollapsed,
  onToggle,
  onLogout,
  darkMode,
  onToggleDarkMode
}: AdminSidebarNewProps) {
  const [location, navigate] = useLocation();
  const [notifications] = useState(3); // Mock notifications count
  
  const modules = getNavigationModules(userRole);
  const currentPath = location.split('/')[2] || 'dashboard';

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "directeur": return "Directeur";
      case "employe": return "Employé";
      case "admin": return "Administrateur";
      default: return "Utilisateur";
    }
  };

  const handleNavigation = (path: string) => {
    const fullPath = `/admin${path}`;
    navigate(fullPath);
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-gradient-to-b from-amber-900 to-amber-950 text-white transition-all duration-300 z-50",
        "border-r border-amber-800/20 shadow-2xl",
        isCollapsed ? "-translate-x-full lg:w-20" : "w-72 lg:w-72"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-amber-800/20">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", isCollapsed && "lg:justify-center")}>
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <Coffee className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-amber-100">Barista Café</h1>
                  <p className="text-sm text-amber-300">Administration</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-amber-200 hover:bg-amber-800/30 lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-amber-800/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-100">{user?.username || 'Utilisateur'}</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-amber-700/50 text-amber-200 border-amber-600"
                  >
                    {getRoleDisplayName(userRole)}
                  </Badge>
                  {notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="bg-red-600 text-white"
                    >
                      {notifications}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {modules.map((module) => {
              const IconComponent = iconMap[module.icon as keyof typeof iconMap];
              const isActive = currentPath === module.id;
              const canAccess = hasPermission(userRole, module.id, "view");

              if (!canAccess) return null;

              return (
                <Button
                  key={module.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-left h-12",
                    "text-amber-200 hover:bg-amber-800/30 hover:text-white",
                    isActive && "bg-amber-700/50 text-white border-r-2 border-amber-400",
                    isCollapsed && "lg:justify-center lg:px-2"
                  )}
                  onClick={() => handleNavigation(module.path)}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{module.label}</span>
                  )}
                  {!isCollapsed && module.id === "messages" && notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto bg-red-600 text-white text-xs"
                    >
                      {notifications}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-800/20">
          <div className="space-y-2">
            {/* Mode sombre/clair */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-amber-200 hover:bg-amber-800/30 hover:text-white",
                isCollapsed && "lg:justify-center lg:px-2"
              )}
              onClick={onToggleDarkMode}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!isCollapsed && <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>}
            </Button>

            {/* Notifications */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-amber-200 hover:bg-amber-800/30 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {notifications > 0 && (
                  <Badge variant="destructive" className="ml-auto bg-red-600 text-white text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* Déconnexion */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-amber-200 hover:bg-red-600/20 hover:text-red-300",
                isCollapsed && "lg:justify-center lg:px-2"
              )}
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Déconnexion</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Bouton menu pour mobile */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg"
          onClick={onToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}