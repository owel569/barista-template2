import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface SettingsManagementProps {
  userRole: UserRole;
}

export default function SettingsManagement({ userRole }: SettingsManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuration du système et préférences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du restaurant
              </label>
              <input 
                type="text" 
                defaultValue="Barista Café"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              <textarea 
                defaultValue="123 Rue du Café, 75001 Paris"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horaires d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configuration disponible pour les directeurs uniquement
              </p>
              {userRole === "directeur" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Lundi - Vendredi</span>
                    <span className="text-sm text-gray-600">8h00 - 20h00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Samedi - Dimanche</span>
                    <span className="text-sm text-gray-600">9h00 - 22h00</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}