import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Calendar, MessageSquare, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface ContactManagementProps {
  userRole: string;
}

export default function ContactManagement({ userRole }: ContactManagementProps) {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact/messages'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      apiRequest(`/api/contact/messages/${data.id}/status`, "PATCH", { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/messages'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut du message a été modifié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (messageId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: messageId, status: newStatus });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <MessageSquare className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolu";
      case "closed":
        return "Fermé";
      default:
        return "En attente";
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filter === "all") return true;
    return message.status === filter;
  });

  const getSubjectCategory = (subject: string) => {
    if (subject.toLowerCase().includes("question")) return "Question";
    if (subject.toLowerCase().includes("suggestion")) return "Suggestion";
    if (subject.toLowerCase().includes("privatiser") || subject.toLowerCase().includes("privé")) return "Privatisation";
    if (subject.toLowerCase().includes("réservation")) return "Réservation";
    if (subject.toLowerCase().includes("menu")) return "Menu";
    return "Autre";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Chargement des messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gestion des Messages de Contact
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les messages</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="closed">Fermés</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              {filteredMessages.length} message(s) trouvé(s)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun message de contact trouvé.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <Card key={message.id} className="border-l-4 border-l-coffee-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{message.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {message.email}
                            </span>
                            {message.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {message.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(message.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusIcon(message.status)}
                          <span className="ml-1">{getStatusLabel(message.status)}</span>
                        </Badge>
                        <Badge variant="outline">
                          {getSubjectCategory(message.subject)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-coffee-dark mb-1">Sujet: {message.subject}</h4>
                      <p className="text-gray-700 line-clamp-2">{message.message}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir détails
                      </Button>
                      
                      <Select
                        value={message.status}
                        onValueChange={(newStatus) => handleStatusChange(message.id, newStatus)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="resolved">Résolu</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-coffee-dark">Nom:</label>
                  <p>{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="font-semibold text-coffee-dark">Email:</label>
                  <p>{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <label className="font-semibold text-coffee-dark">Téléphone:</label>
                    <p>{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <label className="font-semibold text-coffee-dark">Date:</label>
                  <p>{format(new Date(selectedMessage.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</p>
                </div>
              </div>
              
              <div>
                <label className="font-semibold text-coffee-dark">Sujet:</label>
                <p>{selectedMessage.subject}</p>
              </div>
              
              <div>
                <label className="font-semibold text-coffee-dark">Message:</label>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              
              <div>
                <label className="font-semibold text-coffee-dark">Statut actuel:</label>
                <Badge className={`${getStatusColor(selectedMessage.status)} mt-2`}>
                  {getStatusIcon(selectedMessage.status)}
                  <span className="ml-1">{getStatusLabel(selectedMessage.status)}</span>
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}