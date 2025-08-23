import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Calendar, Clock, Users, Plus, Check, X, Loader2, AlertCircle, Phone, Mail, User, Info 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: ReservationData) => Promise<void> | void;
  reservation?: Partial<ReservationData>;
  isEdit?: boolean;
}

interface ReservationData {
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export default function ReservationDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  reservation, 
  isEdit = false 
}: ReservationDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ReservationData>({
    customerName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    notes: '',
    status: 'pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with reservation data when opening
  useEffect(() => {
    if (isOpen && reservation) {
      setFormData({
        customerName: reservation.customerName || '',
        email: reservation.email || '',
        phone: reservation.phone || '',
        date: reservation.date || '',
        time: reservation.time || '',
        guests: reservation.guests || 2,
        notes: reservation.notes || '',
        status: reservation.status || 'pending'
      });
    }
  }, [isOpen, reservation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim();{
      newErrors.customerName = 'Le nom est requis';
    }

    if (!formData.email.trim();{
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);{
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone);{
      newErrors.phone = 'Numéro invalide';
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isBefore(selectedDate, today);{
        newErrors.date = 'La date ne peut pas être dans le passé';
      }

      if (isAfter(selectedDate, addDays(today, 90);{
        newErrors.date = 'Réservation max 3 mois à l\'avance';
      }
    }

    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm();{
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
      toast({
        title: 'Succès',
        description: isEdit ? 'Réservation mise à jour' : 'Nouvelle réservation créée',
        action: <Check className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ReservationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value });
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' });
    }
  };

  // Generate time slots from opening hours
  const generateTimeSlots = () => {
    const slots = [];
    const openingHour = 8; // 8:00 AM
    const closingHour = 22; // 10:00 PM

    for (let hour = openingHour; hour <= closingHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0'}:${minute.toString().padStart(2, '0'}`;
        slots.push(timeString);
      }
    }

    return slots;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEdit ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 
              'Modifiez les détails de cette réservation' : 
              'Remplissez le formulaire pour créer une nouvelle réservation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  <span>Nom du client *</span>
                </div>
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value}
                placeholder="Nom complet"
                className={errors.customerName ? 'border-red-500' : ''}
              />
              {errors.customerName && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.customerName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" />
                  <span>Email *</span>
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value}
                placeholder="client@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" />
                  <span>Téléphone</span>
                </div>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value}
                placeholder="06 12 34 56 78"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date *</span>
                  </div>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value}
                  min={format(new Date(), 'yyyy-MM-dd'}
                  max={format(addDays(new Date(), 90), 'yyyy-MM-dd'}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="time">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Heure *</span>
                  </div>
                </Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(value) => handleChange('time', value}
                >
                  <SelectTrigger className={errors.time ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {generateTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                {errors.time && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Guests */}
            <div>
              <Label htmlFor="guests">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4" />
                  <span>Nombre de personnes *</span>
                </div>
              </Label>
              <Select 
                value={formData.guests.toString(} 
                onValueChange={(value) => handleChange('guests', parseInt(value);}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <SelectItem key={num} value={num.toString(}>
                      <div className="flex items-center gap-2">
                        {num} personne{num > 1 ? 's' : ''}
                      </div>
                    </SelectItem>
                  );}
                  <SelectItem value="9+">
                    <div className="flex items-center gap-2">
                      Groupe (9+ personnes)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status (edit only) */}
            {isEdit && (
              <div>
                <Label htmlFor="status">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4" />
                    <span>Statut</span>
                  </div>
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleChange('status', value as ReservationData['status']}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4" />
                  <span>Notes spéciales</span>
                </div>
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value}
                placeholder="Allergies, anniversaire, demande spéciale..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              }
              {isEdit ? 'Mettre à jour' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}