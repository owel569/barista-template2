import React from 'react';
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GreenBlackHome() : JSX.Element {
  const [currentSlide, setCurrentSlide] = useState(0);

  const menuCategories = [
    {
      id: 1,
      name: "Petit Déjeuner",
      image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Commencez votre journée avec nos délicieux petits déjeuners"
    },
    {
      id: 2,
      name: "Cafés Premium",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Sélection de cafés d'exception torréfiés avec soin"
    },
    {
      id: 3,
      name: "Pâtisseries",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Pâtisseries artisanales préparées quotidiennement"
    },
    {
      id: 4,
      name: "Déjeuner & Dîner",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Plats savoureux dans une ambiance chaleureuse"
    },
    {
      id: 5,
      name: "Boissons Fraîches",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Jus frais, smoothies et boissons rafraîchissantes"
    },
    {
      id: 6,
      name: "Desserts",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Desserts gourmands pour finir en beauté"
    }
  ];

  const testimonials = [
    {
      text: "Endroit très sympa et surtout personnels aux petits soins.",
      author: "Sarah M."
    },
    {
      text: "Un endroit hyper agréable, un service irréprochable, souriant, des plats diversifiés... une vue magnifique où tu peux passer des moments bien cosy.",
      author: "Ahmed K."
    },
    {
      text: "Accueil d'une gentillesse exceptionnelle, et tout empreint de discrétion et d'efficacité. Vaste choix et qualité des produits.",
      author: "Fatima L."
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(menuCategories.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(menuCategories.length / 3)) % Math.ceil(menuCategories.length / 3));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="bg-black/90 backdrop-blur-sm fixed w-full z-50 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-white font-bold text-xl">BARISTA CAFÉ</div>
            <div className="hidden md:flex space-x-6 text-sm text-gray-300">
              <a href="#accueil" className="hover:text-amber-400 transition-colors">ACCUEIL</a>
              <a href="#apropos" className="hover:text-amber-400 transition-colors">À PROPOS</a>
              <a href="#menu" className="hover:text-amber-400 transition-colors">MENU</a>
              <a href="#photos" className="hover:text-amber-400 transition-colors">PHOTOS</a>
              <a href="#contact" className="hover:text-amber-400 transition-colors">CONTACT</a>
              <a href="#avis" className="hover:text-amber-400 transition-colors">AVIS</a>
              <a href="/reservation" className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded text-white transition-colors">RÉSERVER</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="accueil" className="relative h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
               style={{
                 backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
               }}>
        <div className="text-center text-white px-6">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">BC</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-light mb-6 tracking-wider">
            Le Café-Restaurant
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Votre nouvelle adresse gourmande à découvrir
          </p>
          <Button 
            size="lg" 
            className="bg-transparent border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white px-8 py-4 text-lg tracking-wider transition-all duration-300"
          >
            DÉCOUVRIR MENU
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section id="apropos" className="py-20 bg-cover bg-center relative"
               style={{
                 backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
               }}>
        <div className="max-w-6xl mx-auto px-6 text-white">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light mb-8">Ambiance cosy, cadre raffiné et vue panoramique.</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Accueil d'une gentillesse exceptionnelle, et tout empreint de discrétion et d'efficacité. 
              Vaste choix et qualité des produits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-600/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">☕</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Café & Restaurant</h3>
              <p className="text-gray-300 leading-relaxed">
                Plus qu'un lieu de restauration, Barista Café est un lieu de l'art de l'épuré dans l'assiette.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-600/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🍽️</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Cuisine Moderne</h3>
              <p className="text-gray-300 leading-relaxed">
                Au Café-Restaurant Barista, la qualité et le bon goût sont toujours au menu.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-600/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🌅</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Ambiance Unique</h3>
              <p className="text-gray-300 leading-relaxed">
                Barista vous accueille tous les jours, midi et soir, dans un cadre exceptionnel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Carousel */}
      <section id="menu" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-white mb-8">Notre Menu</h2>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100)}%)` }}
              >
                {Array.from({ length: Math.ceil(menuCategories.length / 3)}) }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid md:grid-cols-3 gap-8 px-4">
                      {menuCategories.slice(slideIndex * 3, slideIndex * 3 + 3).map((category) => (
                        <Card key={category.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:scale-105 transition-transform duration-300">
                          <div 
                            className="h-48 bg-cover bg-center relative"
                            style={{ backgroundImage: `url(${category.image)})` }}
                          >
                            <div className="absolute inset-0 bg-black/40"></div>
                          </div>
                          <CardContent className="p-6 text-center">
                            <h3 className="text-xl font-semibold text-white mb-3">{category.name}</h3>
                            <p className="text-gray-400 text-sm">{category.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 border-gray-600 text-white hover:bg-amber-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 border-gray-600 text-white hover:bg-amber-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(menuCategories.length / 3)}) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-amber-600' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="avis" className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700 p-6">
                <CardContent className="p-0">
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-300 italic mb-4 text-sm leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                  <cite className="text-amber-400 font-semibold">— {testimonial.author}</cite>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-light mb-12">Barista Café-Restaurant</h2>
          <p className="text-xl text-gray-300 mb-12">Votre nouvelle adresse gourmande à découvrir</p>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <MapPin className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="font-semibold mb-2">Adresse</h3>
              <p className="text-gray-400 text-sm">123 Rue du Café<br />Casablanca, Maroc</p>
            </div>
            <div className="flex flex-col items-center">
              <Phone className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="font-semibold mb-2">Téléphone</h3>
              <p className="text-gray-400 text-sm">+212 522 123 456</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="font-semibold mb-2">Horaires</h3>
              <p className="text-gray-400 text-sm">Tous les jours<br />8h00 - 23h00</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}