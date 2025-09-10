import React from 'react';
import Hero from '@/components/hero';
import Reservation from '@/components/reservation';
import About from '@/components/about';
import Contact from '@/components/contact';
import Footer from '@/components/footer';
import Navigation from '@/components/navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Reservation />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}