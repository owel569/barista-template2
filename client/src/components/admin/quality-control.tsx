
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QualityCheck } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ClipboardCheck, Plus, Edit, Trash2, Camera, 
  Star, AlertTriangle, CheckCircle, Eye, FileText,
  TrendingUp, Award, Search, Filter, Calendar,
  User, Clock, MapPin, Download, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface QualityCheckFormData {
  category: string;
  item: string;
  inspector: string;
  score: number;
  maxScore: number;
  notes?: string;
  correctionActions: string[];
}

const qualitySchema = z.object({
  category: z.string().min(1, "Catégorie requise"),
  item: z.string().min(1, "Article requis"),
  inspector: z.string().min(1, "Inspecteur requis"),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),
  notes: z.string().optional(),
  correctionActions: z.array(z.string()).default([]),
});

const categories = [
  'Hygiène',
  'Sécurité alimentaire',
  'Service client',
  'Propreté',
  'Équipement',
  'Formation staff',
  'Procédures',
  'Conformité'
];

const items = {
  'Hygiène': ['Lavage des mains', 'Nettoyage surfaces', 'Gants jetables', 'Masques'],
  'Sécurité alimentaire': ['Température frigo', 'DLC produits', 'Chaîne du froid', 'Contamination croisée'],
  'Service client': ['Accueil client', 'Temps d\'attente', 'Présentation', 'Résolution problèmes'],
  'Propreté': ['Sol', 'Tables', 'Toilettes', 'Vitres', 'Éclairage'],
  'Équipement': ['Machine à café', 'Frigo', 'Four', 'Caisse', 'POS'],
  'Formation staff': ['Connaissance menu', 'Procédures', 'Sécurité', 'Service'],
  'Procédures': ['Ouverture', 'Fermeture', 'Urgence', 'Nettoyage'],
  'Conformité': ['Licences', 'Assurances', 'Affichage obligatoire', 'Registres']
};

export default function QualityControl(): JSX.Element {
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [correctionAction, setCorrectionAction] = useState('');
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const { data: qualityChecks = [], isLoading } = useQuery<QualityCheck[]>({
    queryKey: ['qualityChecks'],
    queryFn: () => apiRequest('/api/admin/quality-checks'),
  });

  const createCheckMutation = useMutation({
    mutationFn: (data: QualityCheckFormData) => 
      apiRequest('/api/admin/quality-checks', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle créé", 
        description: "Le contrôle qualité a été créé avec succès"
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le contrôle qualité",
        variant: "destructive",
      });
    }
  });

  const updateCheckMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => 
      apiRequest(`/api/admin/quality-checks/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle mis à jour", 
        description: "Le contrôle qualité a été modifié"
      });
    }
  });

  const deleteCheckMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/quality-checks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle supprimé", 
        description: "Le contrôle qualité a été supprimé"
      });
    }
  });

  const form = useForm<QualityCheckFormData>({
    resolver: zodResolver(qualitySchema),
    defaultValues: {
      category: '',
      item: '',
      inspector: '',
      score: 0,
      maxScore: 100,
      notes: '',
      correctionActions: [],
    },
  });

  const onSubmit = (data: QualityCheckFormData) => {
    createCheckMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <Star className="h-4 w-4" />;
      case 'average': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const calculateStatus = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  const filteredChecks = useMemo(() => {
    return qualityChecks.filter((check) => {
      const categoryMatch = filterCategory === 'all' || check.category === filterCategory;
      const statusMatch = filterStatus === 'all' || check.status === filterStatus;
      const searchMatch = !searchTerm || 
        check.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.category.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatch && statusMatch && searchMatch;
    });
  }, [qualityChecks, filterCategory, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = qualityChecks.length;
    const completed = qualityChecks.filter(c => c.completed).length;
    const averageScore = qualityChecks.length > 0 
      ? qualityChecks.reduce((sum, c) => sum + (c.score / c.maxScore * 100), 0) / qualityChecks.length
      : 0;
    const pending = qualityChecks.filter(c => !c.completed).length;

    return { total, completed, averageScore, pending };
  }, [qualityChecks]);

  const addCorrectionAction = () => {
    if (correctionAction.trim()) {
      const currentActions = form.getValues('correctionActions') || [];
      form.setValue('correctionActions', [...currentActions, correctionAction.trim()]);
      setCorrectionAction('');
    }
  };

  const removeCorrectionAction = (index: number) => {
    const currentActions = form.getValues('correctionActions') || [];
    form.setValue('correctionActions', currentActions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!hasPermission('quality', 'view')) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Vous n'avez pas accès au contrôle qualité.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contrôle Qualité</h2>
          <p className="text-sm text-gray-500">
            Gestion des contrôles qualité et conformité
          </p>
        </div>
        {hasPermission('quality', 'create') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Contrôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Contrôle Qualité</DialogTitle>
                <DialogDescription>
                  Enregistrez un nouveau contrôle qualité
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCategory(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="item"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un article" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCategory && items[selectedCategory as keyof typeof items]?.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="inspector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspecteur</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom de l'inspecteur" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score obtenu</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score maximum</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Observations et commentaires..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Actions correctives</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={correctionAction}
                          onChange={(e) => setCorrectionAction(e.target.value)}
                          placeholder="Ajouter une action corrective..."
                          onKeyPress={(e) => e.key === 'Enter' && addCorrectionAction()}
                        />
                        <Button type="button" onClick={addCorrectionAction}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {form.watch('correctionActions')?.map((action, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{action}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCorrectionAction(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCheckMutation.isPending}
                    >
                      {createCheckMutation.isPending ? (
                        'Création...'
                      ) : (
                        'Créer le Contrôle'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Contrôles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Score Moyen</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Bon</SelectItem>
                <SelectItem value="average">Moyen</SelectItem>
                <SelectItem value="poor">Mauvais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des contrôles */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles Qualité</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Inspecteur</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((check) => {
                const status = calculateStatus(check.score, check.maxScore);
                const percentage = (check.score / check.maxScore) * 100;

                return (
                  <TableRow key={check.id}>
                    <TableCell>
                      {format(new Date(check.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{check.category}</Badge>
                    </TableCell>
                    <TableCell>{check.item}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {check.inspector}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {check.score}/{check.maxScore}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                        <span className="ml-1 capitalize">{status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCheck(check)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission('quality', 'update') && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('quality', 'delete') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteCheckMutation.mutate(check.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      {selectedCheck && (
        <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Détails du Contrôle #{selectedCheck.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Informations</h4>
                  <p><strong>Catégorie:</strong> {selectedCheck.category}</p>
                  <p><strong>Article:</strong> {selectedCheck.item}</p>
                  <p><strong>Inspecteur:</strong> {selectedCheck.inspector}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedCheck.date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
                <div>
                  <h4 className="font-medium">Évaluation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span>Score: {selectedCheck.score}/{selectedCheck.maxScore}</span>
                      <Badge className={getStatusColor(selectedCheck.status)}>
                        {selectedCheck.status}
                      </Badge>
                    </div>
                    <Progress 
                      value={(selectedCheck.score / selectedCheck.maxScore) * 100} 
                      className="h-3"
                    />
                  </div>
                </div>
              </div>

              {selectedCheck.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedCheck.notes}
                  </p>
                </div>
              )}

              {selectedCheck.correctionActions.length > 0 && (
                <div>
                  <h4 className="font-medium">Actions Correctives</h4>
                  <div className="space-y-1">
                    {selectedCheck.correctionActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCheck.photos && selectedCheck.photos.length > 0 && (
                <div>
                  <h4 className="font-medium">Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCheck.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
