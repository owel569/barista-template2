import React from 'react';
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Coffee, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoBaristaCafe from "@/assets/logo-barista-cafe.png";

export default function Navigation() : JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const scrollToSection = (sectionId: string) => {
    if (location !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-coffee-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center text-2xl font-bold text-coffee-secondary cursor-pointer">
              <img src={logoBaristaCafe} alt="Barista Café Logo" className="h-12 w-12 mr-3" />
              Barista Café
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection("home")}
              className="hover:text-coffee-secondary transition duration-300"
            >
              Accueil
            </button>
            <button
              onClick={() => scrollToSection("menu")}
              className="hover:text-coffee-secondary transition duration-300"
            >
              Menu
            </button>
            <Link href="/reservation">
              <button
                className="hover:text-coffee-secondary transition duration-300"
              >
                Réservation
              </button>
            </Link>
            <button
              onClick={() => scrollToSection("map")}
              className="hover:text-coffee-secondary transition duration-300"
            >
              Localisation
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-coffee-secondary transition duration-300"
            >
              Contact
            </button>
            <Link href="/admin/login">
              <Button
                variant="ghost"
                className="hover:text-coffee-accent transition duration-300"
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection("home")}
                className="text-left hover:text-coffee-secondary transition duration-300"
              >
                Accueil
              </button>
              <button
                onClick={() => scrollToSection("menu")}
                className="text-left hover:text-coffee-secondary transition duration-300"
              >
                Menu
              </button>
              <button
                onClick={() => scrollToSection("reservation")}
                className="text-left hover:text-coffee-secondary transition duration-300"
              >
                Réservation
              </button>
              <button
                onClick={() => scrollToSection("map")}
                className="text-left hover:text-coffee-secondary transition duration-300"
              >
                Localisation
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left hover:text-coffee-secondary transition duration-300"
              >
                Contact
              </button>
              <Link href="/admin/login">
                <button className="text-left hover:text-coffee-accent transition duration-300">
                  <Shield className="h-4 w-4 mr-1 inline" />
                  Admin
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
