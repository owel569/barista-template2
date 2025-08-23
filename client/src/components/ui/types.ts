import * as React from "react"
import { VariantProps } from "class-variance-authority"

// Types de base
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Types pour Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "info" | "gradient"
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg"
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
  pulse?: boolean
  tooltip?: string
  badge?: string | number
}

// Types pour Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "sm" | "lg" | "ghost"
  inputState?: "default" | "error" | "success" | "warning"
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  error?: string
  helperText?: string
}

// Types pour Checkbox
export interface CheckboxProps extends React.ComponentPropsWithoutRef<any> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "success"
  size?: "default" | "sm" | "lg"
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

// Types pour RadioGroup
export interface RadioGroupProps {
  orientation?: "vertical" | "horizontal"
  error?: string
}

export interface RadioGroupItemProps {
  variant?: "default" | "destructive" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  label?: string
  description?: string
}

// Types pour Switch
export interface SwitchProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "success" | "warning"
  size?: "sm" | "default" | "lg"
  label?: string
  description?: string
  error?: string
}

// Types pour Select
export interface SelectProps {
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
}

// Types pour Combobox
export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

export interface ComboboxProps {
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

// Types pour MultiSelect
export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface MultiSelectProps {
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

// Types pour DatePicker
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

export interface DateRangePickerProps {
  dateRange?: { from: Date; to?: Date }
  onSelect?: (range: { from: Date; to?: Date } | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  presets?: boolean
  clearable?: boolean
}

// Types pour Skeleton
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "lighter" | "darker" | "shimmer"
  width?: string | number
  height?: string | number
  circle?: boolean
}

// Types pour Modal/Dialog
export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
}

// Types pour Toast/Notification
export interface ToastProps {
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
}

// Types pour Form
export interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  error?: string
}

// Types pour Table
export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string | number
  align?: "left" | "center" | "right"
  fixed?: "left" | "right"
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowKey?: string | ((record: T) => string)
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  scroll?: { x?: number; y?: number }
}

// Types pour Card
export interface CardProps extends BaseComponentProps {
  variant?: "default" | "outline" | "filled" | "elevated"
  padding?: "none" | "sm" | "default" | "lg"
  hover?: boolean
}

// Types pour Badge
export interface BadgeProps extends BaseComponentProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  size?: "sm" | "default" | "lg"
  dot?: boolean
}

// Types pour Progress
export interface ProgressProps {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "destructive"
  size?: "sm" | "default" | "lg"
  showValue?: boolean
  animated?: boolean
}

// Types pour Avatar
export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "default" | "lg" | "xl"
}

// Utilitaires de types
export type Variant<T> = T extends VariantProps<infer V> ? V : never
export type Size = "sm" | "default" | "lg"
export type State = "default" | "error" | "success" | "warning"