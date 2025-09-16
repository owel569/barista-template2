
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types précis pour le formulaire de maintenance
export interface MaintenanceTask {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'equipment' | 'cleaning' | 'repair' | 'inspection' | 'preventive';
  assignedTo?: string;
  dueDate: string;
  estimatedDuration: number; // en minutes
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  completedAt?: string;
  completedBy?: string;
  equipment?: string;
  location?: string;
  cost?: number;
  supplies?: string[];
}

interface MaintenanceTaskFormProps {
  initialData?: Partial<MaintenanceTask>;
  onSubmit: (data: Omit<MaintenanceTask, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export const MaintenanceTaskForm: React.FC<MaintenanceTaskFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<MaintenanceTask>>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'equipment',
    dueDate: new Date().toISOString().split('T')[0],
    estimatedDuration: 60,
    status: 'pending',
    notes: '',
    equipment: '',
    location: '',
    cost: 0,
    supplies: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'La date d\'échéance est obligatoire';
    }

    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = 'La durée estimée doit être positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(formData as Omit<MaintenanceTask, 'id'>);
      toast({
        title: mode === 'create' ? 'Tâche créée' : 'Tâche mise à jour',
        description: mode === 'create' 
          ? 'La tâche de maintenance a été créée avec succès' 
          : 'La tâche de maintenance a été mise à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la tâche de maintenance",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof MaintenanceTask, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Nettoyer l'erreur du champ si elle existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment': return '🔧';
      case 'cleaning': return '🧽';
      case 'repair': return '🔨';
      case 'inspection': return '🔍';
      case 'preventive': return '🛡️';
      default: return '📋';
    }
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isCreateMode && <><AlertTriangle className="h-5 w-5 text-blue-600" /> Créer une tâche de maintenance</>}
            {isEditMode && <><Clock className="h-5 w-5 text-orange-600" /> Modifier la tâche de maintenance</>}
            {isViewMode && <><CheckCircle className="h-5 w-5 text-green-600" /> Détails de la tâche</>}
          </CardTitle>
          {formData.status && (
            <Badge variant="outline" className={getPriorityColor(formData.priority || 'medium')}>
              {formData.priority?.toUpperCase()} - {formData.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isViewMode}
                  className={errors.title ? 'border-red-500' : ''}
                  placeholder="Ex: Nettoyage machine à café"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: MaintenanceTask['category']) => handleInputChange('category', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">
                      {getCategoryIcon('equipment')} Équipement
                    </SelectItem>
                    <SelectItem value="cleaning">
                      {getCategoryIcon('cleaning')} Nettoyage
                    </SelectItem>
                    <SelectItem value="repair">
                      {getCategoryIcon('repair')} Réparation
                    </SelectItem>
                    <SelectItem value="inspection">
                      {getCategoryIcon('inspection')} Inspection
                    </SelectItem>
                    <SelectItem value="preventive">
                      {getCategoryIcon('preventive')} Préventif
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: MaintenanceTask['priority']) => handleInputChange('priority', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Faible</SelectItem>
                    <SelectItem value="medium">🟡 Moyenne</SelectItem>
                    <SelectItem value="high">🟠 Élevée</SelectItem>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dueDate">Date d'échéance *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  disabled={isViewMode}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.dueDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Durée estimée (minutes) *</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="1"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                  className={errors.estimatedDuration ? 'border-red-500' : ''}
                  placeholder="60"
                />
                {errors.estimatedDuration && (
                  <p className="text-sm text-red-600 mt-1">{errors.estimatedDuration}</p>
                )}
              </div>

              <div>
                <Label htmlFor="assignedTo">Assigné à</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ''}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  disabled={isViewMode}
                  placeholder="Nom de l'employé"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isViewMode}
              className={errors.description ? 'border-red-500' : ''}
              placeholder="Décrivez la tâche de maintenance en détail..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="equipment">Équipement</Label>
              <Input
                id="equipment"
                value={formData.equipment || ''}
                onChange={(e) => handleInputChange('equipment', e.target.value)}
                disabled={isViewMode}
                placeholder="Ex: Machine à café #1"
              />
            </div>

            <div>
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={isViewMode}
                placeholder="Ex: Cuisine principale"
              />
            </div>

            <div>
              <Label htmlFor="cost">Coût estimé (€)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes complémentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={isViewMode}
              placeholder="Notes additionnelles, observations..."
              rows={3}
            />
          </div>

          {/* Statut pour l'édition */}
          {(isEditMode || isViewMode) && (
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MaintenanceTask['status']) => handleInputChange('status', value)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">📋 En attente</SelectItem>
                  <SelectItem value="in_progress">⏳ En cours</SelectItem>
                  <SelectItem value="completed">✅ Terminée</SelectItem>
                  <SelectItem value="cancelled">❌ Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Boutons d'action */}
          {!isViewMode && (
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>⏳ Sauvegarde...</>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCreateMode ? 'Créer la tâche' : 'Mettre à jour'}
                  </>
                )}
              </Button>
            </div>
          )}

          {isViewMode && (
            <div className="flex justify-end pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            </div>
          )}

          {/* Alerte de validation */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Veuillez corriger les erreurs dans le formulaire avant de continuer.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

// Export par défaut pour la compatibilité
export default MaintenanceTaskForm;
