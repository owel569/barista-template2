import React from "react";
import { Link, useLocation } from "wouter";
import { Coffee, Calendar, Settings, Home, Menu, X, Sparkles, Book, Info, MessageCircle, Image, Users, Utensils, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/language-selector";
// import logoBaristaCafe from "@/assets/logo-barista-cafe.png";

const getSidebarItems = (t: (key: string) => string) => [
  {
    title: t("nav.home"),
    href: "/",
    icon: Home,
  },
  {
    title: t("nav.menu"),
    href: "/menu",
    icon: Book,
  },
  {
    title: t("nav.about"),
    href: "/about",
    icon: Info,
  },
  {
    title: t("nav.contact"),
    href: "/contact",
    icon: MessageCircle,
  },
  {
    title: "Galerie",
    href: "/gallery",
    icon: Image,
  },
  {
    title: t("nav.reservations"),
    href: "/reservation",
    icon: Calendar,
  },
  {
    title: t("nav.admin"),
    href: "/admin",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const sidebarItems = getSidebarItems(t);

  const handleAboutClick = () => {
    if (location === "/") {
      // Si on est sur la page d'accueil, faire défiler vers la section À propos
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Sinon, aller à la page d'accueil et défiler vers À propos
      setLocation("/");
      setTimeout(() => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
    onToggle();
  };

  const handleContactClick = () => {
    if (location === "/") {
      // Si on est sur la page d'accueil, faire défiler vers la section Contact
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Sinon, aller à la page d'accueil et défiler vers Contact
      setLocation("/");
      setTimeout(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
    onToggle();
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Coffee className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-800">
              Barista Café
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            if (item.href === "/about") {
              return (
                <button
                  key={item.href}
                  onClick={handleAboutClick}
                  className={cn(
                    "flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              );
            }

            if (item.href === "/contact") {
              return (
                <button
                  key={item.href}
                  onClick={handleContactClick}
                  className={cn(
                    "flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={onToggle}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;