
// ===== HOOKS D'AUTHENTIFICATION =====
export { useAuth } from './useAuth'
export { usePermissions } from './usePermissions'
export { usePermissionGuard } from './usePermissionGuard'
export { usePermissionsSync } from './usePermissionsSync'
export { useUser } from './use-user'
export { useUsers } from './useUsers'

// ===== HOOKS DE DONNÉES =====
export { useCart } from './use-cart'
export { useReservations } from './useReservations'

// ===== HOOKS D'INTERFACE =====
export { useToast } from './use-toast'
export { useMobile } from './use-mobile'

// ===== HOOKS DE COMMUNICATION =====
export { useWebSocket } from './use-websocket'
export { useWebSocket as useWebSocketAlt } from './useWebSocket'

// ===== HOOKS UI (depuis les composants) =====
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
} from '../components/ui/hooks'
