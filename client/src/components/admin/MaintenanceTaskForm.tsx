import { useState, useEffect } from 'react';
import type { MaintenanceTask } from '@/types/maintenance';
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
import { MaintenanceTask as MaintenanceTaskType, Equipment, Technician } from './maintenance-management'; // Renamed to avoid conflict

interface MaintenanceTaskFormProps {
  equipmentList: Equipment[];
  technicians: Technician[];
  initialData?: Partial<MaintenanceTask>;
  onSubmit: (data: Omit<MaintenanceTask, 'id'>) => void;
  onCancel: () => void;
}

interface MaintenanceTaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedToId?: number | null; // Changed to allow null
  cost?: number;
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number;
  equipment: string;
  equipmentId?: number | null; // Changed to allow null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

export function MaintenanceTaskForm({
  equipmentList,
  technicians,
  initialData,
  onSubmit,
  onCancel,
}: MaintenanceTaskFormProps) {
  const [formData, setFormData] = useState<MaintenanceTask>(() => {
      if (initialData) {
        return {
          id: initialData.id || 0,
          title: initialData.title || '',
          description: initialData.description || '',
          type: initialData.type || 'preventive', // Default to 'preventive'
          priority: (initialData.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
          status: (initialData.status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending',
          scheduledDate: initialData.scheduledDate || new Date().toISOString().split('T')[0],
          estimatedDuration: initialData.estimatedDuration || 1,
          cost: initialData.cost || 0, // Default to 0 if not provided
          assignedToId: initialData.assignedToId || null, // Default to null if not provided
          notes: initialData.notes || '',
          equipmentId: initialData.equipmentId || null, // Default to null if not provided
          createdAt: initialData.createdAt || new Date(),
          updatedAt: initialData.updatedAt || new Date()
        };
      } else {
        // Provide default values if initialData is not present
        return {
          id: 0,
          title: '',
          description: '',
          type: 'preventive' as const,
          priority: 'medium' as const,
          status: 'pending' as const,
          scheduledDate: new Date().toISOString().split('T')[0],
          estimatedDuration: 1,
          cost: 0,
          assignedToId: null,
          notes: '',
          equipmentId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    });

  const [date, setDate] = useState<Date>(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date());

  useEffect(() => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: date.toISOString(),
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
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipmentId: selectedEquipment.id,
        equipment: selectedEquipment.name,
      }));
    } else {
      // Handle case where no equipment is selected or found
      setFormData(prev => ({
        ...prev,
        equipmentId: null,
        equipment: '',
      }));
    }
  };

  const handleTechnicianChange = (technicianId: string) => {
    const selectedTechnician = technicians.find(t => t.id === parseInt(technicianId));
    if (selectedTechnician) {
      setFormData(prev => ({
        ...prev,
        assignedTo: selectedTechnician.name,
        assignedToId: selectedTechnician.id || null, // Ensure it's null if ID is somehow not a number, though parseInt should handle this
      }));
    } else {
      // Handle case where no technician is selected or found
      setFormData(prev => ({
        ...prev,
        assignedTo: '',
        assignedToId: null,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure required fields have values before submitting
    const taskToSubmit: Omit<MaintenanceTask, 'id'> = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      scheduledDate: formData.scheduledDate,
      estimatedDuration: formData.estimatedDuration,
      cost: formData.cost || 0,
      assignedToId: formData.assignedToId || null,
      notes: formData.notes || '',
      equipmentId: formData.equipmentId || null,
    };
    onSubmit(taskToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Titre de la tâche"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipmentId">Équipement *</Label>
          <Select
            value={formData.equipmentId?.toString() || ''}
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
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select
            value={formData.status || 'pending'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
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
            value={formData.estimatedDuration}
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
          value={formData.description}
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