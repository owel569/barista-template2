import React from 'react';
import Hero from '@/components/hero';
import Menu from '@/components/menu';
import Reservation from '@/components/reservation';
import About from '@/components/about';
import Contact from '@/components/contact';
import Gallery from '@/components/gallery';
import Footer from '@/components/footer';
import Navigation from '@/components/navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Menu />
      <Reservation />
      <About />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
}