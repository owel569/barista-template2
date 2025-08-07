import React, { useState } from "react";
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
  User
} from "lucide-react";

interface SidebarProps {
  userRole: "directeur" | "employe";
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: ("directeur" | "employe")[];
}

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
    roles: ["directeur", "employe"]
  },
  {
    id: "orders",
    label: "Commandes",
    icon: ShoppingCart,
    href: "/admin/orders",
    roles: ["directeur", "employe"]
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
    roles: ["directeur", "employe"]
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

export default function Sidebar({ userRole, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BC</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Barista Café
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole === "directeur" ? "Directeur" : "Employé")}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          
          return (
            <Link key={item.id} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-left h-10",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-amber-500 text-white hover:bg-amber-600"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full justify-start gap-3 text-left h-10",
            collapsed ? "px-2" : "px-3",
            "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </Button>
      </div>
    </div>
  );
}