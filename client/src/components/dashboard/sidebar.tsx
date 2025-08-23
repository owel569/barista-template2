import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  Plus,
  HelpCircle,
  Bell
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SidebarProps {
  userRole: "directeur" | "employe";
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  userData?: {
    name: string;
    email: string;
    notifications?: number;
  };
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: ("directeur" | "employe")[];
  badge?: number;
  actionButton?: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    tooltip: string;
  };
}

export default function Sidebar({ 
  userRole, 
  onLogout, 
  collapsed = false, 
  onToggle, 
  userData 
}: SidebarProps) {
  const [location] = useLocation();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      onToggle?.();
    }
  }, [isMobile, collapsed, onToggle]);

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: Home,
      href: "/admin",
      roles: ["directeur", "employe"]
    },
    {
      id: "reservations",
      label: "Réservations",
      icon: Calendar,
      href: "/admin/reservations",
      roles: ["directeur", "employe"],
      badge: userRole === "directeur" ? 3 : 0,
      actionButton: {
        icon: Plus,
        onClick: () => console.log("Nouvelle réservation"),
        tooltip: "Nouvelle réservation"
      }
    },
    {
      id: "orders",
      label: "Commandes",
      icon: ShoppingCart,
      href: "/admin/orders",
      roles: ["directeur", "employe"],
      badge: 5
    },
    {
      id: "customers",
      label: "Clients",
      icon: Users,
      href: "/admin/customers",
      roles: ["directeur", "employe"]
    },
    {
      id: "menu",
      label: "Menu",
      icon: MenuIcon,
      href: "/admin/menu",
      roles: ["directeur", "employe"]
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      href: "/admin/messages",
      roles: ["directeur", "employe"],
      badge: 2
    },
    {
      id: "employees",
      label: "Employés",
      icon: User,
      href: "/admin/employees",
      roles: ["directeur"]
    },
    {
      id: "analytics",
      label: "Statistiques",
      icon: BarChart3,
      href: "/admin/analytics",
      roles: ["directeur"]
    },
    {
      id: "activity",
      label: "Historique",
      icon: History,
      href: "/admin/activity",
      roles: ["directeur"]
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
      roles: ["directeur"]
    }
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole);

  const handleItemClick = (itemId: string) => {
    if (activeSubmenu === itemId) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(itemId);
    }
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 h-full",
      collapsed ? "w-16" : "w-64",
      isMobile && collapsed ? "absolute z-50" : ""
    }>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BC</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Barista Café
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole === "directeur" ? "Directeur" : "Employé"}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">BC</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={100}>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href !== "/admin" && location.startsWith(item.href);
            
            return (
              <div key={item.id} className="group relative">
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 text-left h-10 group-hover:bg-gray-100 dark:group-hover:bg-gray-800",
                      collapsed ? "px-2" : "px-3",
                      isActive && "bg-amber-500 text-white hover:bg-amber-600"
                    }
                    onClick={() => handleItemClick(item.id}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {!collapsed && (
                      <span className="text-sm flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.actionButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          item.actionButton?.onClick();
                        }}
                        aria-label={item.actionButton.tooltip}
                      >
                        <item.actionButton.icon className="h-3 w-3" />
                      </Button>
                    )}
                  </Button>
                </Link>
                
                {collapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute left-full ml-2 top-0 h-10 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-sm px-2 py-1 rounded whitespace-nowrap">
                          {item.label}
                          {item.badge && item.badge > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {!collapsed && userData && (
          <div className="px-3 py-2 text-sm">
            <p className="font-medium text-gray-900 dark:text-white truncate">{userData.name}</p>
            <p className="text-gray-500 dark:text-gray-400 truncate">{userData.email}</p>
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-left h-10",
                  collapsed ? "px-2" : "px-3",
                  "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Aide</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Aide</TooltipContent>
            }
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-left h-10",
                  collapsed ? "px-2" : "px-3",
                  "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }
              >
                <div className="relative">
                  <Bell className="h-4 w-4 shrink-0" />
                  {userData?.notifications && userData.notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center"
                    >
                      {userData.notifications}
                    </Badge>
                  )}
                </div>
                {!collapsed && <span className="text-sm">Notifications</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Notifications</TooltipContent>
            }
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={onLogout}
                className={cn(
                  "w-full justify-start gap-3 text-left h-10",
                  collapsed ? "px-2" : "px-3",
                  "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                }
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Déconnexion</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Déconnexion</TooltipContent>
            }
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}