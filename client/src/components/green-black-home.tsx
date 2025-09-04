import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Star, Clock, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string | undefined }>;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <Card className="bg-white/10 backdrop-blur-sm border-green-400/20 hover:border-green-400/40 transition-all">
    <CardHeader className="text-center">
      <Icon className="w-12 h-12 mx-auto text-green-400 mb-2" />
      <CardTitle className="text-white text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-green-100 text-center text-sm">{description}</p>
    </CardContent>
  </Card>
);

interface MenuItemPreviewProps {
  name: string;
  description: string;
  price: number;
  image: string;
  isPopular?: boolean;
}

const MenuItemPreview: React.FC<MenuItemPreviewProps> = ({ 
  name, 
  description, 
  price, 
  image, 
  isPopular = false 
}) => (
  <Card className="bg-black/40 backdrop-blur-sm border-green-400/20 overflow-hidden">
    {isPopular && (
      <Badge className="absolute top-2 right-2 bg-yellow-500 text-black z-10">
        <Star className="w-3 h-3 mr-1" />
        Populaire
      </Badge>
    )}
    <div className="aspect-video overflow-hidden">
      <img 
        src={image} 
        alt={name}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
      />
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-white text-lg">{name}</CardTitle>
      <p className="text-green-100 text-sm">{description}</p>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="text-green-400 border-green-400">
          {price.toFixed(2)}€
        </Badge>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          Commander
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const GreenBlackHome: React.FC = () => {
  const popularItems = [
    {
      name: "Café Signature",
      description: "Notre mélange exclusif avec notes de caramel",
      price: 4.50,
      image: "/api/placeholder/300/200"
    },
    {
      name: "Croissant Artisanal",
      description: "Croissant frais fait maison chaque matin",
      price: 2.80,
      image: "/api/placeholder/300/200"
    },
    {
      name: "Smoothie Vert",
      description: "Épinards, pomme, banane et gingembre",
      price: 5.20,
      image: "/api/placeholder/300/200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-900 to-black">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Barista
            <span className="text-green-400 block">Café</span>
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-2xl mx-auto">
            L'expérience café ultime avec une technologie de pointe et un service exceptionnel
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
              <Coffee className="w-5 h-5 mr-2" />
              Commander Maintenant
            </Button>
            <Button size="lg" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black px-8 py-3">
              Réserver une Table
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Pourquoi Choisir Barista Café ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Coffee}
              title="Café Premium"
              description="Grains sélectionnés et torréfiés artisanalement pour une qualité exceptionnelle"
            />
            <FeatureCard
              icon={Clock}
              title="Service Rapide"
              description="Technologie de pointe pour des commandes ultra-rapides et un service efficace"
            />
            <FeatureCard
              icon={Star}
              title="Expérience Unique"
              description="Ambiance moderne avec un système de fidélité innovant et des récompenses exclusives"
            />
          </div>
        </div>
      </section>

      {/* Popular Menu Items */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Nos Spécialités
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularItems.map((item, index) => (
              <MenuItemPreview
                key={index}
                {...item}
                isPopular={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Venez Nous Rendre Visite
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-black/40 backdrop-blur-sm border-green-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-400" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-100 text-center">
                <p>123 Rue du Café</p>
                <p>75001 Paris, France</p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 backdrop-blur-sm border-green-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-center">
                  <Clock className="w-5 h-5 mr-2 text-green-400" />
                  Horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-100 text-center">
                <p>Lun-Ven: 7h00 - 19h00</p>
                <p>Sam-Dim: 8h00 - 20h00</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <Button variant="outline" size="sm" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
              <Phone className="w-4 h-4 mr-2" />
              01 23 45 67 89
            </Button>
            <Button variant="outline" size="sm" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
              <Mail className="w-4 h-4 mr-2" />
              contact@barista-cafe.fr
            </Button>
          </div>
          
          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
              <Instagram className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
              <Facebook className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-green-400/20">
        <div className="max-w-6xl mx-auto text-center text-green-100">
          <p>&copy; 2024 Barista Café. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default GreenBlackHome;