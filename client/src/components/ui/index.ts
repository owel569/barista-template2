// ===== COMPOSANTS DE BASE =====
export * from "./button"
export * from "./input"
export * from "./label"
export * from "./textarea"
export * from "./select"
export * from "./checkbox"
export * from "./radio-group"
export * from "./switch"
export * from "./slider"

// ===== COMPOSANTS DE NAVIGATION =====
export * from "./navigation-menu"
export * from "./menubar"
export * from "./breadcrumb"
export * from "./pagination"
export * from "./tabs"
export * from "./sidebar"

// ===== COMPOSANTS DE LAYOUT =====
export * from "./card"
export * from "./separator"
export * from "./aspect-ratio"
export * from "./scroll-area"
export * from "./resizable"

// ===== COMPOSANTS DE FEEDBACK =====
export * from "./alert"
export * from "./badge"
export * from "./progress"
export * from "./skeleton"
export * from "./spinner"
export * from "./loading-spinner"
export * from "./loading-overlay"
export * from "./loading-button"
export * from "./empty-state"
export * from "./stats-card"

// ===== COMPOSANTS DE DIALOGUE ET POPOVER =====
export * from "./dialog"
export * from "./alert-dialog"
export * from "./confirmation-dialog"
export * from "./sheet"
export * from "./popover"
export * from "./tooltip"
export * from "./hover-card"
export * from "./context-menu"
export * from "./dropdown-menu"
export * from "./modal"

// ===== COMPOSANTS DE FORMULAIRE =====
export * from "./form"
export * from "./calendar"
export * from "./date-picker"
export * from "./combobox"
export * from "./multi-select"
export * from "./command"
export * from "./phone-input"
export * from "./international-phone-input"
export * from "./input-otp"
export * from "./file-upload"
export * from "./search-input"

// ===== COMPOSANTS D'AFFICHAGE DE DONNÉES =====
export * from "./table"
export * from "./data-table"
export * from "./chart"
export * from "./accordion"
export * from "./collapsible"
export * from "./carousel"

// ===== COMPOSANTS DE NOTIFICATION =====
export { Toaster } from "./toaster"
export { Toaster as SonnerToaster } from "./sonner"

// ===== COMPOSANTS AVANCÉS =====
export { Toggle } from './toggle';
export { ToggleGroup } from './toggle-group';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Drawer } from './drawer';

// Restaurant Specific Components
export { MenuItemCard } from './menu-item-card';
export { ReservationCalendar } from './reservation-calendar';
export { OrderStatus } from './order-status';
export { Rating, useRating } from './rating';
export * from "./virtual-list"
export * from "./data-grid"
export * from "./performance"
export * from "./error-boundary"

// ===== TYPES ET UTILITAIRES =====
export * from './use-toast'

// Types consolidés pour éviter les conflits
export type { SafeObject, BaseUIComponentProps } from './ui-utils'

// Types spécifiques
export type {
  // Basic components
  LabelProps,
  TextareaProps,

  // Form components
  CheckboxProps,
  RadioGroupProps,
  SwitchProps,
  SelectProps,
  FormFieldProps,

  // Data types
  ComboboxOption,
  MultiSelectOption,
  TableColumn,
  DataTableProps,
  DateRangePickerProps,
  DatePickerProps,

  // Alert components
  AlertProps,
  AlertDescriptionProps,

  ComponentVariant,
  ComponentSize,
  AccessibilityProps,
  SafeEventHandler,

  // Country and Phone
  Country,
  InternationalPhoneInputProps,

  // Loading states  
  LoadingSpinnerProps,
  LoadingPageProps,
  SkeletonLoaderProps,

  // Chart types
  ChartConfig,
  StatsCardProps,

  // Navigation
  BreadcrumbProps,
  PaginationProps,

  // Modals
  ConfirmationDialogProps,

  // Layout
  ResizableLayoutProps,
  ResizablePanelGroupProps,
  ResizableHandleProps,

  // Media
  AspectRatioProps,

  // Collapsible
  CollapsibleTriggerButtonProps,
  CollapsibleContentWrapperProps,
} from "./types"

// ===== HOOKS UTILITAIRES =====
export {
  // Hooks de chargement
  useLoading,
  useLoadingButton,

  // Hooks de formulaire
  useInternationalPhoneInput,

  // Hooks de données
  useDataTable,

  // Hooks d'interaction
  useConfirmationDialog,
  useAccordion,
  useCollapsible,

  // Hooks de layout
  useResizablePanels,
} from "./hooks"

// ===== VARIANTS ET UTILITAIRES CSS =====
export {
  // Variants des composants
  buttonVariants,
  inputVariants,
  badgeVariants,
  alertVariants,
  skeletonVariants,
  spinnerVariants,

  // Variants de layout
  cardVariants,
  aspectRatioVariants,

  // Variants d'interaction
  dialogVariants,
  accordionItemVariants,
  accordionTriggerVariants,
  accordionContentVariants,

  // Variants de données
  dataTableVariants,

  // Variants de navigation
  breadcrumbVariants,

  // Variants de notification
  toastVariants,

  // Variants de téléphone
  phoneInputVariants,

  // Variants de redimensionnement
  resizablePanelGroupVariants,
  resizableHandleVariants,

  // Variants de collapsible
  collapsibleTriggerVariants,
  collapsibleContentVariants,
} from "./variants"