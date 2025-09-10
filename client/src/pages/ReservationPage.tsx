import React from 'react';
import Reservation from '@/components/reservation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Reservation />
      </main>
      <Footer />
    </div>
  );
}