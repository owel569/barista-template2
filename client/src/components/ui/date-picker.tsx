
<old_str>
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
</old_str>
<new_str>
import * as React from "react"
import { format, addDays, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: Locale
  showPresets?: boolean
  presets?: { label: string; date: Date }[]
  formatStr?: string
}

const defaultPresets = [
  { label: "Aujourd'hui", date: new Date() },
  { label: "Demain", date: addDays(new Date(), 1) },
  { label: "Dans 3 jours", date: addDays(new Date(), 3) },
  { label: "Dans une semaine", date: addDays(new Date(), 7) },
  { label: "Dans un mois", date: addDays(new Date(), 30) },
]

export function DatePicker({
  date,
  onSelect,
  placeholder = "Choisir une date",
  disabled = false,
  className,
  clearable = false,
  minDate,
  maxDate,
  locale = fr,
  showPresets = false,
  presets = defaultPresets,
  formatStr = "PPP",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(undefined)
  }

  const handlePresetSelect = (presetDate: Date) => {
    onSelect?.(presetDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, formatStr, { locale }) : <span>{placeholder}</span>}
          {clearable && date && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              initialFocus
              locale={locale}
            />
          </div>
          {showPresets && (
            <div className="border-l p-3 w-48">
              <h4 className="font-medium text-sm mb-2">Raccourcis</h4>
              <div className="space-y-1">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handlePresetSelect(preset.date)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Date Range Picker
export interface DateRangePickerProps {
  from?: Date
  to?: Date
  onSelect?: (range: { from?: Date; to?: Date }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: Locale
  numberOfMonths?: number
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  placeholder = "Choisir une période",
  disabled = false,
  className,
  clearable = false,
  minDate,
  maxDate,
  locale = fr,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    onSelect?.(range || {})
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.({})
  }

  const formatRange = () => {
    if (from && to) {
      return `${format(from, "dd MMM", { locale })} - ${format(to, "dd MMM yyyy", { locale })}`
    }
    if (from) {
      return format(from, "dd MMM yyyy", { locale })
    }
    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
          {clearable && (from || to) && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          numberOfMonths={numberOfMonths}
          initialFocus
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker as default }
</new_str>
