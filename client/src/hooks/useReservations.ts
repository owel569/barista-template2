import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Reservation = {
  id: number;
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  tableId: number | null;
};

export type ReservationForm = {
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  tableId: number | null;
};

export function useReservations() : void {
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await fetch("/api/reservations", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des réservations");
      return res.json();
    },
  });

  const addReservation = useMutation<any, Error, ReservationForm>({
    mutationFn: async (data) => {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  return { reservations, addReservation, isLoading };
}