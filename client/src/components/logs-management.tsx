import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Filter, Download, Eye, User, Activity } from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface LogsManagementProps {
  userRole: UserRole;
}

interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  timestamp: string;
}

export default function LogsManagement({ userRole }: LogsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Requête pour récupérer les logs d'activité
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ["/api/activity-logs", { 
      page: currentPage, 
      limit: itemsPerPage,
      search: searchTerm,
      action: filterAction,
      entity: filterEntity,
      user: filterUser
    }],
  });

  // Données de démonstration (à remplacer par les vraies données)
  const mockLogs: ActivityLog[] = [
    {
      id: 1,
      userId: 1,
      username: "admin",
      action: "created",
      entity: "reservation",
      entityId: 45,
      details: JSON.stringify({ customerName: "Marie Dupont", date: "2025-07-04", time: "19:30" }),
      timestamp: "2025-07-04T10:30:00Z"
    },
    {
      id: 2,
      userId: 2,
      username: "employe1",
      action: "updated",
      entity: "order",
      entityId: 23,
      details: JSON.stringify({ status: "ready", previousStatus: "preparing" }),
      timestamp: "2025-07-04T10:25:00Z"
    },
    {
      id: 3,
      userId: 1,
      username: "admin",
      action: "deleted",
      entity: "menu_item",
      entityId: 12,
      details: JSON.stringify({ name: "Ancien produit", reason: "Plus en stock" }),
      timestamp: "2025-07-04T10:20:00Z"
    },
    {
      id: 4,
      userId: 2,
      username: "employe1",
      action: "viewed",
      entity: "customer",
      entityId: 78,
      details: JSON.stringify({ customerName: "Jean Martin" }),
      timestamp: "2025-07-04T10:15:00Z"
    },
    {
      id: 5,
      userId: 1,
      username: "admin",
      action: "updated",
      entity: "settings",
      details: JSON.stringify({ setting: "opening_hours", newValue: "08:00-22:00" }),
      timestamp: "2025-07-04T10:10:00Z"
    }
  ];

  const logs = activityLogs?.logs || mockLogs;

  const getActionColor = (action: string) => {
    switch (action) {
      case "created": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "updated": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "deleted": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "viewed": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created": return "Créé";
      case "updated": return "Modifié";
      case "deleted": return "Supprimé";
      case "viewed": return "Consulté";
      default: return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case "reservation": return "Réservation";
      case "order": return "Commande";
      case "menu_item": return "Produit menu";
      case "customer": return "Client";
      case "employee": return "Employé";
      case "settings": return "Paramètres";
      case "user": return "Utilisateur";
      default: return entity;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  const renderDetails = (log: ActivityLog) => {
    const details = parseDetails(log.details);
    if (!details) return null;

    if (typeof details === 'string') {
      return <span className="text-sm text-gray-600 dark:text-gray-400">{details}</span>;
    }

    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {Object.entries(details).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {String(value)}
          </div>
        ))}
      </div>
    );
  };

  const handleExport = () => {
    // Logique d'export des logs
    console.log("Export des logs");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity === filterEntity;
    const matchesUser = filterUser === "all" || log.username === filterUser;

    return matchesSearch && matchesAction && matchesEntity && matchesUser;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historique des actions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Journal de toutes les actions effectuées dans l'administration
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterAction">Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="created">Créé</SelectItem>
                  <SelectItem value="updated">Modifié</SelectItem>
                  <SelectItem value="deleted">Supprimé</SelectItem>
                  <SelectItem value="viewed">Consulté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterEntity">Module</Label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  <SelectItem value="reservation">Réservations</SelectItem>
                  <SelectItem value="order">Commandes</SelectItem>
                  <SelectItem value="menu_item">Menu</SelectItem>
                  <SelectItem value="customer">Clients</SelectItem>
                  <SelectItem value="employee">Employés</SelectItem>
                  <SelectItem value="settings">Paramètres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterUser">Utilisateur</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="employe1">employe1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Journal d'activité ({filteredLogs.length} entrées)
            </CardTitle>
            <div className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des logs...</p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun log trouvé avec ces filtres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <Badge variant="outline">
                          {getEntityLabel(log.entity)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{log.username}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-900 dark:text-white mb-2">
                        <span className="font-medium">
                          {log.username}
                        </span>
                        {" a "}
                        <span className="font-medium">
                          {getActionLabel(log.action).toLowerCase()}
                        </span>
                        {" "}
                        <span className="font-medium">
                          {getEntityLabel(log.entity).toLowerCase()}
                        </span>
                        {log.entityId && (
                          <span className="text-gray-500">
                            {" #" + log.entityId}
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {renderDetails(log)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredLogs.length)} sur {filteredLogs.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}