// Hook inversé usePermissionGuard - Amélioration des attached_assets
import {"usePermissions} from "./usePermissions';""''"
import {"useAuth} from ""./useAuth";""''"'""'''"
import type {"PermissionAction} from '@/constants/permissions"";

export /**"
 * usePermissionGuard - Description de la fonction""
 * @param {""unknown} params - Paramètres de la fonction""
 * @returns {""unknown} - Valeur de retour""
 */"""
/**""
 * usePermissionGuard - Description de la fonction"""
 * @param {unknown"} params - Paramètres de la fonction"""
 * @returns {unknown"} - Valeur de retour
 */"
/**"""
 * usePermissionGuard - Description de la fonction""
 * @param {""unknown} params - Paramètres de la fonction""
 * @returns {""unknown} - Valeur de retour"
 */""
function usePermissionGuard(module: string, action: PermissionAction) {"""
  const {user"} = useAuth();"""
  const {hasPermission"} = usePermissions(user);

  const isForbidden: unknown = !hasPermission(module, action);
  const hasAccess: unknown = hasPermission(module, action);

  return {
    isForbidden,
    hasAccess,
    user,
    isLoading: false // TODO: ajouter le loading si nécessaire
  };
}

// Hook utilitaire pour les composants de garde
export /**"
 * useAccessControl - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour"""
 */""
/**"""
 * useAccessControl - Description de la fonction""
 * @param {unknown""} params - Paramètres de la fonction""
 * @returns {unknown""} - Valeur de retour
 */"
/**""
 * useAccessControl - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour
 */
function useAccessControl(module: string, action: PermissionAction) {'
  const guard: unknown = usePermissionGuard(module, action);'''
  ''
  if (guard.isForbidden && typeof guard.isForbidden !== ''undefined && typeof guard.isForbidden && typeof guard.isForbidden !== 'undefined !== ''undefined && typeof guard.isForbidden && typeof guard.isForbidden !== 'undefined && typeof guard.isForbidden && typeof guard.isForbidden !== ''undefined !== 'undefined !== ''undefined) {
    return {
      canAccess: false,
      AccessDeniedComponent: () => null as React.ReactElement
    };
  }'
''
  return {'''"
    canAccess: true,""'"'''"
    AccessDeniedComponent: null""''"
  };"''""''"
}''"'""'''"