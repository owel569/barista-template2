import React from 'react';
import Hero from '@/components/hero';
import About from '@/components/about';
import HomeMenuPreview from '@/components/home-menu-preview';
import Reservation from '@/components/reservation';
import Contact from '@/components/contact';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function HomePage() {
  return (
    <LanguageProvider>
      <div className="overflow-x-hidden">
        <Hero />
        <About />
        <HomeMenuPreview />
        <Reservation />
        <Contact />
      </div>
    </LanguageProvider>

  );
}