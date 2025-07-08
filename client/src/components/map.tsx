import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Map() {
  return (
    <section id="map" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">
            Nous Trouver
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Situé au cœur de la ville, notre café vous accueille dans un cadre chaleureux et authentique.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615674084!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sfr!4v1624889234567!5m2!1sen!2sfr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation du Barista Café"
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-coffee-dark flex items-center">
                <MapPin className="mr-3 text-coffee-accent" />
                Informations de Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Adresse</h3>
                <p className="text-gray-600">
                  123 Rue du Café<br />
                  75001 Paris, France
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Téléphone</h3>
                <p className="text-gray-600">
                  <a href="tel:+212522123456" className="hover:text-coffee-accent transition-colors">
                    🇲🇦 +212 5 22 12 34 56
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Email</h3>
                <p className="text-gray-600">
                  <a href="mailto:contact@barista-cafe.fr" className="hover:text-coffee-accent transition-colors">
                    contact@barista-cafe.fr
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Horaires d'ouverture</h3>
                <div className="text-gray-600 space-y-1">
                  <p><span className="font-medium">Lundi - Vendredi:</span> 7h00 - 22h00</p>
                  <p><span className="font-medium">Samedi:</span> 8h00 - 23h00</p>
                  <p><span className="font-medium">Dimanche:</span> 9h00 - 21h00</p>
                </div>
              </div>

              <div className="bg-coffee-light p-4 rounded-lg">
                <h3 className="font-semibold text-coffee-dark mb-2">Accès Transport</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Métro: Châtelet-Les Halles (Lignes 1, 4, 7, 11, 14)</li>
                  <li>• Bus: Lignes 21, 67, 69, 76, 81, 85</li>
                  <li>• Parking: Centre commercial souterrain</li>
                  <li>• Vélib': Station n°1042 à 50m</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}