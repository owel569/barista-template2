"use client"

import * as React from "react"
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, X, Clock } from "lucide-react"
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
  showTime?: boolean
  minDate?: Date
  maxDate?: Date
  presets?: boolean
  clearable?: boolean
  format?: string
}

const DATE_PRESETS = [
  { label: "Aujourd'hui", value: new Date() },
  { label: "Demain", value: addDays(new Date(), 1) },
  { label: "Dans 3 jours", value: addDays(new Date(), 3) },
  { label: "Dans une semaine", value: addDays(new Date(), 7) },
]

export function DatePicker({
  date,
  onSelect,
  placeholder = "Sélectionner une date",
  disabled = false,
  className,
  showTime = false,
  minDate,
  maxDate,
  presets = false,
  clearable = false,
  format: dateFormat = "PPP",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [time, setTime] = React.useState("12:00")

  const formatDisplayDate = (selectedDate: Date) => {
    if (isToday(selectedDate);return "Aujourd'hui"
    if (isTomorrow(selectedDate);return "Demain"
    if (isYesterday(selectedDate);return "Hier"
    return format(selectedDate, dateFormat, { locale: fr })
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onSelect?.(undefined)
      return
    }

    if (showTime && time) {
      const [hours, minutes] = time.split(":")
      selectedDate.setHours(parseInt(hours), parseInt(minutes);}

    onSelect?.(selectedDate)
    if (!showTime) {
      setIsOpen(false)
    }
  }

  const handlePresetSelect = (presetDate: Date) => {
    handleDateSelect(presetDate)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(undefined)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          }
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span className="flex-1">
              {formatDisplayDate(date}
              {showTime && time && ` à ${time}`}
            </span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {clearable && date && (
            <X
              className="ml-2 h-4 w-4 hover:text-destructive"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              initialFocus
            />
            
            {showTime && (
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0')
                        return ['00', '30'].map(minute => (
                          <SelectItem key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                            {hour}:{minute}
                          </SelectItem>
                        )});.flat()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          {presets && (
            <div className="border-l p-3 w-48">
              <h4 className="text-sm font-medium mb-2">Raccourcis</h4>
              <div className="space-y-1">
                {DATE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handlePresetSelect(preset.value}
                  >
                    {preset.label}
                  </Button>
                );}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Range Date Picker
export interface DateRangePickerProps {
  dateRange?: { from: Date; to?: Date }
  onSelect?: (range: { from: Date; to?: Date } | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  presets?: boolean
  clearable?: boolean
}

const RANGE_PRESETS = [
  {
    label: "7 derniers jours",
    value: { from: subDays(new Date(), 6), to: new Date() }
  },
  {
    label: "30 derniers jours", 
    value: { from: subDays(new Date(), 29), to: new Date() }
  },
  {
    label: "Ce mois-ci",
    value: { 
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    }
  },
]

export function DateRangePicker({
  dateRange,
  onSelect,
  placeholder = "Sélectionner une période",
  disabled = false,
  className,
  presets = false,
  clearable = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatRange = (range: { from: Date; to?: Date }) => {
    if (!range.to) {
      return format(range.from, "PPP", { locale: fr })
    }
    return `${format(range.from, "PPP", { locale: fr })} - ${format(range.to, "PPP", { locale: fr })}`
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(undefined)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange && "text-muted-foreground",
            className
          }
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange ? (
            <span className="flex-1">{formatRange(dateRange}</span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {clearable && dateRange && (
            <X
              className="ml-2 h-4 w-4 hover:text-destructive"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onSelect}
              numberOfMonths={2}
              initialFocus
            />
          </div>
          
          {presets && (
            <div className="border-l p-3 w-48">
              <h4 className="text-sm font-medium mb-2">Raccourcis</h4>
              <div className="space-y-1">
                {RANGE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      onSelect?.(preset.value)
                      setIsOpen(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                );}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
