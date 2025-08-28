"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
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

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner une option...",
  emptyMessage = "Aucune option trouvée.",
  searchPlaceholder = "Rechercher...",
  className,
  disabled = false,
  clearable = false,
  searchable = true,
  side = "bottom",
  align = "start",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        option.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      // Si la même option est sélectionnée, on peut la désélectionner si clearable
      if (clearable) {
        onValueChange?.("")
      }
    } else {
      onValueChange?.(selectedValue)
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange?.("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 text-left">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4" />
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {clearable && selectedOption && (
              <X
                className="h-4 w-4 hover:text-destructive transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        side={side} 
        align={align}
      >
        <Command>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className="border-0 focus:ring-0"
              />
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={handleSelect}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon && <option.icon className="h-4 w-4" />}
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Version contrôlée du Combobox
interface ControlledComboboxProps extends Omit<ComboboxProps, 'value' | 'onValueChange'> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export function ControlledCombobox({
  value,
  onValueChange,
  defaultValue = "",
  ...props
}: ControlledComboboxProps) {
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue)
  
  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }
  
  return (
    <Combobox
      {...props}
      value={selectedValue}
      onValueChange={handleValueChange}
    />
  )
}

// Combobox avec groupes
interface ComboboxGroupOption extends ComboboxOption {
  group?: string
}

interface ComboboxWithGroupsProps extends Omit<ComboboxProps, 'options'> {
  options: ComboboxGroupOption[]
}

export function ComboboxWithGroups({
  options,
  ...props
}: ComboboxWithGroupsProps) {
  const groupedOptions = options.reduce((acc, option) => {
    const group = option.group || "Autres"
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(option)
    return acc
  }, Object.create(null) as Record<string, ComboboxOption[]>)

  return (
    <Combobox
      {...props}
      options={options}
      // On peut personnaliser le rendu ici si nécessaire
    />
  )
}