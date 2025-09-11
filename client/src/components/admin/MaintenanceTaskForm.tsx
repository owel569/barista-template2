import { useState, useEffect } from 'react';
import type { MaintenanceTask, Technician } from '@/types/maintenance';
import type { MaintenanceTaskFormData, EquipmentFormData } from '@/types/maintenance-extended';
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

interface MaintenanceTaskFormProps {
  equipmentList: EquipmentFormData[];
  technicians: Technician[];
  initialData?: MaintenanceTask | MaintenanceTaskFormData;
  onSubmit: (data: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> & { equipmentId?: number | null }) => Promise<void>;
  onCancel: () => void;
}

export function MaintenanceTaskForm({
  equipmentList,
  technicians,
  initialData,
  onSubmit,
  onCancel,
}: MaintenanceTaskFormProps) {
  const defaultValues: MaintenanceTaskFormData = {
    title: '',
    description: '',
    type: 'preventive',
    priority: 'medium',
    status: 'pending',
    assignedTo: '',
    assignedToId: null,
    equipmentId: null,
    scheduledDate: '',
    completedDate: '',
    notes: '',
    estimatedDuration: 0,
    cost: 0
  };

  const initializeFormData = (): MaintenanceTaskFormData => {
    if (!initialData) return defaultValues;

    const result: MaintenanceTaskFormData = {
      id: initialData.id || '',
      title: initialData.title || defaultValues.title,
      description: initialData.description || defaultValues.description,
      type: initialData.type || defaultValues.type,
      priority: initialData.priority || defaultValues.priority,
      status: initialData.status || defaultValues.status,
      assignedTo: initialData.assignedTo || defaultValues.assignedTo || '',
      assignedToId: initialData.assignedToId ?? null,
      equipmentId: initialData.equipmentId ?? null,
      scheduledDate: initialData.scheduledDate || defaultValues.scheduledDate,
      estimatedDuration: initialData.estimatedDuration || defaultValues.estimatedDuration,
      cost: (initialData.cost !== undefined ? initialData.cost : defaultValues.cost)
    };

    // Ajouter les champs optionnels seulement s'ils ont des valeurs
    if (initialData.completedDate) result.completedDate = initialData.completedDate;
    if (initialData.notes) result.notes = initialData.notes;
    if (initialData.createdAt) result.createdAt = initialData.createdAt;
    if (initialData.updatedAt) result.updatedAt = initialData.updatedAt;

    return result;
  };

  const [formData, setFormData] = useState<MaintenanceTaskFormData>(initializeFormData());
  const [date, setDate] = useState<Date | undefined>(
    initialData?.scheduledDate ? new Date(initialData.scheduledDate) : undefined
  );

  useEffect(() => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: date.toISOString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        scheduledDate: '',
      }));
    }
  }, [date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selectedEquipment = equipmentList.find(e => e.id.toString() === equipmentId);
    setFormData(prev => ({
      ...prev,
      equipmentId: selectedEquipment?.id ?? null,
    }));
  };

  const handleTechnicianChange = (technicianId: string) => {
    const selectedTechnician = technicians.find(t => t.id.toString() === technicianId);
    if (selectedTechnician) {
      setFormData(prev => ({
        ...prev,
        assignedTo: selectedTechnician.name,
        assignedToId: selectedTechnician.id,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedTo: '',
        assignedToId: null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskToSubmit: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> & { equipmentId?: number | null } = {
      title: formData.title,
      description: formData.description || '',
      type: formData.type as 'preventive' | 'corrective' | 'emergency',
      equipmentId: formData.equipmentId !== null && formData.equipmentId !== undefined ? Number(formData.equipmentId) : null,
      priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
      status: formData.status || 'pending',
      assignedTo: formData.assignedTo || '',
      assignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      scheduledDate: formData.scheduledDate,
      estimatedDuration: formData.estimatedDuration,
      cost: formData.cost || 0,
      notes: formData.notes || ''
    };
    await onSubmit(taskToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            placeholder="Titre de la tâche"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipmentId">Équipement *</Label>
          <Select
            value={formData.equipmentId !== null && formData.equipmentId !== undefined ? formData.equipmentId.toString() : ''}
            onValueChange={handleEquipmentChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un équipement" />
            </SelectTrigger>
            <SelectContent>
              {equipmentList.map(equipment => (
                <SelectItem key={equipment.id} value={equipment.id.toString()}>
                  {equipment.name} ({equipment.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorité *</Label>
          <Select
            value={formData.priority || 'medium'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as MaintenanceTask['priority'] }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select
            value={formData.status || 'pending'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as MaintenanceTask['status'] }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedToId">Technicien assigné</Label>
          <Select
            value={formData.assignedToId?.toString() || ''}
            onValueChange={handleTechnicianChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un technicien" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id.toString()}>
                  {tech.name} ({tech.specialization})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date prévue *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Durée estimée (heures)</Label>
          <Input
            id="estimatedDuration"
            name="estimatedDuration"
            type="number"
            min="0.5"
            step="0.5"
            value={formData.estimatedDuration || ''}
            onChange={handleNumberChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Coût estimé (€)</Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            value={formData.cost || ''}
            onChange={handleNumberChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Description détaillée de la tâche..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Notes supplémentaires..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initialData ? 'Mettre à jour' : 'Créer'} la tâche
        </Button>
      </div>
    </form>
  );
}