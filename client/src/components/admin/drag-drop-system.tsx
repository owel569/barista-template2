import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  Active,
  Over
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Move, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Plus, 
  Edit,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DragDropSystemProps {
  userRole: 'directeur' | 'employe';
}

interface DraggableMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  position: number;
  visibility: boolean;
}

interface DraggableDashboardWidget {
  id: string;
  title: string;
  type: string;
  position: number;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
  config: any;
}

// Composant pour élément draggable du menu
function SortableMenuItem({ item, onToggleVisibility }: { 
  item: DraggableMenuItem;
  onToggleVisibility: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{item.name}</h3>
          <Badge variant={item.available ? "default" : "secondary"}>
            {item.available ? "Disponible" : "Indisponible"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {item.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium">{item.price}€</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(item.id)}
        >
          {item.visibility ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Composant pour widget draggable du dashboard
function SortableDashboardWidget({ widget }: { widget: DraggableDashboardWidget }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${getSizeClass(widget.size)} ${!widget.visible ? 'opacity-50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{widget.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={widget.visible ? "default" : "secondary"}>
              {widget.visible ? "Visible" : "Masqué"}
            </Badge>
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">
            Widget {widget.type}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DragDropSystem({ userRole }: DragDropSystemProps) {
  const [activeTab, setActiveTab] = useState('menu');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<DraggableMenuItem[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<DraggableDashboardWidget[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Capteurs pour la détection des événements de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger les données initiales
  const { data: initialMenuItems = [] } = useQuery({
    queryKey: ['/api/menu/items'],
    onSuccess: (data) => {
      setMenuItems(data.map((item: any, index: number) => ({
        ...item,
        id: item.id.toString(),
        position: index,
        visibility: true,
      })));
    },
  });

  const { data: initialDashboardWidgets = [] } = useQuery({
    queryKey: ['/api/admin/dashboard/widgets'],
    onSuccess: (data) => {
      setDashboardWidgets(data);
    },
  });

  // Mutations pour sauvegarder les changements
  const saveMenuOrderMutation = useMutation({
    mutationFn: (items: DraggableMenuItem[]) => 
      apiRequest('/api/admin/menu/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      setHasChanges(false);
      toast({
        title: 'Succès',
        description: 'Ordre du menu sauvegardé',
      });
    },
  });

  const saveDashboardOrderMutation = useMutation({
    mutationFn: (widgets: DraggableDashboardWidget[]) => 
      apiRequest('/api/admin/dashboard/reorder', {
        method: 'POST',
        body: JSON.stringify({ widgets }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/widgets'] });
      setHasChanges(false);
      toast({
        title: 'Succès',
        description: 'Disposition du dashboard sauvegardée',
      });
    },
  });

  // Gestion des événements de drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      if (activeTab === 'menu') {
        setMenuItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          
          const newItems = arrayMove(items, oldIndex, newIndex);
          // Mettre à jour les positions
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            position: index,
          }));
          
          setHasChanges(true);
          return updatedItems;
        });
      } else if (activeTab === 'dashboard') {
        setDashboardWidgets((widgets) => {
          const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
          const newIndex = widgets.findIndex((widget) => widget.id === over.id);
          
          const newWidgets = arrayMove(widgets, oldIndex, newIndex);
          // Mettre à jour les positions
          const updatedWidgets = newWidgets.map((widget, index) => ({
            ...widget,
            position: index,
          }));
          
          setHasChanges(true);
          return updatedWidgets;
        });
      }
    }
  };

  // Fonctions utilitaires
  const handleToggleMenuVisibility = (id: string) => {
    setMenuItems(items => 
      items.map(item => 
        item.id === id ? { ...item, visibility: !item.visibility } : item
      )
    );
    setHasChanges(true);
  };

  const handleToggleDashboardVisibility = (id: string) => {
    setDashboardWidgets(widgets => 
      widgets.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      )
    );
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (activeTab === 'menu') {
      saveMenuOrderMutation.mutate(menuItems);
    } else if (activeTab === 'dashboard') {
      saveDashboardOrderMutation.mutate(dashboardWidgets);
    }
  };

  const handleResetOrder = () => {
    if (activeTab === 'menu') {
      setMenuItems([...initialMenuItems]);
    } else if (activeTab === 'dashboard') {
      setDashboardWidgets([...initialDashboardWidgets]);
    }
    setHasChanges(false);
  };

  // Rendu des différents onglets
  const renderMenuTab = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Organisation du menu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Glissez-déposez les éléments pour réorganiser votre menu
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleResetOrder}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <Button 
              onClick={handleSaveChanges}
              disabled={!hasChanges || saveMenuOrderMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        <SortableContext items={menuItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <SortableMenuItem
                key={item.id}
                item={item}
                onToggleVisibility={handleToggleMenuVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <h3 className="font-medium">
                {menuItems.find(item => item.id === activeId)?.name}
              </h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  const renderDashboardTab = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Organisation du dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Réorganisez les widgets de votre tableau de bord
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleResetOrder}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <Button 
              onClick={handleSaveChanges}
              disabled={!hasChanges || saveDashboardOrderMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        <SortableContext items={dashboardWidgets.map(widget => widget.id)} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardWidgets.map((widget) => (
              <SortableDashboardWidget
                key={widget.id}
                widget={widget}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeId ? (
          <Card className="w-64 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {dashboardWidgets.find(widget => widget.id === activeId)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-lg"></div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activation du glisser-déposer</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permettre la réorganisation des éléments
              </p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Sauvegarde automatique</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sauvegarder automatiquement les changements
              </p>
            </div>
            <input type="checkbox" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Animations</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activer les animations de drag & drop
              </p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raccourcis clavier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Déplacer vers le haut</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
            </div>
            <div className="flex justify-between">
              <span>Déplacer vers le bas</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
            </div>
            <div className="flex justify-between">
              <span>Sélectionner</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Space</kbd>
            </div>
            <div className="flex justify-between">
              <span>Déplacer</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Glisser-Déposer</h1>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Changements non sauvegardés
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          {renderMenuTab()}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          {renderDashboardTab()}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {renderSettingsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}