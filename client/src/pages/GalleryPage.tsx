import React from 'react';
import Gallery from '@/components/gallery';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}