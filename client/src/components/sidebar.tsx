import { Link, useLocation } from "wouter";
import { Coffee, Calendar, Settings, Home, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  {
    title: "Accueil",
    href: "/",
    icon: Home,
  },
  {
    title: "Style Green Black",
    href: "/green-black",
    icon: Sparkles,
  },
  {
    title: "Réservation",
    href: "/reservation",
    icon: Calendar,
  },
  {
    title: "Administration",
    href: "/admin",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();

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
        </div>
      </div>
    </>
  );
}