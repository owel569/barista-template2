import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Users, 
  MessageSquare, 
  ShoppingCart,
  Calendar,
  Check,
  X,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Clock,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push' | 'internal';
  title: string;
  content: string;
  trigger: string;
  enabled: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotificationHistory {
  id: number;
  type: 'email' | 'sms' | 'push' | 'internal';
  title: string;
  content: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
}

interface NotificationSettings {
  id: number;
  category: string;
  enabled: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  internal: boolean;
  description: string;
}

interface NotificationsManagementProps {
  userRole: 'directeur' | 'employe';
}

export default function NotificationsManagement({ userRole }: NotificationsManagementProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'email',
    title: '',
    content: '',
    trigger: '',
    enabled: true,
    variables: [] as string[]
  });

  const [testForm, setTestForm] = useState({
    recipient: '',
    type: 'email',
    templateId: null as number | null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données factices pour les templates
  const templates: NotificationTemplate[] = [
    {
      id: 1,
      name: 'Nouvelle réservation',
      type: 'email',
      title: 'Nouvelle réservation reçue',
      content: 'Une nouvelle réservation a été effectuée par {{customerName}} pour le {{date}} à {{time}}.',
      trigger: 'reservation_created',
      enabled: true,
      variables: ['customerName', 'date', 'time', 'tableNumber'],
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Confirmation réservation',
      type: 'sms',
      title: 'Réservation confirmée',
      content: 'Votre réservation pour le {{date}} à {{time}} est confirmée. Merci!',
      trigger: 'reservation_confirmed',
      enabled: true,
      variables: ['date', 'time', 'customerName'],
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z'
    },
    {
      id: 3,
      name: 'Nouvelle commande',
      type: 'internal',
      title: 'Nouvelle commande en cuisine',
      content: 'Nouvelle commande #{{orderId}} - {{items}} - Table {{tableNumber}}',
      trigger: 'order_created',
      enabled: true,
      variables: ['orderId', 'items', 'tableNumber'],
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z'
    },
    {
      id: 4,
      name: 'Rappel nettoyage',
      type: 'push',
      title: 'Rappel maintenance',
      content: 'Il est temps de nettoyer {{equipment}} - Programmé pour {{time}}',
      trigger: 'maintenance_reminder',
      enabled: true,
      variables: ['equipment', 'time'],
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z'
    }
  ];

  // Données factices pour l'historique
  const history: NotificationHistory[] = [
    {
      id: 1,
      type: 'email',
      title: 'Nouvelle réservation reçue',
      content: 'Une nouvelle réservation a été effectuée par Sophie Laurent pour le 2025-07-10 à 19:00.',
      recipient: 'admin@barista-cafe.com',
      status: 'delivered',
      sentAt: '2025-07-09T16:00:00Z'
    },
    {
      id: 2,
      type: 'sms',
      title: 'Réservation confirmée',
      content: 'Votre réservation pour le 2025-07-10 à 19:00 est confirmée. Merci!',
      recipient: '+33612345678',
      status: 'sent',
      sentAt: '2025-07-09T16:05:00Z'
    },
    {
      id: 3,
      type: 'internal',
      title: 'Nouvelle commande en cuisine',
      content: 'Nouvelle commande #1234 - 2x Cappuccino, 1x Croissant - Table 5',
      recipient: 'Équipe cuisine',
      status: 'delivered',
      sentAt: '2025-07-09T15:30:00Z'
    },
    {
      id: 4,
      type: 'email',
      title: 'Rappel maintenance',
      content: 'Il est temps de nettoyer Machine à café principale - Programmé pour 16:00',
      recipient: 'maintenance@barista-cafe.com',
      status: 'failed',
      sentAt: '2025-07-09T15:00:00Z',
      error: 'Adresse email invalide'
    }
  ];

  // Données factices pour les paramètres
  const settings: NotificationSettings[] = [
    {
      id: 1,
      category: 'Réservations',
      enabled: true,
      email: true,
      sms: false,
      push: true,
      internal: true,
      description: 'Notifications pour les nouvelles réservations et modifications'
    },
    {
      id: 2,
      category: 'Commandes',
      enabled: true,
      email: false,
      sms: false,
      push: true,
      internal: true,
      description: 'Notifications pour les commandes et leur statut'
    },
    {
      id: 3,
      category: 'Maintenance',
      enabled: true,
      email: true,
      sms: false,
      push: false,
      internal: true,
      description: 'Rappels de maintenance et alertes équipement'
    },
    {
      id: 4,
      category: 'Messages clients',
      enabled: true,
      email: true,
      sms: false,
      push: true,
      internal: false,
      description: 'Notifications pour les messages de contact clients'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'delivered': return 'outline';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'internal': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTemplate = {
      ...templateForm,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    toast({
      title: "Template créé",
      description: "Le template de notification a été créé avec succès.",
    });

    setTemplateForm({
      name: '',
      type: 'email',
      title: '',
      content: '',
      trigger: '',
      enabled: true,
      variables: []
    });
    setIsTemplateDialogOpen(false);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Notification test envoyée",
      description: `Notification test envoyée à ${testForm.recipient}`,
    });

    setTestForm({
      recipient: '',
      type: 'email',
      templateId: null
    });
    setIsTestDialogOpen(false);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de notification</h3>
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un template de notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du template</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="Ex: Nouvelle réservation"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({...templateForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="internal">Interne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                  placeholder="Titre de la notification"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                  placeholder="Utilisez {{variable}} pour les variables dynamiques"
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trigger">Déclencheur</Label>
                <Select value={templateForm.trigger} onValueChange={(value) => setTemplateForm({...templateForm, trigger: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservation_created">Réservation créée</SelectItem>
                    <SelectItem value="reservation_confirmed">Réservation confirmée</SelectItem>
                    <SelectItem value="order_created">Commande créée</SelectItem>
                    <SelectItem value="maintenance_reminder">Rappel maintenance</SelectItem>
                    <SelectItem value="message_received">Message reçu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={templateForm.enabled}
                  onCheckedChange={(checked) => setTemplateForm({...templateForm, enabled: checked})}
                />
                <Label htmlFor="enabled">Template activé</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(template.type)}
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.title}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={template.enabled ? "default" : "secondary"}>
                    {template.enabled ? "Activé" : "Désactivé"}
                  </Badge>
                  <Badge variant="outline">{template.type}</Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {template.content}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {template.variables.map(variable => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historique des notifications</h3>
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Test notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Envoyer une notification test</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Destinataire</Label>
                <Input
                  id="recipient"
                  value={testForm.recipient}
                  onChange={(e) => setTestForm({...testForm, recipient: e.target.value})}
                  placeholder="email@exemple.com ou +33123456789"
                  required
                />
              </div>
              <div>
                <Label htmlFor="testType">Type</Label>
                <Select value={testForm.type} onValueChange={(value) => setTestForm({...testForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="internal">Interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Template</Label>
                <Select value={testForm.templateId?.toString()} onValueChange={(value) => setTestForm({...testForm, templateId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Envoyer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="internal">Interne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredHistory.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">
                      À: {item.recipient}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(item.status)}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status}</span>
                  </Badge>
                  <Badge variant="outline">{item.type}</Badge>
                  <div className="text-sm text-gray-500">
                    {new Date(item.sentAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {item.content}
              </div>
              {item.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  {item.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Paramètres de notification</h3>
      <div className="space-y-4">
        {settings.map(setting => (
          <Card key={setting.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{setting.category}</div>
                  <div className="text-sm text-gray-500">{setting.description}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={setting.enabled} />
                    <Label className="text-sm">Activé</Label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch checked={setting.email} />
                  <MessageSquare className="h-4 w-4" />
                  <Label className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={setting.sms} />
                  <MessageSquare className="h-4 w-4" />
                  <Label className="text-sm">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={setting.push} />
                  <Bell className="h-4 w-4" />
                  <Label className="text-sm">Push</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={setting.internal} />
                  <AlertCircle className="h-4 w-4" />
                  <Label className="text-sm">Interne</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des notifications</h1>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span className="text-sm text-gray-500">
            {history.filter(h => h.status === 'sent').length} envoyées aujourd'hui
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {renderTemplates()}
        </TabsContent>

        <TabsContent value="history">
          {renderHistory()}
        </TabsContent>

        <TabsContent value="settings">
          {renderSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );
}