import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, Star, Clock, MapPin } from 'lucide-react';
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Utensils } from "lucide-react";

// Import du logo avec gestion d'erreur
const logoBaristaCafe = "/logo-barista-cafe.png";

export default function Hero() : JSX.Element {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      />
      <div className="absolute inset-0 bg-coffee-dark bg-opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              {t('home.title')}
              <span className="block text-coffee-accent">Barista Café</span>
            </h1>
            <p className="text-lg md:text-xl text-white max-w-3xl mx-auto">
              {t('home.description')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setLocation("/reservation")}
              className="bg-coffee-accent hover:bg-opacity-90 text-white px-8 py-3 text-lg font-semibold transition duration-300 transform hover:scale-105"
            >
              <Calendar className="mr-2 h-5 w-5" />
              {t('home.cta.reserve')}
            </Button>
            <Button
              onClick={() => scrollToSection("menu")}
              variant="outline"
              className="border-2 border-white hover:bg-white hover:text-coffee-dark text-white px-8 py-3 text-lg font-semibold transition duration-300"
            >
              <Utensils className="mr-2 h-5 w-5" />
              {t('home.cta.menu')}
            </Button>
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualité Premium</h3>
                <p className="text-gray-600">
                  Grains de café sélectionnés avec soin et torréfiés artisanalement pour une saveur incomparable.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Rapide</h3>
                <p className="text-gray-600">
                  Commande en ligne, préparation express et service efficace pour votre confort.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ambiance Unique</h3>
                <p className="text-gray-600">
                  Un cadre moderne et chaleureux, parfait pour vos moments de détente ou de travail.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-amber-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-amber-600 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}