import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import Navigation from "@/components/navigation";
import AdminDashboardMain from "@/components/admin-dashboard-main";
import { Coffee } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-light">
        <div className="text-center">
          <Coffee className="h-12 w-12 text-coffee-accent animate-pulse mx-auto mb-4" />
          <p className="text-coffee-dark">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-light">
      <Navigation />
      <AdminDashboardMain />
    </div>
  );
}
