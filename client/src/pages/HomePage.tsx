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
      <section id="home">
        <Hero />
      </section>
      <section id="menu">
        <Menu />
      </section>
      <section id="reservation">
        <Reservation />
      </section>
      <section id="about">
        <About />
      </section>
      <section id="gallery">
        <Gallery />
      </section>
      <section id="contact">
        <Contact />
      </section>
      <Footer />
    </div>
  );
}