import * as React from "react"
import { VariantProps } from "class-variance-authority"

// Types de base sécurisés
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  "data-testid"?: string
}

// Types stricts pour les variants
export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "info" | "gradient"
export type ButtonSize = "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg"
export type InputVariant = "default" | "sm" | "lg" | "ghost"
export type InputState = "default" | "error" | "success" | "warning"
export type ComponentSize = "sm" | "default" | "lg"
export type ComponentState = "default" | "error" | "success" | "warning"

// Types sécurisés pour les événements
export type SafeEventHandler<T = Element> = (event: React.SyntheticEvent<T>) => void
export type SafeChangeHandler<T = string> = (value: T) => void
export type SafeClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void

// Types pour Button avec sécurité renforcée
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant
  size?: ButtonSize
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
  onClick?: SafeClickHandler
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

// Types pour Input avec validation stricte
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onClear'> {
  variant?: InputVariant
  inputState?: InputState
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  error?: string
  helperText?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  // Restriction des types d'input dangereux
  type?: "text" | "password" | "email" | "number" | "tel" | "url" | "search" | "date" | "datetime-local" | "time"
}

// Types pour Checkbox avec sécurité
export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<any>, 'onCheckedChange'> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "success"
  size?: ComponentSize
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  checked?: boolean
  defaultChecked?: boolean
}

// Types pour RadioGroup
export interface RadioGroupProps extends Omit<React.ComponentPropsWithoutRef<any>, 'onValueChange'> {
  orientation?: "vertical" | "horizontal"
  error?: string
  onValueChange?: (value: string) => void
  value?: string
  defaultValue?: string
}

export interface RadioGroupItemProps {
  variant?: "default" | "destructive" | "outline" | "secondary"
  size?: ComponentSize
  label?: string
  description?: string
  value: string // Required pour la sécurité
  disabled?: boolean
}

// Types pour Switch avec validation
export interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<any>, 'onCheckedChange'> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "success" | "warning"
  size?: ComponentSize
  label?: string
  description?: string
  error?: string
  onCheckedChange?: (checked: boolean) => void
  checked?: boolean
  defaultChecked?: boolean
}

// Types sécurisés pour Select
export interface SelectProps {
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

// Types stricts pour Combobox
export interface ComboboxOption {
  readonly value: string // readonly pour éviter les mutations
  readonly label: string
  readonly disabled?: boolean
  readonly icon?: React.ComponentType<{ className?: string }>
  readonly description?: string
}

export interface ComboboxProps {
  options: readonly ComboboxOption[] // readonly array
  value?: string
  onValueChange?: SafeChangeHandler<string>
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

// Types sécurisés pour MultiSelect
export interface MultiSelectOption {
  readonly label: string
  readonly value: string
  readonly icon?: React.ComponentType<{ className?: string }>
  readonly disabled?: boolean
}

export interface MultiSelectProps {
  options: readonly MultiSelectOption[]
  selected?: readonly string[]
  onSelectedChange?: SafeChangeHandler<readonly string[]>
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelected?: number
  searchable?: boolean
  clearable?: boolean
  emptyMessage?: string
  maxDisplay?: number
}

// Types pour DatePicker avec validation de dates
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
  locale?: Locale
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

// Types sécurisés pour Skeleton
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "lighter" | "darker" | "shimmer"
  width?: string | number
  height?: string | number
  circle?: boolean
}

// Types pour Modal/Dialog avec contrôle d'accès
export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  modal?: boolean // Contrôle si c'est modal ou non
  closeOnEscapeKeyDown?: boolean
  closeOnOverlayClick?: boolean
}

// Types sécurisés pour Toast/Notification
export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

export interface ToastProps {
  variant?: ToastVariant
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  onClose?: () => void
}

// Types pour Form avec validation
export interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

// Types sécurisés pour Table avec générics stricts
export interface TableColumn<TData = unknown> {
  readonly key: string
  readonly title: string
  readonly dataIndex?: keyof TData
  readonly render?: (value: unknown, record: TData, index: number) => React.ReactNode
  readonly sortable?: boolean
  readonly width?: string | number
  readonly align?: "left" | "center" | "right"
  readonly fixed?: "left" | "right"
}

export interface TableProps<TData = unknown> {
  columns: readonly TableColumn<TData>[]
  data: readonly TData[]
  loading?: boolean
  pagination?: {
    readonly current: number
    readonly pageSize: number
    readonly total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowKey?: string | ((record: TData) => string)
  onRow?: (record: TData, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  scroll?: { readonly x?: number; readonly y?: number }
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
  size?: ComponentSize
  dot?: boolean
}

// Types pour Progress avec validation
export interface ProgressProps {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "destructive"
  size?: ComponentSize
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

// Types de validation pour les formulaires
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validate?: (value: unknown) => boolean | string
}

export interface FormValidation {
  [fieldName: string]: ValidationRule
}

// Types pour l'accessibilité
export interface AccessibilityProps {
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-expanded"?: boolean
  "aria-selected"?: boolean
  "aria-disabled"?: boolean
  role?: string
}

// Types utilitaires sécurisés
export type Variant<T> = T extends VariantProps<infer V> ? V : never
export type Size = ComponentSize
export type State = ComponentState

// Types pour la sanitization
export interface SanitizedHTML {
  __html: string
}

// Types pour les refs sécurisées
export type SafeRef<T> = React.RefObject<T> | React.MutableRefObject<T>

// Types pour les événements personnalisés sécurisés
export interface CustomEventDetail<T = unknown> {
  readonly detail: T
}

export type CustomEventHandler<T = unknown> = (event: CustomEvent<T>) => void

// Export des types de base pour la réutilisation
export type {
  React,
  VariantProps
}