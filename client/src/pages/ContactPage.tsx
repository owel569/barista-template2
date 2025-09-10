import React from 'react';
import Contact from '@/components/contact';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}