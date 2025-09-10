
import React from 'react';
import Navigation from '@/components/navigation';
import Menu from '@/components/menu';
import Footer from '@/components/footer';

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <Menu />
      </div>
      <Footer />
    </div>
  );
}
