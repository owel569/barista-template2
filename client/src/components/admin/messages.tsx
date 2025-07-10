import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ContactMessage } from '../../../types/admin';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, MessageSquare, Eye, Reply, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessagesProps {
  userRole?: 'directeur' | 'employe';
}

export default function Messages({ userRole = 'directeur' }: MessagesProps) {
  const { hasPermission } = usePermissions(userRole);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/admin/messages'],
    retry: 3,
    retryDelay: 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/admin/messages/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      toast({
        title: 'Succès',
        description: 'Statut du message mis à jour',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive',
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, response }: { id: number; response: string }) =>
      apiRequest(`/api/admin/messages/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      setResponse('');
      setIsDialogOpen(false);
      toast({
        title: 'Succès',
        description: 'Réponse envoyée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de la réponse',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/messages/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      toast({
        title: 'Succès',
        description: 'Message supprimé avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du message',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (messageId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: messageId, status: newStatus });
  };

  const handleReply = () => {
    if (!selectedMessage || !response.trim()) return;
    replyMutation.mutate({ id: selectedMessage.id, response: response.trim() });
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau': return 'bg-blue-100 text-blue-800';
      case 'non_lu': return 'bg-red-100 text-red-800';
      case 'lu': return 'bg-yellow-100 text-yellow-800';
      case 'traite': return 'bg-green-100 text-green-800';
      case 'archive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculer les statistiques
  const totalMessages = messages.length;
  const unreadMessages = messages.filter(msg => msg.status === 'nouveau' || msg.status === 'non_lu').length;
  const treatedMessages = messages.filter(msg => msg.status === 'traite').length;

  if (isLoading) {
    return <div className="p-6">Chargement des messages...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Messages</h1>
          <p className="text-muted-foreground">Gérez tous les messages de contact</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Non Lus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Reply className="h-4 w-4" />
              Traités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{treatedMessages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email ou sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="non_lu">Non lu</SelectItem>
                <SelectItem value="lu">Lu</SelectItem>
                <SelectItem value="traite">Traité</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages de Contact ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{message.name || 'Anonyme'}</div>
                      <div className="text-sm text-muted-foreground">{message.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {message.subject}
                  </TableCell>
                  <TableCell>
                    {message.createdAt ? (
                      isNaN(new Date(message.createdAt).getTime()) ? 
                        'Date invalide' : 
                        format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
                    ) : 'Pas de date'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(message.status)}>
                      {message.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMessage(message);
                          setResponse(message.response || '');
                          setIsDialogOpen(true);
                          if (message.status === 'nouveau' || message.status === 'non_lu') {
                            handleStatusChange(message.id, 'lu');
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission('messages', 'edit') && (
                        <Select
                          value={message.status}
                          onValueChange={(value) => handleStatusChange(message.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nouveau">Nouveau</SelectItem>
                            <SelectItem value="non_lu">Non lu</SelectItem>
                            <SelectItem value="lu">Lu</SelectItem>
                            <SelectItem value="traite">Traité</SelectItem>
                            <SelectItem value="archive">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {hasPermission('messages', 'delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMessages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun message trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails et réponse */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message de {selectedMessage?.name || 'Anonyme'}</DialogTitle>
            <DialogDescription>
              Consulter et répondre au message
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Expéditeur</h3>
                  <p>{selectedMessage.name || 'Anonyme'}</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-sm text-muted-foreground">{selectedMessage.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">Détails</h3>
                  <p>Date: {format(new Date(selectedMessage.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                  <p>Statut: <Badge className={getStatusColor(selectedMessage.status)}>{selectedMessage.status}</Badge></p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Sujet</h3>
                <p>{selectedMessage.subject}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Message</h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {hasPermission('messages', 'edit') && (
                <div>
                  <h3 className="font-semibold">Réponse</h3>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    rows={4}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleReply} disabled={!response.trim()}>
                      <Reply className="h-4 w-4 mr-2" />
                      Envoyer la réponse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}