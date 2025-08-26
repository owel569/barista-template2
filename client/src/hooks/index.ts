
// ===== HOOKS D'AUTHENTIFICATION =====
export { useAuth, AuthProvider, useAuthContext } from './useAuth';
export { usePermissions } from './usePermissions';
export { usePermissionGuard, useAccessControl, useMultiplePermissions } from './usePermissionGuard';
export { usePermissionsSync, usePermissionsEmitter } from './usePermissionsSync';
export { useUser } from './useUser';
export { useUsers } from './useUsers';

// ===== HOOKS DE DONNÉES =====
export { useCart } from './use-cart';
export { useReservations } from './useReservations';

// ===== HOOKS D'INTERFACE =====
export { useToast } from './use-toast';
export { useMobile } from './use-mobile';

// ===== HOOKS DE COMMUNICATION =====
export { useWebSocket } from './useWebSocket';

// ===== HOOKS UI =====
// Export des hooks UI depuis les composants
export * from '../components/ui/use-toast';

// ===== HOOKS UTILITAIRES =====
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useAsync } from './useAsync';

// ===== TYPES =====
export type { User, LoginCredentials, RegisterData, AuthState, AuthContextType } from './useAuth';
export type { UserRole, PermissionAction, ModuleName } from './usePermissions';
export type { PermissionGuardOptions, PermissionGuardResult } from './usePermissionGuard';
export type { Reservation, ReservationForm, UpdateReservationData } from './useReservations';
