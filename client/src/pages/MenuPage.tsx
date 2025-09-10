import React from 'react';
import Menu from '@/components/menu';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Menu />
      </main>
      <Footer />
    </div>
  );
}