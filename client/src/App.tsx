import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { UserProvider } from "@/hooks/use-user";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "@/components/sidebar";
import Home from "@/pages/home";
import LoginSimple from "@/pages/LoginSimple";
import Register from "@/pages/register";
import InteractiveReservation from "@/components/interactive-reservation";
import AdminHorizontal from "@/pages/admin-horizontal";
import AdminSimple from "@/pages/AdminSimple";
import AdminComplete from "@/pages/AdminComplete";
import AdminFinal from "@/pages/AdminFinal";

import NotFound from "@/pages/not-found";
import MenuPage from "@/components/menu-page";
import About from "@/components/about";
import Contact from "@/components/contact";
import Gallery from "@/components/gallery";

function Router() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = !['/login', '/register', '/admin', '/employe'].includes(location) && !location.startsWith('/admin/');

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
          <Route path="/" component={Home} />
          <Route path="/menu" component={MenuPage} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/login" component={LoginSimple} />
          <Route path="/register" component={Register} />
          <Route path="/reservation" component={InteractiveReservation} />
          <Route path="/admin/login" component={LoginSimple} />
          <Route path="/admin" component={AdminFinal} />
          <Route path="/admin/:section" component={AdminFinal} />
          <Route path="/employe" component={AdminFinal} />
          <Route path="/employe/:section" component={AdminFinal} />

          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Gestionnaire d'erreurs globales pour les promesses non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Empêcher l'erreur de se propager
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
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
