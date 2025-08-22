import React from 'react';
import { Coffee, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-amber-400" />
              <span className="text-xl font-bold">Barista Café</span>
            </div>
            <p className="text-gray-400">
              Votre système de gestion de restaurant professionnel pour une expérience optimale.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Accueil</a></li>
              <li><a href="/menu" className="text-gray-400 hover:text-white transition-colors">Menu</a></li>
              <li><a href="/reservations" className="text-gray-400 hover:text-white transition-colors">Réservations</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Gestion Menu</li>
              <li className="text-gray-400">Réservations en ligne</li>
              <li className="text-gray-400">Commandes</li>
              <li className="text-gray-400">Programme de fidélité</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="text-gray-400">123 Rue du Café, Paris</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-amber-400" />
                <span className="text-gray-400">+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-amber-400" />
                <span className="text-gray-400">contact@barista-cafe.fr</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Barista Café. Tous droits réservés. Système de gestion professionnel.
          </p>
        </div>
      </div>
    </footer>
  );
}