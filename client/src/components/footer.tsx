import React from 'react';
import { Link } from "wouter";
import { Coffee, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() : JSX.Element {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-coffee-primary text-coffee-cream py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-coffee-secondary mb-4">
              <Coffee className="inline mr-2 h-6 w-6" />
              Barista Café
            </div>
            <p className="text-coffee-cream mb-4">
              Votre café de quartier où se mélangent tradition et modernité pour une expérience unique.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-coffee-secondary mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToSection("home")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("menu")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300"
                >
                  Menu
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("reservation")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300"
                >
                  Réservation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("contact")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-coffee-secondary mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                  Réservation en ligne
                </a>
              </li>
              <li>
                <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                  Privatisation
                </a>
              </li>
              <li>
                <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                  Livraison
                </a>
              </li>
              <li>
                <a href="#" className="text-coffee-cream hover:text-coffee-accent transition duration-300">
                  Carte de fidélité
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-coffee-secondary mb-4">Contact</h4>
            <div className="space-y-2 text-coffee-cream">
              <p className="flex items-center">
                <MapPin className="mr-2 text-coffee-accent h-4 w-4" />
                123 Rue du Café, Paris
              </p>
              <p className="flex items-center">
                <Phone className="mr-2 text-coffee-accent h-4 w-4" />
                01 23 45 67 89
              </p>
              <p className="flex items-center">
                <Mail className="mr-2 text-coffee-accent h-4 w-4" />
                contact@barista-cafe.fr
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-coffee-secondary mt-8 pt-8 text-center text-coffee-cream">
          <p>&copy; 2024 Barista Café. Tous droits réservés. | Développé avec React et PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
