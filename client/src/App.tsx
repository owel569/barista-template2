import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/theme-context";
import Sidebar from "@/components/sidebar";
import Home from "@/pages/home";
import LoginSimple from "@/pages/LoginSimple";
import Register from "@/pages/register";
import InteractiveReservation from "@/components/interactive-reservation";
import AdminFinal from "@/pages/AdminFinal";

import NotFound from "@/pages/not-found";
import MenuPage from "@/components/menu-page";
import About from "@/components/about";
import Contact from "@/components/contact";
import Gallery from "@/components/gallery";

function Router() : JSX.Element {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = !['/login', '/register', '/admin', '/employe', '/admin-complete', '/admin-pro'].includes(location) && !location.startsWith('/admin/');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      <div className={`flex-1 ${showSidebar && sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
        <Switch>
          <Route path="/" component={() => <Home />} />
          <Route path="/menu" component={() => <MenuPage />} />
          <Route path="/about" component={() => <About />} />
          <Route path="/contact" component={() => <Contact />} />
          <Route path="/gallery" component={() => <Gallery />} />
          <Route path="/login" component={() => <LoginSimple />} />
          <Route path="/register" component={() => <Register />} />
          <Route path="/reservation" component={() => <InteractiveReservation />} />
          <Route path="/admin/login" component={() => <LoginSimple />} />
          <Route path="/admin" component={() => <AdminFinal />} />
          <Route path="/employe" component={() => <AdminFinal />} />

          <Route component={() => <NotFound />} />
        </Switch>
      </div>
    </div>
  );
}

function App() : JSX.Element {
  useEffect(() => {
    // Gestionnaire d'erreurs globales pour les promesses non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Supprimer les logs pour éviter le spam console
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Router />
                <Toaster />
              </div>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

// Define the types
interface DashboardStats {
    totalRevenue: number;
    reservationsCount: number;
    menuItemsCount: number;
    customersCount: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

const fetchStats = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: ApiResponse<DashboardStats> = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };