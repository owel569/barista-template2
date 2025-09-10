import React from 'react';
import Hero from '@/components/hero';
import Reservation from '@/components/reservation';
import About from '@/components/about';
import Contact from '@/components/contact';
import Footer from '@/components/footer';
import Navigation from '@/components/navigation';
import { Link } from 'wouter';
import { Coffee, MapPin, Phone, Clock, Star, ChefHat, Users, Calendar, Camera } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      {/* Section Menu avec lien vers la page complète */}
      <section id="menu" className="py-16 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8 text-coffee-dark">Découvrez Notre Menu</h2>
          <p className="text-center text-lg text-coffee-dark mb-12 max-w-3xl mx-auto">
            Laissez-vous tenter par nos spécialités, préparées avec passion et les meilleurs ingrédients. Un voyage culinaire vous attend.
          </p>
          {/* Ici, vous pourriez afficher quelques éléments du menu ou un aperçu */}
          <div className="text-center">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-coffee-accent hover:bg-coffee-secondary text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Voir le Menu Complet
              <ChefHat className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <Reservation /> {/* La composante Reservation gère déjà son propre contenu */}

      {/* Section À Propos */}
      <About />

      {/* Section Galerie */}
      <section id="gallery" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8 text-coffee-dark">Galerie</h2>
          <p className="text-center text-lg text-coffee-dark mb-12 max-w-3xl mx-auto">
            Plongez dans l'atmosphère chaleureuse de notre établissement et admirez nos créations.
          </p>
          {/* Contenu de la galerie - pourrait être un carrousel ou une grille d'images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                <img src={`/images/gallery-${i + 1}.jpg`} alt={`Galerie ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-12">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 bg-coffee-primary hover:bg-coffee-accent text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
            >
              Voir Plus de Photos
              <Camera className="h-5 w-5" />
            </Link>
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-coffee-accent hover:bg-coffee-secondary text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
            >
              Réserver une Table
              <Calendar className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
    </div>
  );
}