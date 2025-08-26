
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type Reservation = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  guests: number;
  tableId: number | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReservationForm = {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  guests: number;
  tableId: number | null;
  specialRequests?: string;
};

export type UpdateReservationData = {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  guests?: number;
  tableId?: number | null;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
};

export function useReservations() {
  const queryClient = useQueryClient();
  const { apiRequest } = useAuth();

  const { data: reservations = [], isLoading, error } = useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: async () => {
      const response = await apiRequest("/api/reservations");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des réservations");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const addReservation = useMutation<Reservation, Error, ReservationForm>({
    mutationFn: async (data) => {
      const response = await apiRequest("/api/reservations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'ajout de la réservation");
      }
      return response.json();
    },
    onSuccess: (newReservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.setQueryData<Reservation[]>(["reservations"], (old) => 
        old ? [...old, newReservation] : [newReservation]
      );
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout de la réservation:", error);
    },
  });

  const updateReservation = useMutation<Reservation, Error, { id: number; data: UpdateReservationData }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiRequest(`/api/reservations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la mise à jour de la réservation");
      }
      return response.json();
    },
    onSuccess: (updatedReservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.setQueryData<Reservation[]>(["reservations"], (old) =>
        old?.map(reservation => 
          reservation.id === updatedReservation.id ? updatedReservation : reservation
        ) || []
      );
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la réservation:", error);
    },
  });

  const deleteReservation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const response = await apiRequest(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression de la réservation");
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.setQueryData<Reservation[]>(["reservations"], (old) =>
        old?.filter(reservation => reservation.id !== deletedId) || []
      );
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la réservation:", error);
    },
  });

  const confirmReservation = useMutation<Reservation, Error, number>({
    mutationFn: async (id) => {
      const response = await apiRequest(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la confirmation de la réservation");
      }
      return response.json();
    },
    onSuccess: (updatedReservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.setQueryData<Reservation[]>(["reservations"], (old) =>
        old?.map(reservation => 
          reservation.id === updatedReservation.id ? updatedReservation : reservation
        ) || []
      );
    },
    onError: (error) => {
      console.error("Erreur lors de la confirmation de la réservation:", error);
    },
  });

  const cancelReservation = useMutation<Reservation, Error, number>({
    mutationFn: async (id) => {
      const response = await apiRequest(`/api/reservations/${id}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'annulation de la réservation");
      }
      return response.json();
    },
    onSuccess: (updatedReservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.setQueryData<Reservation[]>(["reservations"], (old) =>
        old?.map(reservation => 
          reservation.id === updatedReservation.id ? updatedReservation : reservation
        ) || []
      );
    },
    onError: (error) => {
      console.error("Erreur lors de l'annulation de la réservation:", error);
    },
  });

  // Fonctions utilitaires
  const getReservationById = (id: number): Reservation | undefined => {
    return reservations.find(reservation => reservation.id === id);
  };

  const getReservationsByDate = (date: string): Reservation[] => {
    return reservations.filter(reservation => reservation.date === date);
  };

  const getReservationsByStatus = (status: Reservation['status']): Reservation[] => {
    return reservations.filter(reservation => reservation.status === status);
  };

  const getTodayReservations = (): Reservation[] => {
    const today = new Date().toISOString().split('T')[0];
    return getReservationsByDate(today);
  };

  const getUpcomingReservations = (): Reservation[] => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(reservation => reservation.date >= today);
  };

  return { 
    reservations, 
    isLoading,
    error,
    addReservation: addReservation.mutate,
    updateReservation: updateReservation.mutate,
    deleteReservation: deleteReservation.mutate,
    confirmReservation: confirmReservation.mutate,
    cancelReservation: cancelReservation.mutate,
    isAdding: addReservation.isPending,
    isUpdating: updateReservation.isPending,
    isDeleting: deleteReservation.isPending,
    isConfirming: confirmReservation.isPending,
    isCancelling: cancelReservation.isPending,
    // Fonctions utilitaires
    getReservationById,
    getReservationsByDate,
    getReservationsByStatus,
    getTodayReservations,
    getUpcomingReservations,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  };
}
