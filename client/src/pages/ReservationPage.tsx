import React from 'react';
import Reservation from '@/components/reservation';

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        <Reservation />
      </main>
    </div>
  );
}