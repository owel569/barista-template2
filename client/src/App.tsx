import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import Sidebar from "@/components/sidebar";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import InteractiveReservation from "@/components/interactive-reservation";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import MenuPage from "@/components/menu-page";
import About from "@/components/about";
import Contact from "@/components/contact";
import Gallery from "@/components/gallery";

function Router() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = !['/login', '/register'].includes(location);

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
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/reservation" component={InteractiveReservation} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
