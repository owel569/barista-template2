import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Coffee, 
  Menu, 
  X, 
  Shield, 
  Home, 
  Utensils, 
  CalendarDays, 
  MapPin, 
  Mail,
  User,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoBaristaCafe from "@/assets/logo-barista-cafe.png";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  isExternal?: boolean;
  requiresAuth?: boolean;
}

export default function Navigation(): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { items } = useCart();

  // Configuration des éléments de navigation
  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: "menu",
      label: "Menu",
      href: "/menu",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      id: "reservation",
      label: "Réservation",
      href: "/reservation",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      id: "map",
      label: "Localisation",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: "gallery",
      label: "Galerie",
      href: "/gallery",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: "contact",
      label: "Contact",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const adminItem: NavItem = {
    id: "admin",
    label: "Admin",
    href: "/admin/login",
    icon: <Shield className="h-5 w-5" />,
    requiresAuth: false
  };

  const cartItem: NavItem = {
    id: "cart",
    label: "Panier",
    href: "/cart",
    icon: <ShoppingCart className="h-5 w-5" />,
  };

  // Effet pour détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    if (location !== "/") {
      // Si on n'est pas sur la page d'accueil, naviguer vers l'accueil avec le hash
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavAction = (item: NavItem) => {
    if (item.href) {
      // Les liens normaux sont gérés par le composant Link
      return;
    }
    scrollToSection(item.id);
  };

  const getCartItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const isActiveSection = (sectionId: string) => {
    if (location === "/" && typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash === sectionId;
    }
    return false;
  };

  return (
    <nav 
      className={cn(
        "bg-coffee-dark text-white sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "shadow-xl py-2" : "py-4",
        "backdrop-blur-sm bg-coffee-dark/95"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center text-2xl font-bold text-coffee-secondary cursor-pointer group">
              <img 
                src={logoBaristaCafe} 
                alt="Barista Café Logo" 
                className="h-10 w-10 mr-3 transition-transform group-hover:scale-105" 
              />
              <span className="hidden sm:inline">Barista Café</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              item.href ? (
                <Link href={item.href} key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-white hover:bg-coffee-darker hover:text-coffee-secondary px-4",
                      location === item.href && "bg-coffee-darker text-coffee-secondary"
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleNavAction(item)}
                  className={cn(
                    "text-white hover:bg-coffee-darker hover:text-coffee-secondary px-4",
                    isActiveSection(item.id) && "bg-coffee-darker text-coffee-secondary"
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              )
            ))}

            {/* Panier */}
            <Link href={cartItem.href!}>
              <Button
                variant="ghost"
                className="text-white hover:bg-coffee-darker hover:text-coffee-secondary px-4 relative"
              >
                {cartItem.icon}
                <span className="ml-2">{cartItem.label}</span>
                {getCartItemsCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-coffee-accent text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                    {getCartItemsCount()}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Admin Button */}
            <Link href={adminItem.href!}>
              <Button
                variant="outline"
                className="text-coffee-accent border-coffee-accent hover:bg-coffee-accent hover:text-white ml-2"
              >
                {adminItem.icon}
                <span className="ml-2">{adminItem.label}</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Panier mobile */}
            <Link href={cartItem.href!}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-coffee-darker relative"
              >
                {cartItem.icon}
                {getCartItemsCount() > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-coffee-accent text-white text-xs min-w-4 h-4 flex items-center justify-center rounded-full">
                    {getCartItemsCount()}
                  </Badge>
                )}
              </Button>
            </Link>

            <button
              className="p-2 rounded-md text-white hover:bg-coffee-darker focus:outline-none focus:ring-2 focus:ring-coffee-secondary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-screen mt-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-2 pb-4">
            {[...navItems, cartItem, adminItem].map((item) => (
              item.href ? (
                <Link href={item.href} key={item.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-coffee-darker hover:text-coffee-secondary px-4 py-3"
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                    {item.id === 'cart' && getCartItemsCount() > 0 && (
                      <Badge className="ml-auto bg-coffee-accent text-white">
                        {getCartItemsCount()}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleNavAction(item)}
                  className="w-full justify-start text-white hover:bg-coffee-darker hover:text-coffee-secondary px-4 py-3"
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Button>
              )
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}