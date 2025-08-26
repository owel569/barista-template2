
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Types pour une meilleure sécurité
export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'directeur' | 'employe' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface CreateUserData {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'directeur' | 'employe' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'directeur' | 'employe' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
  isActive?: boolean;
}

export interface UpdatePermissionData {
  userId: number;
  module: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const useUsers = () => {
  const queryClient = useQueryClient();
  const { apiRequest } = useAuth();

  // Récupérer tous les utilisateurs
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/users');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Récupérer les permissions d'un utilisateur
  const useUserPermissions = (userId: number) => {
    return useQuery<Permission[]>({
      queryKey: ['users', userId, 'permissions'],
      queryFn: async () => {
        const response = await apiRequest(`/api/admin/users/${userId}/permissions`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des permissions');
        }
        return response.json();
      },
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    });
  };

  // Créer un utilisateur
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users'], (oldUsers: User[] | undefined) => {
        return oldUsers ? [...oldUsers, newUser] : [newUser];
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
    },
  });

  // Mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: UpdateUserData }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (updatedUser, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users'], (oldUsers: User[] | undefined) => {
        return oldUsers?.map(user => 
          user.id === userId ? { ...user, ...updatedUser } : user
        ) || [];
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    },
  });

  // Supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users'], (oldUsers: User[] | undefined) => {
        return oldUsers?.filter(user => user.id !== userId) || [];
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    },
  });

  // Mettre à jour les permissions d'un utilisateur
  const updatePermissionMutation = useMutation({
    mutationFn: async (permissionData: UpdatePermissionData) => {
      const response = await apiRequest('/api/admin/permissions', {
        method: 'PUT',
        body: JSON.stringify(permissionData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour des permissions');
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour des permissions:', error);
    },
  });

  // Activer/désactiver un utilisateur
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du changement de statut');
      }
      return response.json();
    },
    onSuccess: (_, { userId, isActive }) => {
      queryClient.setQueryData(['users'], (oldUsers: User[] | undefined) => {
        return oldUsers?.map(user => 
          user.id === userId ? { ...user, isActive } : user
        ) || [];
      });
    },
    onError: (error) => {
      console.error('Erreur lors du changement de statut:', error);
    },
  });

  // Réinitialiser le mot de passe d'un utilisateur
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
      return response.json();
    },
    onError: (error) => {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    },
  });

  return {
    users: users || [],
    isLoading,
    error,
    useUserPermissions,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    updatePermission: updatePermissionMutation.mutate,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isUpdatingPermission: updatePermissionMutation.isPending,
    isTogglingStatus: toggleUserStatusMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    // Fonctions supplémentaires
    refetch: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    getUserById: (id: number) => users.find(user => user.id === id),
    getUsersByRole: (role: string) => users.filter(user => user.role === role),
  };
};
