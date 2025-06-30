import { Link, useLocation } from "wouter";
import { Coffee, Calendar, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Accueil",
    href: "/",
    icon: Home,
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

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-coffee-dark text-white shadow-xl z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Coffee className="h-8 w-8 text-coffee-accent" />
          <h1 className="text-xl font-bold">Barista Café</h1>
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
  );
}