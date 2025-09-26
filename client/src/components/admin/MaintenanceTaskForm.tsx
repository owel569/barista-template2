import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types corrigés
interface MaintenanceTask {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  estimatedDuration?: number;
  dueDate?: string;
  equipment?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MaintenanceTaskFormProps {
  initialData?: MaintenanceTask;
  onSubmit: (data: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> & { 
    equipmentId?: number | null;
    type?: string;
    scheduledDate?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function MaintenanceTaskForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: MaintenanceTaskFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MaintenanceTask>({
    id: initialData.id || '',
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    status: initialData.status || 'pending',
    assignedTo: initialData.assignedTo || '',
    estimatedDuration: initialData.estimatedDuration || 0,
    dueDate: initialData.dueDate || '',
    equipment: initialData.equipment || '',
    notes: initialData.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof MaintenanceTask, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.priority) {
      newErrors.priority = 'La priorité est requise';
    }

    if (formData.estimatedDuration && formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = 'La durée doit être positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive'
      });
      return;
    }

    try {
      const submitData = {
        title: formData.title!,
        description: formData.description!,
        priority: formData.priority!,
        status: formData.status!,
        assignedTo: formData.assignedTo || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        dueDate: formData.dueDate || undefined,
        equipment: formData.equipment || undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(submitData);

      toast({
        title: 'Succès',
        description: 'Tâche de maintenance sauvegardée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la tâche',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {initialData.id ? 'Modifier la tâche' : 'Nouvelle tâche de maintenance'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Titre de la tâche"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Équipement</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) => handleInputChange('equipment', e.target.value)}
                placeholder="Équipement concerné"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description détaillée de la tâche"
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => handleInputChange('priority', value)}
              >
                <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('low')}>Faible</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('medium')}>Moyenne</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('high')}>Élevée</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('urgent')}>Urgente</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.priority}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('pending')}>En attente</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('in_progress')}>En cours</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('completed')}>Terminée</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('cancelled')}>Annulée</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigné à</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  placeholder="Nom du technicien"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Durée estimée (heures)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 2.5"
                  className={`pl-10 ${errors.estimatedDuration ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.estimatedDuration && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.estimatedDuration}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes supplémentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notes, observations, instructions particulières..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {initialData.id ? 'Mettre à jour' : 'Créer la tâche'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Export par défaut également
export default MaintenanceTaskForm;