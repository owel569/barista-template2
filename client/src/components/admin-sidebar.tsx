import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Calendar, 
  ShoppingCart, 
  Users, 
  UserCheck, 
  Menu as MenuIcon, 
  MessageSquare,
  X,
  LogOut,
  Coffee
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/language-selector";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const getAdminMenuItems = (t: (key: string) => string) => [
  {
    id: "dashboard",
    title: t('admin.dashboard'),
    icon: BarChart3,
  },
  {
    id: "reservations",
    title: t('admin.reservations'),
    icon: Calendar,
  },
  {
    id: "orders",
    title: t('admin.orders'),
    icon: ShoppingCart,
  },
  {
    id: "customers",
    title: t('admin.customers'),
    icon: Users,
  },
  {
    id: "employees",
    title: t('admin.employees'),
    icon: UserCheck,
  },
  {
    id: "menu",
    title: t('admin.menu'),
    icon: MenuIcon,
  },
  {
    id: "contacts",
    title: t('admin.contacts'),
    icon: MessageSquare,
  },
];

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const menuItems = getAdminMenuItems(t);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Bouton hamburger pour ouvrir la barre latérale */}
      {!isOpen && (
        <Button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 bg-coffee-dark hover:bg-coffee-accent"
          size="sm"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay pour fermer la barre latérale sur mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Barre latérale admin */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-coffee-dark text-white shadow-xl z-50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Coffee className="h-8 w-8 text-coffee-accent" />
              <div>
                <h1 className="text-xl font-bold">Barista Café</h1>
                <p className="text-sm text-coffee-light">{t('admin.dashboard')}</p>
              </div>
            </div>
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-coffee-medium"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsOpen(false); // Fermer la barre sur mobile après sélection
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-coffee-accent text-white"
                      : "text-coffee-light hover:bg-coffee-medium hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Sélecteur de langue */}
          <div className="mt-8 pt-4 border-t border-coffee-medium">
            <LanguageSelector />
          </div>

          {/* Bouton de déconnexion */}
          <div className="mt-6">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-coffee-light hover:bg-coffee-medium hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              {t('admin.logout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal avec marge pour la sidebar */}
      <div className={cn(
        "transition-all duration-300",
        isOpen ? "lg:ml-72" : ""
      )}>
        {/* Ce div sera utilisé pour positionner le contenu */}
      </div>
    </>
  );
}