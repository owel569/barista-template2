import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useUser();
  const [location, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!user) {
    return null;
  }

  // Redirect based on role
  if (location === "/admin" && user.role === "employe") {
    navigate("/employe");
    return null;
  }

  if (location === "/employe" && user.role === "directeur") {
    navigate("/admin");
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
        ${isMobile && sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar
          userRole={user.role as "directeur" | "employe"}
          onLogout={handleLogout}
          collapsed={!isMobile && sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile backdrop */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          userRole={user.role as "directeur" | "employe"}
          username={user.username}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          notifications={3}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}