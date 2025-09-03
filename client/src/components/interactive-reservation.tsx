import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Calendar as CalendarIcon, MapPin, Phone, Mail, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TablePreference =
  | 'none'
  | 'indoor'
  | 'outdoor'
  | 'window'
  | 'bar'
  | 'private';

type Occasion =
  | 'none'
  | 'birthday'
  | 'anniversary'
  | 'business'
  | 'date'
  | 'celebration';

interface ReservationData {
  customerName: string;
  email: string;
  phone: string;
  date?: Date;
  time: string;
  guests: number;
  tablePreference: TablePreference;
  occasion: Occasion;
  specialRequests: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
}

interface AvailableTable {
  id: number;
  number: string;
  capacity: number;
  location: string;
  isAvailable: boolean;
}

export const InteractiveReservation: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData>({
    customerName: '',
    email: '',
    phone: '',
    date: undefined,
    time: '',
    guests: 2,
    tablePreference: 'none',
    occasion: 'none',
    specialRequests: ''
  });

  // Créneaux horaires disponibles
  const availableTimeSlots: TimeSlot[] = [
    { time: '12:00', available: true, capacity: 8 },
    { time: '12:30', available: true, capacity: 6 },
    { time: '13:00', available: false, capacity: 0 },
    { time: '13:30', available: true, capacity: 4 },
    { time: '19:00', available: true, capacity: 10 },
    { time: '19:30', available: true, capacity: 8 },
    { time: '20:00', available: true, capacity: 6 },
    { time: '20:30', available: false, capacity: 0 },
    { time: '21:00', available: true, capacity: 4 }
  ];

  // Tables disponibles mock
  const availableTables: AvailableTable[] = [
    { id: 1, number: 'T1', capacity: 2, location: 'Terrasse', isAvailable: true },
    { id: 2, number: 'T5', capacity: 4, location: 'Intérieur', isAvailable: true },
    { id: 3, number: 'T8', capacity: 6, location: 'Salon VIP', isAvailable: true },
    { id: 4, number: 'T12', capacity: 8, location: 'Grande salle', isAvailable: true }
  ];

  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationData) => {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: data.date?.toISOString() ?? undefined
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la création de la réservation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: 'Réservation confirmée',
        description: 'Votre réservation a été enregistrée avec succès.',
        variant: 'default'
      });
      setCurrentStep(5); // Étape de confirmation
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    }
  });

  const handleInputChange = <K extends keyof ReservationData>(
    field: K,
    value: ReservationData[K]
  ) => {
    setReservationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(reservationData.customerName && reservationData.email && reservationData.phone);
      case 2:
        return !!(reservationData.date && reservationData.time && reservationData.guests > 0);
      case 3:
        return !!reservationData.tablePreference;
      case 4:
        return true; // Étape de révision
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        createReservationMutation.mutate(reservationData);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive'
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep >= step 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-300 text-gray-600'
            }
          `}>
            {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < 5 && (
            <div className={`
              w-12 h-1 mx-2
              ${currentStep > step ? 'bg-green-600' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  // Etape 1 : Infos client
  const renderStep1 = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2 text-green-600" />
          Informations Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Nom complet *</Label>
          <Input
            id="customerName"
            value={reservationData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            placeholder="Votre nom complet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={reservationData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="votre@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            value={reservationData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Etape 2 : Date/heure et nombre de convives
  const renderStep2 = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-green-600" />
          Date et Heure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Date de réservation *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reservationData.date
                  ? format(reservationData.date, "dd/MM/yyyy", { locale: fr })
                  : "Sélectionner une date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={reservationData.date}
                onSelect={(date) => handleInputChange('date', date)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Nombre de convives *</Label>
          <Select
            value={reservationData.guests.toString()}
            onValueChange={(value) => handleInputChange('guests', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'personne' : 'personnes'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Créneaux disponibles</Label>
          <div className="grid grid-cols-3 gap-2">
            {availableTimeSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={reservationData.time === slot.time ? 'default' : 'outline'}
                disabled={!slot.available || slot.capacity < reservationData.guests}
                onClick={() => handleInputChange('time', slot.time)}
                className={`text-xs ${
                  reservationData.time === slot.time ? 'bg-green-600' : ''
                }`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {slot.time}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Etape 3 : Préférences de table et occasion
  const renderStep3 = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-600" />
          Préférences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tablePreference">Préférence de table</Label>
          <Select
            value={reservationData.tablePreference}
            onValueChange={(value) => handleInputChange('tablePreference', value as TablePreference)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Aucune préférence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune préférence</SelectItem>
              <SelectItem value="indoor">À l'intérieur</SelectItem>
              <SelectItem value="outdoor">En terrasse</SelectItem>
              <SelectItem value="window">Près d'une fenêtre</SelectItem>
              <SelectItem value="bar">Au comptoir</SelectItem>
              <SelectItem value="private">Salon privé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="occasion">Occasion spéciale</Label>
          <Select
            value={reservationData.occasion}
            onValueChange={(value) => handleInputChange('occasion', value as Occasion)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Aucune occasion spéciale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune occasion spéciale</SelectItem>
              <SelectItem value="birthday">🎂 Anniversaire</SelectItem>
              <SelectItem value="anniversary">💕 Anniversaire de couple</SelectItem>
              <SelectItem value="business">💼 Repas d'affaires</SelectItem>
              <SelectItem value="date">❤️ Rendez-vous romantique</SelectItem>
              <SelectItem value="celebration">🎉 Célébration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // Etape 4 : Confirmation
  const renderStep4 = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Confirmation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Client:</span>
            <span className="font-medium">{reservationData.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Email:</span>
            <span className="text-sm">{reservationData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Téléphone:</span>
            <span className="text-sm">{reservationData.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Date:</span>
            <span className="font-medium">
              {reservationData.date
                ? format(reservationData.date, "dd/MM/yyyy", { locale: fr })
                : 'Non sélectionnée'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Heure:</span>
            <span className="font-medium">{reservationData.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Convives:</span>
            <span className="font-medium">{reservationData.guests} personnes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Table:</span>
            <span className="font-medium">
              {reservationData.tablePreference !== 'none'
                ? reservationData.tablePreference
                : 'Aucune préférence'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Occasion:</span>
            <span className="font-medium">
              {reservationData.occasion !== 'none'
                ? reservationData.occasion
                : 'Aucune'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialRequests">Demandes spéciales</Label>
          <Textarea
            id="specialRequests"
            value={reservationData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            placeholder="Allergies, occasions spéciales, préférences..."
            className="min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Etape 5 : Confirmation finale
  const renderStep5 = () => (
    <Card className="max-w-md mx-auto text-center">
      <CardContent className="p-8">
        <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-bold mb-2">Réservation Confirmée!</h3>
        <p className="text-gray-600 mb-4">
          Votre réservation a été enregistrée avec succès. Vous recevrez un email de confirmation.
        </p>
        <Badge variant="outline" className="mb-4">
          Numéro de réservation: #RES{Date.now().toString().slice(-6)}
        </Badge>
        <Button 
          onClick={() => {
            setCurrentStep(1);
            setReservationData({
              customerName: '',
              email: '',
              phone: '',
              date: undefined,
              time: '',
              guests: 2,
              tablePreference: 'none',
              occasion: 'none',
              specialRequests: ''
            });
          }}
          className="w-full"
        >
          Nouvelle Réservation
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Réservation Interactive</h1>
        <p className="text-gray-600">Réservez votre table en quelques étapes simples</p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      {currentStep < 5 && (
        <div className="flex justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Précédent
          </Button>
          <Button
            onClick={nextStep}
            disabled={createReservationMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {currentStep === 4 
              ? (createReservationMutation.isPending ? 'Confirmation...' : 'Confirmer')
              : 'Suivant'
            }
          </Button>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Appelez-nous</p>
            <p className="text-xs text-gray-600">01 23 45 67 89</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Adresse</p>
            <p className="text-xs text-gray-600">123 Rue du Café, Paris</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Horaires</p>
            <p className="text-xs text-gray-600">7h - 22h tous les jours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InteractiveReservation;