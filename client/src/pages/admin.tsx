import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import EnhancedAdminDashboard from "@/components/enhanced-admin-dashboard";
import { Coffee } from "lucide-react";

export default function Admin() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-light">
        <div className="text-center">
          <Coffee className="h-12 w-12 text-coffee-accent animate-pulse mx-auto mb-4" />
          <p className="text-coffee-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-light">
      <Navigation />
      <EnhancedAdminDashboard />
    </div>
  );
}
