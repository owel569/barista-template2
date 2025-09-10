
import React from 'react';
import Navigation from '@/components/navigation';
import Gallery from '@/components/gallery';
import Footer from '@/components/footer';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <Gallery />
      </div>
      <Footer />
    </div>
  );
}
