
// ===== HOOKS D'AUTHENTIFICATION =====
export { useAuth, AuthProvider, useAuthContext } from './useAuth';
export { usePermissions } from './usePermissions';
export { 
  usePermissionGuard, 
  useAccessControl, 
  useMultiplePermissions 
} from './usePermissionGuard';
export { 
  usePermissionsSync, 
  usePermissionsEmitter 
} from './usePermissionsSync';

// ===== HOOKS DE DONNÉES UTILISATEUR =====
export { useUser } from './useUser';
export { useUsers } from './useUsers';

// ===== HOOKS DE DONNÉES MÉTIER =====
export { useCart } from './use-cart';
export { useReservations } from './useReservations';

// ===== HOOKS D'INTERFACE UTILISATEUR =====
export { useToast } from './use-toast';
export { useMobile } from './use-mobile';

// ===== HOOKS DE COMMUNICATION =====
export { useWebSocket } from './useWebSocket';

// ===== HOOKS UTILITAIRES =====
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useAsync } from './useAsync';

// ===== HOOKS SPÉCIALISÉS =====
export { useQRCode } from './useQRCode';

// ===== TYPES EXPORTS =====
export type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthState, 
  AuthContextType 
} from './useAuth';

export type { 
  UserRole, 
  PermissionAction, 
  ModuleName 
} from './usePermissions';

export type { 
  PermissionGuardOptions, 
  PermissionGuardResult,
  AccessControlOptions
} from './usePermissionGuard';

export type { 
  Reservation, 
  ReservationForm, 
  UpdateReservationData 
} from './useReservations';

// ===== RE-EXPORTS UI (pour compatibilité) =====
export { useToast as useToastUI } from '../components/ui/use-toast';
