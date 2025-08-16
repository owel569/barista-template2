import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, User, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details?: string;
  createdAt: string;
}

const actionStyles: Record<string, { color: string; icon: JSX.Element }> = {
  LOGIN:  { color: 'bg-green-100 text-green-800', icon: <User className="h-4 w-4" /> },
  LOGOUT: { color: 'bg-gray-100 text-gray-800', icon: <User className="h-4 w-4" /> },
  CREATE: { color: 'bg-blue-100 text-blue-800', icon: <Activity className="h-4 w-4" /> },
  UPDATE: { color: 'bg-yellow-100 text-yellow-800', icon: <Activity className="h-4 w-4" /> },
  DELETE: { color: 'bg-red-100 text-red-800', icon: <Activity className="h-4 w-4" /> },
  VIEW:   { color: 'bg-purple-100 text-purple-800', icon: <Activity className="h-4 w-4" /> },
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        search: searchTerm,
        action: actionFilter,
        user: userFilter,
      });
      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const json = await res.json();
      setLogs(json.data);
      setTotal(json.total);
    } catch (err) {
      console.error("Erreur lors du chargement des logs :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, searchTerm, actionFilter, userFilter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date invalide';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  };

  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des activités</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {Object.keys(actionStyles).map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={(val) => { setUserFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par utilisateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {[...new Set(logs.map(l => l.userId))].map(userId => (
                <SelectItem key={userId} value={userId.toString()}>
                  Utilisateur {userId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Aucun log trouvé
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const { color, icon } = actionStyles[log.action] || actionStyles['VIEW'];
                return (
                  <TableRow key={log.id}>
                    <TableCell>Utilisateur {log.userId}</TableCell>
                    <TableCell>
                      <Badge className={color}>
                        <div className="flex items-center gap-1">
                          {icon}
                          <span>{log.action}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{log.details || "-"}</TableCell>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
