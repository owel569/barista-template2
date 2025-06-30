import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  const [location] = useLocation();
  const showSidebar = !['/login', '/register'].includes(location);

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}>
        <Switch>
          <Route path="/" component={Home} />
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
