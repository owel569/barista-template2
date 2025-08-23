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
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected?: string[]
  onSelectedChange?: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelected?: number
  searchable?: boolean
  clearable?: boolean
  emptyMessage?: string
  maxDisplay?: number
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
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  )

  const isMaxReached = maxSelected ? selected.length >= maxSelected : false

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectedChange?.(selected.filter((item) => item !== value))
    } else if (!isMaxReached) {
      onSelectedChange?.([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onSelectedChange?.(selected.filter((item) => item !== value))
  }

  const handleClear = () => {
    onSelectedChange?.([])
  }

  const displayedOptions = selectedOptions.slice(0, maxDisplay)
  const remainingCount = selectedOptions.length - maxDisplay

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {option.icon && <option.icon className="h-3 w-3" />}
                    {option.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(option.value)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="secondary">
                    +{remainingCount} de plus
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {clearable && selectedOptions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {searchable && (
            <CommandInput
              placeholder="Rechercher..."
              value={search}
              onValueChange={setSearch}
            />
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                const isDisabled = option.disabled || (!isSelected && isMaxReached)
                
                return (
                  <CommandItem
                    key={option.value}
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
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    {option.icon && <option.icon className="h-4 w-4" />}
                    <span className="flex-1">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {maxSelected && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {selected.length}/{maxSelected} sélectionnés
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Version contrôlée du MultiSelect
interface ControlledMultiSelectProps extends Omit<MultiSelectProps, 'selected' | 'onSelectedChange'> {
  value?: string[]
  onValueChange?: (value: string[]) => void
  defaultValue?: string[]
}

export function ControlledMultiSelect({
  value,
  onValueChange,
  defaultValue = [],
  ...props
}: ControlledMultiSelectProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue)
  
  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  
  const handleValueChange = (newValue: string[]) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }
  
  return (
    <MultiSelect
      {...props}
      selected={selectedValue}
      onSelectedChange={handleValueChange}
    />
  )
}