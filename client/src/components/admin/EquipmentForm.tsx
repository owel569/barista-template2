import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Equipment } from './maintenance-management';

interface EquipmentFormProps {
  initialData?: Equipment | null;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
}

export function EquipmentForm({ initialData, onSubmit, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'> | Partial<Equipment>>(
    initialData || {
      name: '',
      type: '',
      model: '',
      serialNumber: '',
      location: '',
      status: 'operational',
      lastMaintenance: new Date().toISOString(),
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceFrequency: 30,
      purchaseDate: new Date().toISOString(),
      vendor: '',
    }
  );

  const [lastMaintenanceDate, setLastMaintenanceDate] = useState<Date>(
    initialData ? new Date(initialData.lastMaintenance) : new Date()
  );
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date>(
    initialData ? new Date(initialData.nextMaintenance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [purchaseDate, setPurchaseDate] = useState<Date>(
    initialData && initialData.purchaseDate ? new Date(initialData.purchaseDate) : new Date()
  );
  const [warrantyDate, setWarrantyDate] = useState<Date | undefined>(
    initialData && initialData.warrantyExpiry ? new Date(initialData.warrantyExpiry) : undefined
  );

  useEffect(() => {
    if (lastMaintenanceDate) {
      setFormData({
        ...formData,
        lastMaintenance: lastMaintenanceDate.toISOString(),
      });
    }
  }, [lastMaintenanceDate]);

  useEffect(() => {
    if (nextMaintenanceDate) {
      setFormData({
        ...formData,
        nextMaintenance: nextMaintenanceDate.toISOString(),
      });
    }
  }, [nextMaintenanceDate]);

  useEffect(() => {
    if (purchaseDate) {
      setFormData({
        ...formData,
        purchaseDate: purchaseDate.toISOString(),
      });
    }
  }, [purchaseDate]);

  useEffect(() => {
    if (warrantyDate) {
      setFormData({
        ...formData,
        warrantyExpiry: warrantyDate.toISOString(),
      });
    } else {
      const { warrantyExpiry, ...rest } = formData;
      setFormData(rest);
    }
  }, [warrantyDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value) || 0,
    });

    if (name === 'maintenanceFrequency' && lastMaintenanceDate) {
      const newDate = new Date(lastMaintenanceDate);
      newDate.setDate(newDate.getDate() + parseInt(value) || 0);
      setNextMaintenanceDate(newDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nom de l'équipement"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Input
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Type d'équipement"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modèle</Label>
          <Input
            id="model"
            name="model"
            value={formData.model || ''}
            onChange={handleChange}
            placeholder="Modèle de l'équipement"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Numéro de série</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber || ''}
            onChange={handleChange}
            placeholder="Numéro de série"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Emplacement *</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Emplacement de l'équipement"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select
            value={formData.status || 'operational'}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">Opérationnel</SelectItem>
              <SelectItem value="maintenance">En maintenance</SelectItem>
              <SelectItem value="out_of_order">Hors service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date d'achat</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={(date) => date && setPurchaseDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date de fin de garantie</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {warrantyDate ? format(warrantyDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={warrantyDate}
                onSelect={(date) => date && setWarrantyDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Fournisseur</Label>
          <Input
            id="vendor"
            name="vendor"
            value={formData.vendor || ''}
            onChange={handleChange}
            placeholder="Nom du fournisseur"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenanceFrequency">Fréquence de maintenance (jours)</Label>
          <Input
            id="maintenanceFrequency"
            name="maintenanceFrequency"
            type="number"
            min="1"
            value={formData.maintenanceFrequency}
            onChange={handleNumberChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Dernière maintenance</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {lastMaintenanceDate ? format(lastMaintenanceDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={lastMaintenanceDate}
                onSelect={(date) => date && setLastMaintenanceDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Prochaine maintenance</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {nextMaintenanceDate ? format(nextMaintenanceDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={nextMaintenanceDate}
                onSelect={(date) => date && setNextMaintenanceDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initialData ? 'Mettre à jour' : 'Créer'} l'équipement
        </Button>
      </div>
    </form>
  );
}