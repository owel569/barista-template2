import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Calendar } from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface LogsManagementProps {
  userRole: UserRole;
}

export default function LogsManagement({ userRole }: LogsManagementProps) {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["/api/activity-logs"],
  });

  const activityLogs = logs?.logs || [
    {
      id: 1,
      action: "Nouvelle réservation",
      user: "admin",
      timestamp: new Date().toISOString(),
      details: "Réservation créée pour table 4"
    },
    {
      id: 2,
      action: "Modification menu",
      user: "admin",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "Prix du café americano mis à jour"
    },
    {
      id: 3,
      action: "Commande terminée",
      user: "employe1",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: "Commande #1234 marquée comme terminée"
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historique des activités
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Journal des actions et modifications du système
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journal d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.action}
                  </TableCell>
                  <TableCell>
                    {log.user}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {userRole === "employe" && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              L'accès à l'historique complet est limité pour votre rôle.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Statistiques aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Connexions:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span>Actions:</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between">
                <span>Erreurs:</span>
                <span className="font-medium text-red-600">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLogs.slice(0, 3).map((log: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}