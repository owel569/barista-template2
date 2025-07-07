import { Button } from "@/components/ui/button";
import { Calendar, Utensils } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import logoBaristaCafe from "@/assets/logo-barista-cafe.png";

export default function Hero() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      />
      <div className="absolute inset-0 bg-coffee-dark bg-opacity-60" />
      
      <div className="relative z-10 text-center text-white px-6">
        <div className="flex justify-center mb-6">
          <img src={logoBaristaCafe} alt="Barista Café Logo" className="h-32 w-32 mb-6" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          {t('home.title')} <span className="text-coffee-accent">Barista Café</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          {t('home.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setLocation("/reservation")}
            className="bg-coffee-accent hover:bg-opacity-90 text-white px-8 py-3 rounded-full text-lg font-semibold transition duration-300 transform hover:scale-105"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t('home.cta.reserve')}
          </Button>
          <Button
            onClick={() => scrollToSection("menu")}
            variant="outline"
            className="bg-transparent border-2 border-white hover:bg-white hover:text-coffee-dark text-white px-8 py-3 rounded-full text-lg font-semibold transition duration-300"
          >
            <Utensils className="mr-2 h-5 w-5" />
            {t('home.cta.menu')}
          </Button>
        </div>
      </div>
    </section>
  );
}
