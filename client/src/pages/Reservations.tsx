import React from 'react';
import { useReservations, ReservationForm } from "@/hooks/useReservations";
import { useState } from "react";

type Reservation = {
  id: number;
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  tableId: number | null;
  // ajoute d'autres champs si besoin!
};

export default function ReservationsPage() : JSX.Element {
  const { reservations, addReservation, isLoading, isAdding } = useReservations();
  const [form, setForm] = useState<ReservationForm>({
    name: "",
    email: "",
    date: "",
    time: "",
    guests: 1,
    tableId: null,
  });

  // Typage de l'event pour un input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // Typage de l'event pour le submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addReservation(form as any, {
      onSuccess: () =>
        setForm({
          name: "",
          email: "",
          date: "",
          time: "",
          guests: 1,
          tableId: null,
        }),
    });
  };

  return (
    <div>
      <h1>Réservations</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={form.name}
          placeholder="Nom"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="guests"
          value={form.guests}
          min={1}
          onChange={handleChange}
          required
        />
        {/* Table ID est optionnel */}
        <input
          type="number"
          name="tableId"
          value={form.tableId ?? ""}
          placeholder="Numéro de table (optionnel)"
          onChange={handleChange}
        />
        <button type="submit" disabled={isAdding}>
          {isAdding ? "Envoi..." : "Réserver"}
        </button>
      </form>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {reservations.map((r: Reservation) => (
            <li key={r.id}>
              {r.name} — {r.date} à {r.time} ({r.guests} pers.)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}