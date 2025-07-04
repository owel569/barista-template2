import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Clock, Phone, Mail, MapPin, Coffee, Upload } from "lucide-react";
import { UserRole } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

interface SettingsManagementProps {
  userRole: UserRole;
}

export default function SettingsManagement({ userRole }: SettingsManagementProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // États pour les paramètres
  const [generalSettings, setGeneralSettings] = useState({
    cafeName: "Barista Café",
    description: "Le meilleur café de la ville",
    phone: "+33 1 23 45 67 89",
    email: "contact@barista-cafe.fr",
    address: "123 Rue de la Paix, 75001 Paris",
    website: "www.barista-cafe.fr"
  });

  const [hoursSettings, setHoursSettings] = useState({
    monday: { open: "08:00", close: "22:00", closed: false },
    tuesday: { open: "08:00", close: "22:00", closed: false },
    wednesday: { open: "08:00", close: "22:00", closed: false },
    thursday: { open: "08:00", close: "22:00", closed: false },
    friday: { open: "08:00", close: "23:00", closed: false },
    saturday: { open: "09:00", close: "23:00", closed: false },
    sunday: { open: "10:00", close: "20:00", closed: false }
  });

  const [businessSettings, setBusinessSettings] = useState({
    maxReservations: 50,
    reservationAdvance: 30,
    cancellationTime: 2,
    enableOnlineOrders: true,
    enableReservations: true,
    autoConfirmReservations: false,
    maxTableCapacity: 8
  });

  const handleGeneralSettingsChange = (field: string, value: string) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setHoursSettings(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value }
    }));
  };

  const handleBusinessSettingsChange = (field: string, value: string | boolean | number) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simuler la sauvegarde (à implémenter avec une vraie API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = {
    monday: "Lundi",
    tuesday: "Mardi", 
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres généraux
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuration du café et des services
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cafeName">Nom du café</Label>
              <Input
                id="cafeName"
                value={generalSettings.cafeName}
                onChange={(e) => handleGeneralSettingsChange("cafeName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={generalSettings.description}
                onChange={(e) => handleGeneralSettingsChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={generalSettings.phone}
                onChange={(e) => handleGeneralSettingsChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={generalSettings.email}
                onChange={(e) => handleGeneralSettingsChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={generalSettings.address}
                onChange={(e) => handleGeneralSettingsChange("address", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={generalSettings.website}
                onChange={(e) => handleGeneralSettingsChange("website", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Paramètres commerciaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres commerciaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxReservations">Nombre maximum de réservations par jour</Label>
              <Input
                id="maxReservations"
                type="number"
                value={businessSettings.maxReservations}
                onChange={(e) => handleBusinessSettingsChange("maxReservations", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="reservationAdvance">Délai de réservation (jours)</Label>
              <Input
                id="reservationAdvance"
                type="number"
                value={businessSettings.reservationAdvance}
                onChange={(e) => handleBusinessSettingsChange("reservationAdvance", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="cancellationTime">Délai d'annulation (heures)</Label>
              <Input
                id="cancellationTime"
                type="number"
                value={businessSettings.cancellationTime}
                onChange={(e) => handleBusinessSettingsChange("cancellationTime", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxTableCapacity">Capacité maximum par table</Label>
              <Input
                id="maxTableCapacity"
                type="number"
                value={businessSettings.maxTableCapacity}
                onChange={(e) => handleBusinessSettingsChange("maxTableCapacity", parseInt(e.target.value))}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableReservations">Activer les réservations</Label>
                <Switch
                  id="enableReservations"
                  checked={businessSettings.enableReservations}
                  onCheckedChange={(checked) => handleBusinessSettingsChange("enableReservations", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoConfirmReservations">Confirmation automatique</Label>
                <Switch
                  id="autoConfirmReservations"
                  checked={businessSettings.autoConfirmReservations}
                  onCheckedChange={(checked) => handleBusinessSettingsChange("autoConfirmReservations", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableOnlineOrders">Commandes en ligne</Label>
                <Switch
                  id="enableOnlineOrders"
                  checked={businessSettings.enableOnlineOrders}
                  onCheckedChange={(checked) => handleBusinessSettingsChange("enableOnlineOrders", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horaires d'ouverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d'ouverture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(hoursSettings).map(([day, hours]) => (
              <div key={day} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium">
                    {dayLabels[day as keyof typeof dayLabels]}
                  </Label>
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => handleHoursChange(day, "closed", !checked)}
                  />
                </div>
                {!hours.closed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Ouverture</Label>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fermeture</Label>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {hours.closed && (
                  <p className="text-sm text-gray-500 text-center">Fermé</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logo et images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo et images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Logo du café</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Cliquez pour télécharger ou glissez une image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
              </div>
            </div>
            <div>
              <Label>Image de fond</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Cliquez pour télécharger ou glissez une image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}