import React from 'react';
import { Link } from "wouter";
import { Coffee, Facebook, Instagram, Twitter, Mail, Phone, MapPin, Clock, Gift } from "lucide-react";

export default function Footer(): JSX.Element {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentYear = new Date().getFullYear();

  // Horaires d'ouverture
  const openingHours = [
    { day: "Lundi - Vendredi", hours: "7h00 - 20h00" },
    { day: "Samedi", hours: "8h00 - 22h00" },
    { day: "Dimanche", hours: "9h00 - 18h00" }
  ];

  return (
    <footer className="bg-coffee-primary text-coffee-cream py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Section À propos */}
          <div className="space-y-4">
            <div className="flex items-center text-2xl font-bold text-coffee-secondary">
              <Coffee className="inline mr-2 h-6 w-6" />
              Barista Café
            </div>
            <p className="text-coffee-cream">
              Votre café de quartier où se mélangent tradition et modernité pour une expérience unique.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com/baristacafe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-coffee-cream hover:text-coffee-accent transition duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/baristacafe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-coffee-cream hover:text-coffee-accent transition duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/baristacafe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-coffee-cream hover:text-coffee-accent transition duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Section Navigation */}
          <div>
            <h4 className="font-semibold text-lg text-coffee-secondary mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => scrollToSection("home")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  aria-label="Aller à la section Accueil"
                >
                  <span className="hover:underline">Accueil</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("menu")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  aria-label="Aller à la section Menu"
                >
                  <span className="hover:underline">Menu</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("about")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  aria-label="Aller à la section À propos"
                >
                  <span className="hover:underline">À propos</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("reservation")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  aria-label="Aller à la section Réservation"
                >
                  <span className="hover:underline">Réservation</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("contact")}
                  className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  aria-label="Aller à la section Contact"
                >
                  <span className="hover:underline">Contact</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Section Services et Horaires */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg text-coffee-secondary mb-4">Services</h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/reservation" 
                    className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  >
                    <span className="hover:underline">Réservation en ligne</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/private-events" 
                    className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  >
                    <span className="hover:underline">Privatisation</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/delivery" 
                    className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  >
                    <span className="hover:underline">Livraison</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/loyalty" 
                    className="text-coffee-cream hover:text-coffee-accent transition duration-300 flex items-center"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    <span className="hover:underline">Carte de fidélité</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg text-coffee-secondary mb-4">Horaires</h4>
              <ul className="space-y-2">
                {openingHours.map((item, index) => (
                  <li key={index} className="flex items-center text-coffee-cream">
                    <Clock className="mr-2 text-coffee-accent h-4 w-4" />
                    <span>{item.day}: {item.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section Contact */}
          <div>
            <h4 className="font-semibold text-lg text-coffee-secondary mb-4">Contact</h4>
            <div className="space-y-3 text-coffee-cream">
              <div className="flex items-start">
                <MapPin className="mr-2 text-coffee-accent h-4 w-4 mt-0.5 flex-shrink-0" />
                <address className="not-italic">
                  123 Rue du Café<br />
                  75000 Paris, France
                </address>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 text-coffee-accent h-4 w-4 flex-shrink-0" />
                <a href="tel:+33123456789" className="hover:text-coffee-accent transition duration-300">
                  01 23 45 67 89
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 text-coffee-accent h-4 w-4 flex-shrink-0" />
                <a href="mailto:contact@barista-cafe.fr" className="hover:text-coffee-accent transition duration-300">
                  contact@barista-cafe.fr
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="font-semibold text-lg text-coffee-secondary mb-3">Newsletter</h4>
              <form className="flex flex-col space-y-2">
                <input 
                  type="email" 
                  placeholder="Votre email" 
                  className="px-3 py-2 rounded text-coffee-dark bg-coffee-cream focus:outline-none focus:ring-2 focus:ring-coffee-accent"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-coffee-accent hover:bg-coffee-secondary text-coffee-dark font-medium py-2 px-4 rounded transition duration-300"
                >
                  S'abonner
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright et mentions légales */}
        <div className="border-t border-coffee-secondary/30 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-4 md:space-y-0">
            <p className="text-sm text-coffee-cream/80">
              &copy; {currentYear} Barista Café. Tous droits réservés.
            </p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-sm text-coffee-cream hover:text-coffee-accent transition duration-300 hover:underline">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="text-sm text-coffee-cream hover:text-coffee-accent transition duration-300 hover:underline">
                Conditions générales
              </Link>
              <Link href="/cookies" className="text-sm text-coffee-cream hover:text-coffee-accent transition duration-300 hover:underline">
                Préférences cookies
              </Link>
            </div>
          </div>
          <p className="text-xs text-coffee-cream/60 text-center mt-4">
            Site développé avec React, TypeScript et Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}