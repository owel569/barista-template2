import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { UserProvider } from "@/hooks/use-user";
import { LanguageProvider } from "./contexts/LanguageContext";
import Sidebar from "@/components/sidebar";
import Home from "@/pages/home";
import LoginSimple from "@/pages/login-simple";
import Register from "@/pages/register";
import InteractiveReservation from "@/components/interactive-reservation";
import AdminSimple from "@/pages/admin-simple";

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
          <Route path="/admin*" component={AdminSimple} />
          <Route path="/employe*" component={AdminSimple} />

          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
