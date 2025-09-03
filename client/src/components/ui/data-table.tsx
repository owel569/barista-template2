"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from "@tanstack/react-table"
import { ChevronDown, Search, X, MoreHorizontal } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { sanitizeString } from "@/lib/security"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "./loading-spinner"

const dataTableVariants = cva(
  "w-full space-y-4",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border rounded-lg",
        striped: "[&_tbody_tr:nth-child(odd)]:bg-muted/50",
        compact: "text-sm",
      },
      density: {
        comfortable: "[&_td]:py-4 [&_th]:py-4",
        default: "[&_td]:py-2 [&_th]:py-3", 
        compact: "[&_td]:py-1 [&_th]:py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      density: "default",
    },
  }
)

export interface DataTableProps<TData, TValue> 
  extends VariantProps<typeof dataTableVariants> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  emptyState?: {
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  pagination?: {
    pageSize?: number
    showPagination?: boolean
    pageSizeOptions?: number[]
  }
  selection?: {
    enabled?: boolean
    onSelectionChange?: (selectedRows: TData[]) => void
  }
  sorting?: {
    enabled?: boolean
    defaultSort?: SortingState
  }
  filtering?: {
    enabled?: boolean
    globalFilter?: boolean
  }
  className?: string
  onRowClick?: (row: TData) => void
  rowActions?: (row: TData) => React.ReactNode
}

export { dataTableVariants };

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Rechercher...",
  isLoading = false,
  emptyState,
  pagination = { showPagination: true, pageSize: 10 },
  selection = { enabled: false },
  sorting = { enabled: true },
  filtering = { enabled: true, globalFilter: false },
  variant,
  density,
  className,
  onRowClick,
  rowActions,
}: DataTableProps<TData, TValue>) {
  // États avec types corrects
  const [sortingState, setSortingState] = React.useState<SortingState>(
    sorting.defaultSort ?? []
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(Object.create(null))
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState<string>("")
  
  // Configuration sécurisée de la pagination
  const [paginationState, setPaginationState] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: Math.min(Math.max(pagination.pageSize ?? 10, 5), 100), // Limite de sécurité
  })

  // Configuration de la table avec types stricts
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPaginationState,
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: filtering.globalFilter ? globalFilter : undefined,
      pagination: paginationState,
    },
    enableRowSelection: selection.enabled,
    enableSorting: sorting.enabled,
    enableColumnFilters: filtering.enabled ?? false,
    enableGlobalFilter: filtering.globalFilter ?? false,
  })

  // Callback sécurisé pour la sélection
  const handleSelectionChange = React.useCallback(() => {
    if (selection.onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      selection.onSelectionChange(selectedRows)
    }
  }, [table, selection.onSelectionChange])

  // Effet pour notifier les changements de sélection
  React.useEffect(() => {
    handleSelectionChange()
  }, [rowSelection, handleSelectionChange])

  // Gestion sécurisée du filtre global
  const handleGlobalFilterChange = React.useCallback((value: string) => {
    const sanitizedValue = sanitizeString(value, { maxLength: 100 })
    setGlobalFilter(sanitizedValue)
  }, [])

  // Gestion sécurisée du filtre de colonne
  const handleColumnFilterChange = React.useCallback((columnId: string, value: string) => {
    const sanitizedValue = sanitizeString(value, { maxLength: 100 })
    table.getColumn(columnId)?.setFilterValue(sanitizedValue)
  }, [table])

  // Rendu du state vide sécurisé
  const renderEmptyState = () => {
    if (!emptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            Aucun résultat trouvé.
          </TableCell>
        </TableRow>
      )
    }

    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-32">
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold mb-2">
              {sanitizeString(emptyState.title, { maxLength: 100 })}
            </h3>
            {emptyState.description && (
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {sanitizeString(emptyState.description, { maxLength: 200 })}
              </p>
            )}
            {emptyState.action && (
              <Button onClick={emptyState.action.onClick} variant="outline">
                {sanitizeString(emptyState.action.label, { maxLength: 50 })}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(dataTableVariants({ variant, density }), className)}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" showLabel label="Chargement des données..." />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(dataTableVariants({ variant, density }), className)}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Filtre global */}
          {filtering.globalFilter && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherche globale..."
                value={globalFilter}
                onChange={(event) => handleGlobalFilterChange(event.target.value)}
                className="pl-8 max-w-sm"
                maxLength={100}
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setGlobalFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Filtre de colonne spécifique */}
          {searchKey && filtering.enabled && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  handleColumnFilterChange(searchKey, event.target.value)
                }
                className="pl-8 max-w-sm"
                maxLength={100}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Sélection info */}
          {selection.enabled && table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} sur{" "}
              {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
            </div>
          )}

          {/* Menu de visibilité des colonnes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Colonnes <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
                {rowActions && (
                  <TableHead className="w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    "transition-colors"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell>
                      <div className="flex items-center justify-end">
                        {rowActions(row.original)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              renderEmptyState()
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.showPagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Lignes par page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                const pageSize = Math.min(Math.max(Number(e.target.value), 5), 100)
                table.setPageSize(pageSize)
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
            >
              {(pagination.pageSizeOptions ?? [10, 20, 30, 40, 50]).map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Aller à la première page</span>
                {"<<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Aller à la page précédente</span>
                {"<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Aller à la page suivante</span>
                {">"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Aller à la dernière page</span>
                {">>"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook pour utiliser DataTable de manière sécurisée
export function useDataTable<TData>() {
  const [data, setData] = React.useState<TData[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadData = React.useCallback(async (
    fetchFn: () => Promise<TData[]>
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshData = React.useCallback(async (
    fetchFn: () => Promise<TData[]>
  ) => {
    await loadData(fetchFn)
  }, [loadData])

  return {
    data,
    isLoading,
    error,
    setData,
    loadData,
    refreshData,
  }
}
