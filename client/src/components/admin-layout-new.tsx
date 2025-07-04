import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import AdminSidebarNew from "./admin-sidebar-new";
import { UserRole } from "@/lib/permissions";

// Import des composants de contenu
import DashboardMain from "./dashboard-main";
import ReservationManagementComplete from "./reservation-management-complete";
import OrderManagementComplete from "./order-management-complete";
import CustomerManagementComplete from "./customer-management-complete";
import EmployeeManagementComplete from "./employee-management-complete";
import MenuManagementComplete from "./menu-management-complete";
import ContactManagement from "./contact-management";
import SettingsManagement from "./settings-management";
import ReportsManagement from "./reports-management";
import LogsManagement from "./logs-management";

interface AdminLayoutNewProps {
  userRole: UserRole;
  user: any;
}

export default function AdminLayoutNew({ userRole, user }: AdminLayoutNewProps) {
  const [location, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Récupérer le module actuel depuis l'URL
  const currentModule = location.split('/')[2] || 'dashboard';

  // Gestion du mode sombre
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("darkMode");
    navigate("/login");
  };

  // Fonction pour rendre le contenu selon le module actuel
  const renderMainContent = () => {
    switch (currentModule) {
      case "dashboard":
        return <DashboardMain userRole={userRole} />;
      case "reservations":
        return <ReservationManagementComplete userRole={userRole} />;
      case "orders":
        return <OrderManagementComplete userRole={userRole} />;
      case "customers":
        return <CustomerManagementComplete userRole={userRole} />;
      case "employees":
        return <EmployeeManagementComplete userRole={userRole} />;
      case "menu":
        return <MenuManagementComplete userRole={userRole} />;
      case "messages":
        return <ContactManagement userRole={userRole} />;
      case "settings":
        return <SettingsManagement userRole={userRole} />;
      case "reports":
        return <ReportsManagement userRole={userRole} />;
      case "logs":
        return <LogsManagement userRole={userRole} />;
      default:
        return <DashboardMain userRole={userRole} />;
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode ? "dark bg-gray-900" : "bg-gray-50"
    )}>
      {/* Sidebar */}
      <AdminSidebarNew
        userRole={userRole}
        user={user}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Contenu principal */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        {/* Header */}
        <header className={cn(
          "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
          "px-6 py-4 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <span className="text-gray-500 dark:text-gray-400">Administration</span>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium capitalize">
                        {currentModule === "dashboard" ? "Tableau de bord" : 
                         currentModule === "reservations" ? "Réservations" :
                         currentModule === "orders" ? "Commandes" :
                         currentModule === "customers" ? "Clients" :
                         currentModule === "employees" ? "Employés" :
                         currentModule === "menu" ? "Menu" :
                         currentModule === "messages" ? "Messages" :
                         currentModule === "settings" ? "Paramètres" :
                         currentModule === "reports" ? "Rapports" :
                         currentModule === "logs" ? "Historique" :
                         currentModule}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Connecté en tant que:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username} ({userRole === "directeur" ? "Directeur" : userRole === "employe" ? "Employé" : "Admin"})
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}