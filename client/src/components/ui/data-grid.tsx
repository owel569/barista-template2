import React, { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, Download, MoreHorizontal } from 'lucide-react';

export interface DataGridColumn<T = Record<string, unknown>> {
  key: keyof T;
  id?: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  accessorKey?: keyof T extends string | number | symbol ? keyof T : never;
  accessor?: (row: T) => unknown;
  type?: 'string' | 'number' | 'date' | 'boolean';
  cell?: (props: { value: T[keyof T]; row: T; column: DataGridColumn<T> }) => React.ReactNode;
  header?: React.ComponentType<{ column: DataGridColumn<T> }>;
  footer?: React.ComponentType<{ column: DataGridColumn<T> }>;
  sortFn?: (a: T, b: T) => number;
  filterFn?: (value: T[keyof T], filterValue: string) => boolean;
  format?: (value: T[keyof T]) => string;
}

export interface DataGridProps<T = Record<string, unknown>> {
  data: T[];
  columns: DataGridColumn<T>[];
  className?: string;
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
  searchPlaceholder?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
  virtualScrolling?: boolean;
  height?: number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export function DataGrid<T = Record<string, unknown>>({
  data,
  columns,
  className,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showFilters = false,
  showExport = false,
  selectable = false,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  onRowClick,
  onSelectionChange,
  onExport,
  searchPlaceholder = "Rechercher...",
  stickyHeader = false,
  striped = false,
  bordered = false,
  compact = false,
  virtualScrolling = false,
  height = 400,
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ columnId: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, unknown>>(Object.create(null));

  const tableRef = useRef<HTMLTableElement>(null);

  // Fonction pour obtenir la valeur d'une cellule
  const getCellValue = useCallback((row: T, column: DataGridColumn<T>) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    if (column.accessorKey) {
      return (row as any)[column.accessorKey];
    }
    return '';
  }, []);

  // Données filtrées et triées
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Filtrage par recherche globale
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = getCellValue(row, column);
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Filtrage par colonnes
    Object.entries(columnFilters).forEach(([columnId, filterValue]) => {
      if (filterValue !== undefined && filterValue !== '') {
        const column = columns.find(col => col.id === columnId);
        if (column) {
          filtered = filtered.filter(row => {
            const value = getCellValue(row, column);
            if (column.type === 'boolean') {
              return Boolean(value) === Boolean(filterValue);
            }
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          });
        }
      }
    });

    // Tri
    if (sortState.columnId && sortState.direction) {
      const column = columns.find(col => col.id === sortState.columnId);
      if (column) {
        filtered.sort((a, b) => {
          const aValue = getCellValue(a, column);
          const bValue = getCellValue(b, column);

          let result = 0;
          if (column.type === 'number') {
            result = Number(aValue) - Number(bValue);
          } else if (column.type === 'date') {
            result = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            result = String(aValue).localeCompare(String(bValue));
          }

          return sortState.direction === 'asc' ? result : -result;
        });
      }
    }

    return filtered;
  }, [data, searchTerm, sortState, columnFilters, columns, getCellValue]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination ? processedData.slice(startIndex, endIndex) : processedData;

  // Gestion du tri
  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSortState(prev => {
      if (prev.columnId === columnId) {
        if (prev.direction === 'asc') return { columnId, direction: 'desc' };
        if (prev.direction === 'desc') return { columnId: null, direction: null };
      }
      return { columnId, direction: 'asc' };
    });
  }, [columns]);

  // Gestion de la sélection
  const handleRowSelection = useCallback((index: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((_, index) => startIndex + index)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData, startIndex]);

  // Effet pour notifier les changements de sélection
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(selectedRows)
        .map(index => data[index])
        .filter((item): item is T => item !== undefined);
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange]);

  // Rendu d'une cellule
  const renderCell = useCallback((row: T, column: DataGridColumn<T>, rowIndex: number) => {
    const value = getCellValue(row, column);

    if (column.cell) {
      return column.cell({ value, row, column });
    }

    if (column.format) {
      return column.format(value);
    }

    switch (column.type) {
      case 'boolean':
        return <Checkbox checked={Boolean(value)} disabled />;
      case 'number':
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value || '');
    }
  }, [getCellValue]);

  // Export des données
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(processedData);
    }
  }, [processedData, onExport]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton pour la barre d'outils */}
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        {/* Skeleton pour le tableau */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Barre d'outils */}
      {(showSearch || showFilters || showExport) && (
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center flex-1">
            {showSearch && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {selectedRows.size > 0 && (
              <Badge variant="secondary">
                {selectedRows.size} sélectionné{selectedRows.size > 1 ? 's' : ''}
              </Badge>
            )}
            {showExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className={cn(
        "relative border rounded-lg",
        bordered && "border-border",
        !bordered && "border-transparent"
      )}>
        <div className={cn(
          "overflow-auto",
          virtualScrolling && "max-h-96"
        )}>
          <table ref={tableRef} className="w-full">
            <thead className={cn(
              "bg-muted/50",
              stickyHeader && "sticky top-0 z-10"
            )}>
              <tr>
                {selectable && (
                  <th className="w-12 p-2">
                    <Checkbox
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column, idx) => (
                  <th
                    key={column.id ?? String(column.key ?? idx)}
                    className={cn(
                      "p-3 text-left text-sm font-medium text-muted-foreground",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right",
                      column.sortable && "cursor-pointer hover:text-foreground transition-colors",
                      compact && "p-2"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                    onClick={() => column.sortable && handleSort(column.id ?? String(column.key ?? idx))}
                  >
                    <div className="flex items-center gap-2">
                      {typeof column.header === 'function' ? React.createElement(column.header, { column }) : column.title}
                      {column.sortable && sortState.columnId === (column.id ?? String(column.key ?? idx)) && (
                        <span className="text-xs">
                          {sortState.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const globalIndex = startIndex + index;
                  const isSelected = selectedRows.has(globalIndex);

                  return (
                    <tr
                      key={globalIndex}
                      className={cn(
                        "border-b transition-colors",
                        striped && index % 2 === 0 && "bg-muted/25",
                        onRowClick && "cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-primary/10"
                      )}
                      onClick={() => onRowClick?.(row, globalIndex)}
                    >
                      {selectable && (
                        <td className="p-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleRowSelection(globalIndex, checked as boolean)}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={`${globalIndex}-${column.id}`}
                          className={cn(
                            "p-3 text-sm",
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right",
                            compact && "p-2"
                          )}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                        >
                          {renderCell(row, column, globalIndex)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Affichage {startIndex + 1} à {Math.min(endIndex, processedData.length)} sur {processedData.length} résultats
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook pour utiliser le DataGrid
export function useDataGrid<T = Record<string, unknown>>(
  initialData: T[] = [],
  initialColumns: DataGridColumn<T>[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [columns, setColumns] = useState<DataGridColumn<T>[]>(initialColumns);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const addRow = useCallback((row: T) => {
    setData(prev => [...prev, row]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index: number, updates: Partial<T>) => {
    setData(prev => prev.map((row, i) => i === index ? { ...row, ...updates } : row));
  }, []);

  const addColumn = useCallback((column: DataGridColumn<T>) => {
    setColumns(prev => [...prev, column]);
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);

  const updateColumn = useCallback((columnId: string, updates: Partial<DataGridColumn<T>>) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, ...updates } : col));
  }, []);

  return {
    data,
    setData,
    columns,
    setColumns,
    selectedRows,
    setSelectedRows,
    addRow,
    removeRow,
    updateRow,
    addColumn,
    removeColumn,
    updateColumn,
  };
}

export { DataGrid as default };