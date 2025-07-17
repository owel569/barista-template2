import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Coffee } from "lucide-react";
import { useLocation } from "wouter";
import { getItemImageUrl } from "@/lib/image-mapping";

export default function HomeMenuPreview() {
  const [, setLocation] = useLocation();
  
  const { data: menuResponse } = useQuery({
    queryKey: ['/api/menu/items'],
  });

  // Sélectionner 3 articles populaires pour l'aperçu
  const menuItems = menuResponse?.items || [];
  const featuredItems = Array.isArray(menuItems) ? menuItems.slice(0, 3) : [];

  return (
    <section className="py-20 bg-gradient-to-b from-coffee-light to-amber-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">
            Notre Menu
          </h2>
          <p className="text-lg text-coffee-medium max-w-2xl mx-auto">
            Découvrez notre sélection de cafés d'exception, pâtisseries artisanales et plats savoureux
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {featuredItems.map((item: any) => (
            <Card key={item.id} className="bg-white/90 backdrop-blur-sm border-coffee-light/30 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img 
                    src={getItemImageUrl(item.name, item.category?.slug || item.category?.name?.toLowerCase() || 'default')}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      try {
                        (e.target as HTMLImageElement).src = getItemImageUrl('default', 'default');
                      } catch (error) {
                        console.warn('Erreur lors du chargement de l\'image de fallback:', error);
                      }
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-coffee-dark mb-2">{item.name}</h3>
                  <p className="text-coffee-medium text-sm mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-coffee-accent">{item.price}€</span>
                    <Coffee className="h-5 w-5 text-coffee-medium" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => setLocation("/menu")}
            className="bg-coffee-accent hover:bg-coffee-dark text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Voir le menu complet
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}