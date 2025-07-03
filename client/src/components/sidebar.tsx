import { Link, useLocation } from "wouter";
import { Coffee, Calendar, Settings, Home, Menu, X, Sparkles, Book, Info, MessageCircle, Image, Users, Utensils, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/language-selector";

const getSidebarItems = (t: (key: string) => string) => [
  {
    title: t('nav.home'),
    href: "/",
    icon: Home,
  },
  {
    title: t('nav.menu'),
    href: "/menu",
    icon: Book,
  },
  {
    title: t('nav.about'),
    href: "/about",
    icon: Info,
  },
  {
    title: t('nav.contact'),
    href: "/contact",
    icon: MessageCircle,
  },
  {
    title: "Galerie",
    href: "/gallery",
    icon: Image,
  },
  {
    title: t('nav.reservations'),
    href: "/reservation",
    icon: Calendar,
  },
  {
    title: t('nav.admin'),
    href: "/admin",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
    <>
      {/* Bouton hamburger pour ouvrir la barre latérale */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 bg-coffee-dark hover:bg-coffee-accent"
          size="sm"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay pour fermer la barre latérale sur mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Barre latérale */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-coffee-dark text-white shadow-xl z-50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Coffee className="h-8 w-8 text-coffee-accent" />
              <h1 className="text-xl font-bold">Barista Café</h1>
            </div>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-coffee-medium"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              
              if (item.href === "/about") {
                return (
                  <div
                    key={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                      "text-coffee-light hover:bg-coffee-medium hover:text-white"
                    )}
                    onClick={handleAboutClick}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                );
              }

              if (item.href === "/contact") {
                return (
                  <div
                    key={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                      "text-coffee-light hover:bg-coffee-medium hover:text-white"
                    )}
                    onClick={handleContactClick}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                );
              }
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-coffee-accent text-white"
                        : "text-coffee-light hover:bg-coffee-medium hover:text-white"
                    )}
                    onClick={onToggle} // Fermer la barre latérale après navigation
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sélecteur de langue */}
          <div className="mt-8 pt-4 border-t border-coffee-medium">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </>
  );
}