import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shift, Employee, ScheduleStats, ShiftRequest } from '../types/schedule.types';
import { generateScheduleStats } from '../utils/schedule.utils';

/**
 * Hook pour la gestion des données d'horaires
 */
export const useScheduleData = (dateRange?: { start: string; end: string }) => {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupération des employés
  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/employees');
      return response.json();
    },
  });

  // Récupération des shifts
  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ['shifts', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('start', dateRange.start);
        params.append('end', dateRange.end);
      }
      const response = await apiRequest(`/api/admin/work-shifts?${params}`);
      return response.json();
    },
  });

  // Récupération des demandes de shift
  const { data: shiftRequests = [], isLoading: loadingRequests } = useQuery<ShiftRequest[]>({
    queryKey: ['shift-requests'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/shift-requests');
      return response.json();
    },
  });

  // Calcul des statistiques
  const stats: ScheduleStats | null = React.useMemo(() => {
    if (!shifts.length || !employees.length || !dateRange) return null;
    
    return generateScheduleStats(shifts, employees, dateRange.start, dateRange.end);
  }, [shifts, employees, dateRange]);

  // Mutation pour créer un shift
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: Omit<Shift, 'id'>) => {
      const response = await apiRequest('/api/admin/work-shifts', {
        method: 'POST',
        body: JSON.stringify(shiftData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: "Shift créé",
        description: "Le shift a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le shift",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un shift
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Shift> }) => {
      const response = await apiRequest(`/api/admin/work-shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: "Shift mis à jour",
        description: "Le shift a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le shift",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un shift
  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/work-shifts/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: "Shift supprimé",
        description: "Le shift a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le shift",
        variant: "destructive",
      });
    },
  });

  // Mutation pour traiter une demande de shift
  const processShiftRequestMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: number; action: 'approve' | 'reject'; notes?: string }) => {
      const response = await apiRequest(`/api/admin/shift-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', notes }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-requests'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: "Demande traitée",
        description: "La demande de shift a été traitée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive",
      });
    },
  });

  return {
    // Données
    employees,
    shifts,
    shiftRequests,
    stats,
    
    // États de chargement
    isLoading: loadingEmployees || loadingShifts || loadingRequests,
    loadingEmployees,
    loadingShifts,
    loadingRequests,
    
    // Mutations
    createShift: createShiftMutation.mutate,
    updateShift: updateShiftMutation.mutate,
    deleteShift: deleteShiftMutation.mutate,
    processShiftRequest: processShiftRequestMutation.mutate,
    
    // États des mutations
    creatingShift: createShiftMutation.isPending,
    updatingShift: updateShiftMutation.isPending,
    deletingShift: deleteShiftMutation.isPending,
    processingRequest: processShiftRequestMutation.isPending,
  };
};