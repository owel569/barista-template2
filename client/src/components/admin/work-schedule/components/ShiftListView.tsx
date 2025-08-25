import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Clock,
  User,
  MapPin,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { ShiftListViewProps, Shift } from '../types/schedule.types';
import { 
  formatDuration, 
  formatCurrency, 
  SHIFT_STATUS_COLORS,
  DEPARTMENTS,
  POSITIONS 
} from '../utils/schedule.utils';

const ShiftListView: React.FC<ShiftListViewProps> = ({
  shifts,
  employees,
  onShiftEdit,
  onShiftDelete,
  selectedFilters,
  sorting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Filtrage par recherche
  const filteredShifts = shifts.filter((shift) => {
    const employee = employees.find((e: any) => e.id === shift.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();

    return (
      employeeName.includes(searchLower) ||
      shift.position.toLowerCase().includes(searchLower) ||
      shift.department.toLowerCase().includes(searchLower) ||
      shift.status.toLowerCase().includes(searchLower) ||
      shift.date.includes(searchTerm)
    );
  });

  // Formatage des colonnes
  const formatColumnHeader = (field: keyof Shift, label: string) => {
    const isSorted = sorting.field === field;
    const isAsc = sorting.direction === 'asc';

    return (
      <div className="flex items-center space-x-1 cursor-pointer">
        <span>{label}</span>
        {isSorted ? (
          isAsc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    );
  };

  // Obtenir les informations de l'employé
  const getEmployeeInfo = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? {
      name: `${employee.firstName} ${employee.lastName}`,
      avatar: employee.avatar,
      position: employee.position
    } : {
      name: 'Inconnu',
      avatar: undefined,
      position: 'Inconnu'
    };
  };

  // Formatage du statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programmé', variant: 'secondary' as const },
      confirmed: { label: 'Confirmé', variant: 'default' as const },
      in_progress: { label: 'En cours', variant: 'outline' as const },
      completed: { label: 'Terminé', variant: 'secondary' as const },
      cancelled: { label: 'Annulé', variant: 'destructive' as const },
      no_show: { label: 'Absent', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

    return (
      <Badge 
        variant={config.variant}
        className="text-xs"
        style={{ 
          backgroundColor: SHIFT_STATUS_COLORS[status as keyof typeof SHIFT_STATUS_COLORS] + '20',
          color: SHIFT_STATUS_COLORS[status as keyof typeof SHIFT_STATUS_COLORS]
        }}
      >
        {config.label}
      </Badge>
    );
  };

  // Statistiques de la liste
  const listStats = {
    total: filteredShifts.length,
    totalHours: filteredShifts.reduce((sum: any, shift: any) => sum + shift.totalHours, 0),
    totalCost: filteredShifts.reduce((sum: any, shift: any) => sum + shift.totalPay, 0),
    uniqueEmployees: new Set(filteredShifts.map((s: any) => s.employeeId)).size,
    byStatus: filteredShifts.reduce((acc: any, shift: any) => {
      acc[shift.status] = (acc[shift.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Composant de détails du shift
  const ShiftDetailsModal = ({ shift }: { shift: Shift }) => {
    const employee = getEmployeeInfo(shift.employeeId);
    const department = DEPARTMENTS.find((d: { id: string; name: string; color: string }) => d.id === shift.department);
    const position = POSITIONS.find((p: { id: string; name: string; color: string }) => p.id === shift.position);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Détails du shift #{shift.id}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedShift(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Employé</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{employee.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(shift.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Horaires</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{shift.startTime} - {shift.endTime}</span>
                  <span className="text-sm text-gray-500">
                    ({formatDuration(shift.totalHours)})
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Poste</label>
                <div className="flex items-center space-x-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{position?.name || shift.position}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Département</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: department?.color }}
                  />
                  <span>{department?.name || shift.department}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Statut</label>
                <div className="mt-1">
                  {getStatusBadge(shift.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Taux horaire</label>
                <div className="mt-1">
                  {formatCurrency(shift.hourlyRate)}/h
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Salaire total</label>
                <div className="mt-1 font-medium">
                  {formatCurrency(shift.totalPay)}
                </div>
              </div>
            </div>

            {shift.overtimeHours && shift.overtimeHours > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Heures supplémentaires: {formatDuration(shift.overtimeHours)}
                  </span>
                </div>
              </div>
            )}

            {shift.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {shift.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onShiftEdit(shift)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => onShiftDelete(shift.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des shifts</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
            <span>{listStats.total} shifts</span>
            <span>{formatDuration(listStats.totalHours)} heures</span>
            <span>{listStats.uniqueEmployees} employés</span>
            <span>{formatCurrency(listStats.totalCost)}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Tableau des shifts */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('date', 'Date')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('employeeId', 'Employé')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('startTime', 'Horaires')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('position', 'Poste')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('department', 'Département')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('status', 'Statut')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('totalHours', 'Durée')}
                </TableHead>
                <TableHead className="cursor-pointer">
                  {formatColumnHeader('totalPay', 'Salaire')}
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift: any) => {
                const employee = getEmployeeInfo(shift.employeeId);
                const department = DEPARTMENTS.find((d: { id: string; name: string; color: string }) => d.id === shift.department);
                const position = POSITIONS.find((p: { id: string; name: string; color: string }) => p.id === shift.position);

                return (
                  <TableRow 
                    key={shift.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => setSelectedShift(shift)}
                  >
                    <TableCell>
                      {new Date(shift.date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.position}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{position?.name || shift.position}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: department?.color }}
                        />
                        <span>{department?.name || shift.department}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(shift.status)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{formatDuration(shift.totalHours)}</span>
                        {shift.overtimeHours && shift.overtimeHours > 0 && (
                          <Badge variant="outline" className="text-xs text-yellow-600">
                            +{formatDuration(shift.overtimeHours)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      {formatCurrency(shift.totalPay)}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedShift(shift)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShiftEdit(shift)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onShiftDelete(shift.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredShifts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun shift trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {selectedShift && (
        <ShiftDetailsModal shift={selectedShift} />
      )}
    </div>
  );
};

export default ShiftListView;