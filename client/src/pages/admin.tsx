import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import AdminSidebar from "@/components/admin-sidebar";
import DashboardCharts from "@/components/dashboard-charts";
import SimpleOrderManagement from "@/components/simple-order-management";
import CustomerManagement from "@/components/customer-management";
import EmployeeManagement from "@/components/employee-management";
import MenuManagement from "@/components/menu-management";
import ContactManagement from "@/components/contact-management";
import AdminDashboard from "@/components/admin-dashboard";
import { Coffee } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const { isAuthenticated, loading, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "reservations":
        return <AdminDashboard />;
      case "orders":
        return <SimpleOrderManagement />;
      case "customers":
        return <CustomerManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "menu":
        return <MenuManagement />;
      case "contacts":
        return <ContactManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-coffee-light flex">
      <AdminSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
      />
      <div className="flex-1 p-6">
        {renderActiveContent()}
      </div>
    </div>
  );
}
