import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Image, Camera, MapPin, Clock, Users } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

// Données d'exemple pour la galerie - en production, ces données viendraient d'une API
const galleryImages: GalleryImage[] = [
  {
    id: 1,
    title: "Ambiance chaleureuse",
    description: "Notre salle principale avec vue panoramique",
    category: "intérieur",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3EIntérieur Chaleureux%3C/text%3E%3C/svg%3E"
  },
  {
    id: 2,
    title: "Terrasse vue mer",
    description: "Notre magnifique terrasse avec vue sur l'océan",
    category: "extérieur",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%2306b6d4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3ETerrasse Vue Mer%3C/text%3E%3C/svg%3E"
  },
  {
    id: 3,
    title: "Pizza artisanale",
    description: "Nos pizzas cuites au feu de bois",
    category: "plats",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23dc2626'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3EPizza Artisanale%3C/text%3E%3C/svg%3E"
  },
  {
    id: 4,
    title: "Café signature",
    description: "Notre mélange exclusif de café arabica",
    category: "boissons",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%2392400e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3ECafé Signature%3C/text%3E%3C/svg%3E"
  },
  {
    id: 5,
    title: "Pâtes fraîches",
    description: "Pâtes maison préparées quotidiennement",
    category: "plats",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%2365a30d'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3EPâtes Fraîches%3C/text%3E%3C/svg%3E"
  },
  {
    id: 6,
    title: "Bar à jus",
    description: "Jus frais et smoothies naturels",
    category: "boissons",
    imageUrl: "data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3EBar à Jus%3C/text%3E%3C/svg%3E"
  }
];

const categories = [
  { id: "all", name: "Tout", count: galleryImages.length },
  { id: "intérieur", name: "Intérieur", count: galleryImages.filter(img => img.category === "intérieur").length },
  { id: "extérieur", name: "Extérieur", count: galleryImages.filter(img => img.category === "extérieur").length },
  { id: "plats", name: "Nos Plats", count: galleryImages.filter(img => img.category === "plats").length },
  { id: "boissons", name: "Boissons", count: galleryImages.filter(img => img.category === "boissons").length }
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Galerie Photos</h1>
          <p className="text-xl md:text-2xl text-amber-100 max-w-2xl mx-auto">
            Découvrez l'ambiance unique de notre café-restaurant
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="mb-2"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredImages.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-0">
                    <div className="relative group">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-white font-semibold text-lg">{image.title}</h3>
                        <p className="text-amber-200 text-sm">{image.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="relative">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-amber-800">{image.title}</h3>
                    <p className="text-amber-600 mt-2">{image.description}</p>
                    <Badge className="mt-3" variant="outline">
                      {image.category}
                    </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Emplacement</h3>
              <p className="text-amber-600">
                Marina Shopping Center<br />
                Boulevard des Almohades<br />
                Casablanca, Maroc
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Horaires</h3>
              <p className="text-amber-600">
                Lun - Ven : 7h00 - 22h00<br />
                Sam - Dim : 8h00 - 23h00<br />
                Service continu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Capacité</h3>
              <p className="text-amber-600">
                80 places assises<br />
                Terrasse 40 places<br />
                Réservations acceptées
              </p>
            </CardContent>
          </Card>
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-700 mb-2">
              Aucune image dans cette catégorie
            </h3>
            <p className="text-amber-600">
              Essayez une autre catégorie pour voir nos photos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}