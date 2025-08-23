"use client"

import * as React from "react"
import { Check, ChevronDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiSelectOption {
  readonly label: string
  readonly value: string
  readonly icon?: React.ComponentType<{ className?: string }>
  readonly disabled?: boolean
}

interface MultiSelectProps {
  options: readonly MultiSelectOption[]
  selected?: readonly string[]
  onSelectedChange?: (selected: readonly string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelected?: number
  searchable?: boolean
  clearable?: boolean
  emptyMessage?: string
  maxDisplay?: number
  "data-testid"?: string
  id?: string
}

export function MultiSelect({
  options,
  selected = [],
  onSelectedChange,
  placeholder = "Sélectionner des options...",
  className,
  disabled = false,
  maxSelected,
  searchable = true,
  clearable = true,
  emptyMessage = "Aucune option trouvée.",
  maxDisplay = 3,
  "data-testid": dataTestId,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Validation des options pour éviter les doublons
  const validatedOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return options.filter(option => {
      if (!option.value || seen.has(option.value)) {
        return false
      }
      seen.add(option.value)
      return true
    })
  }, [options])

  // Filtrage sécurisé des options
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !search.trim()) return validatedOptions
    
    const searchTerm = search.toLowerCase().trim()
    return validatedOptions.filter((option) =>
      option.label.toLowerCase().includes(searchTerm)
    )
  }, [validatedOptions, search, searchable])

  // Validation des options sélectionnées
  const validatedSelected = React.useMemo(() => {
    const validValues = new Set(validatedOptions.map(opt => opt.value))
    return selected.filter(value => validValues.has(value))
  }, [selected, validatedOptions])

  const selectedOptions = React.useMemo(() => 
    validatedOptions.filter((option) => validatedSelected.includes(option.value)),
    [validatedOptions, validatedSelected]
  )

  const isMaxReached = maxSelected ? validatedSelected.length >= maxSelected : false

  // Handler sécurisé pour la sélection
  const handleSelect = React.useCallback((value: string) => {
    if (!value || disabled) return
    
    const newSelected = validatedSelected.includes(value)
      ? validatedSelected.filter((item) => item !== value)
      : isMaxReached 
        ? validatedSelected
        : [...validatedSelected, value]
    
    onSelectedChange?.(newSelected)
  }, [validatedSelected, onSelectedChange, isMaxReached, disabled])

  // Handler sécurisé pour la suppression
  const handleRemove = React.useCallback((value: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!value || disabled) return
    
    const newSelected = validatedSelected.filter((item) => item !== value)
    onSelectedChange?.(newSelected)
  }, [validatedSelected, onSelectedChange, disabled])

  // Handler sécurisé pour clear all
  const handleClear = React.useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (disabled) return
    
    onSelectedChange?.([])
  }, [onSelectedChange, disabled])

  // Gestion sécurisée de la recherche
  const handleSearchChange = React.useCallback((value: string) => {
    // Sanitisation basique de la recherche
    const sanitizedValue = value.replace(/[<>]/g, '').slice(0, 100)
    setSearch(sanitizedValue)
  }, [])

  const displayedOptions = selectedOptions.slice(0, maxDisplay)
  const remainingCount = selectedOptions.length - maxDisplay

  const componentId = id || React.useId()
  const triggerId = `${componentId}-trigger`
  const contentId = `${componentId}-content`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={triggerId}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={contentId}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
          disabled={disabled}
          data-testid={dataTestId}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <>
                {displayedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 max-w-[200px]"
                  >
                    {option.icon && (
                      <option.icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                    )}
                    <span className="truncate">{option.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent shrink-0"
                      onClick={(e) => handleRemove(option.value, e)}
                      aria-label={`Supprimer ${option.label}`}
                      tabIndex={-1}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    +{remainingCount} de plus
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {clearable && selectedOptions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClear}
                aria-label="Tout effacer"
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        id={contentId}
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        role="listbox"
        aria-labelledby={triggerId}
      >
        <Command shouldFilter={false}>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              <CommandInput
                placeholder="Rechercher..."
                value={search}
                onValueChange={handleSearchChange}
                className="border-0 focus:ring-0"
                maxLength={100}
              />
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = validatedSelected.includes(option.value)
                const isDisabled = option.disabled || (!isSelected && isMaxReached)
                
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      if (!isDisabled) {
                        handleSelect(option.value)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={isDisabled}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    {option.icon && (
                      <option.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {maxSelected && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {validatedSelected.length}/{maxSelected} sélectionnés
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Version contrôlée du MultiSelect avec validation renforcée
interface ControlledMultiSelectProps extends Omit<MultiSelectProps, 'selected' | 'onSelectedChange'> {
  value?: readonly string[]
  onValueChange?: (value: readonly string[]) => void
  defaultValue?: readonly string[]
}

export function ControlledMultiSelect({
  value,
  onValueChange,
  defaultValue = [],
  ...props
}: ControlledMultiSelectProps) {
  const [internalValue, setInternalValue] = React.useState<readonly string[]>(defaultValue)
  
  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  
  const handleValueChange = React.useCallback((newValue: readonly string[]) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])
  
  return (
    <MultiSelect
      {...props}
      selected={selectedValue}
      onSelectedChange={handleValueChange}
    />
  )
}