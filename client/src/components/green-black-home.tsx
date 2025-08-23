import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Star, MapPin, Phone, Clock,
  Coffee, Utensils, Sunset, Calendar, Image, MessageSquare, Home
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface MenuCategory {
  id: number;
  name: string;
  image: string;
  description: string;
  featured?: boolean;
}

interface Testimonial {
  text: string;
  author: string;
  rating: number;
  date: string;
}

export default function GreenBlackHome(): JSX.Element {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: false });

  // Configurations responsive
  const slidesToShow = window.innerWidth < 768 ? 1 : 3;
  const totalSlides = Math.ceil(menuCategories.length / slidesToShow);

  const menuCategories: MenuCategory[] = [
    {
      id: 1,
      name: "Petit Déjeuner",
      image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Commencez votre journée avec nos délicieux petits déjeuners",
      featured: true
    },
    {
      id: 2,
      name: "Cafés Premium",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Sélection de cafés d'exception torréfiés avec soin"
    },
    {
      id: 3,
      name: "Pâtisseries",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Pâtisseries artisanales préparées quotidiennement"
    },
    {
      id: 4,
      name: "Déjeuner & Dîner",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Plats savoureux dans une ambiance chaleureuse",
      featured: true
    },
    {
      id: 5,
      name: "Boissons Fraîches",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Jus frais, smoothies et boissons rafraîchissantes"
    },
    {
      id: 6,
      name: "Desserts",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      description: "Desserts gourmands pour finir en beauté"
    }
  ];

  const testimonials: Testimonial[] = [
    {
      text: "Endroit très sympa et surtout personnels aux petits soins.",
      author: "Sarah M.",
      rating: 5,
      date: "15/06/2023"
    },
    {
      text: "Un endroit hyper agréable, un service irréprochable, souriant, des plats diversifiés... une vue magnifique où tu peux passer des moments bien cosy.",
      author: "Ahmed K.",
      rating: 5,
      date: "22/07/2023"
    },
    {
      text: "Accueil d'une gentillesse exceptionnelle, et tout empreint de discrétion et d'efficacité. Vaste choix et qualité des produits.",
      author: "Fatima L.",
      rating: 4,
      date: "05/08/2023"
    }
  ];

  const navItems = [
    { id: 'accueil', label: 'ACCUEIL', icon: Home },
    { id: 'apropos', label: 'À PROPOS', icon: Coffee },
    { id: 'menu', label: 'MENU', icon: Utensils },
    { id: 'photos', label: 'PHOTOS', icon: Image },
    { id: 'contact', label: 'CONTACT', icon: MessageSquare },
    { id: 'avis', label: 'AVIS', icon: Star }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying || !inView) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, inView, nextSlide]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation améliorée */}
      <nav className="bg-black/90 backdrop-blur-sm fixed w-full z-50 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-amber-500 text-2xl font-bold">BARISTA</span>
                <span className="text-white text-2xl font-light">CAFÉ</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-8">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="text-gray-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 flex items-center"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </a>
                  );}
                </div>
              </div>
            </div>
            <Button
              asChild
              className="hidden md:flex bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors duration-300"
            >
              <a href="/reservation">
                <Calendar className="h-4 w-4 mr-2" />
                RÉSERVER
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section avec animations */}
      <section id="accueil" className="relative h-screen flex items-center justify-center bg-cover bg-center bg-fixed pt-16"
               style={{
                 backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6);, url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
               }}>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center text-white px-6"
        >
          <motion.div variants={fadeIn} className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-600/20 rounded-full flex items-center justify-center border border-amber-600/30">
              <Coffee className="h-8 w-8 text-amber-400" />
            </div>
          </motion.div>
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-light mb-6 tracking-wider">
            L'Art du Café & Gastronomie
          </motion.h1>
          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Découvrez une expérience culinaire unique dans un cadre exceptionnel
          </motion.p>
          <motion.div variants={fadeIn}>
            <Button 
              size="lg" 
              className="bg-transparent border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white px-8 py-4 text-lg tracking-wider transition-all duration-300 group"
            >
              <span className="relative overflow-hidden">
                <span className="block group-hover:-translate-y-7 transition-transform duration-300">EXPLORER LE MENU</span>
                <span className="absolute inset-0 flex items-center justify-center translate-y-7 group-hover:translate-y-0 transition-transform duration-300">
                  <Utensils className="h-5 w-5 mr-2" /> Découvrir
                </span>
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section avec effets parallax */}
      <section id="apropos" className="py-20 bg-cover bg-center bg-fixed relative overflow-hidden"
               style={{
                 backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8);, url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
               }}>
        <div className="max-w-7xl mx-auto px-6 text-white relative z-10">
          <motion.div 
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-light mb-8">
              Une Expérience Sensorielle Unique
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Barista Café allie l'excellence du café de spécialité à une gastronomie raffinée, le tout dans un cadre épuré et chaleureux.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {[
              {
                icon: <Coffee className="h-8 w-8 text-amber-400" />,
                title: "Café d'Exception",
                description: "Nos grains de café sont sélectionnés avec soin et torréfiés artisanalement pour vous offrir une expérience unique."
              },
              {
                icon: <Utensils className="h-8 w-8 text-amber-400" />,
                title: "Cuisine Créative",
                description: "Notre chef revisite les classiques avec des produits frais et locaux pour une cuisine savoureuse et inventive."
              },
              {
                icon: <Sunset className="h-8 w-8 text-amber-400" />,
                title: "Ambiance Élégante",
                description: "Un décor moderne et chaleureux avec une vue imprenable pour des moments inoubliables."
              }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                variants={fadeIn}
                className="text-center bg-gray-900/50 backdrop-blur-sm p-8 rounded-lg border border-gray-800 hover:border-amber-500/30 transition-all duration-500"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-amber-600/10 rounded-full flex items-center justify-center border border-amber-500/20">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-amber-400">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </motion.div>
            );}
          </motion.div>
        </div>
      </section>

      {/* Menu Carousel amélioré */}
      <section id="menu" className="py-20 bg-gray-900" ref={ref}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">Nos Spécialités</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Découvrez notre sélection de produits artisanaux préparés avec passion
            </p>
          </motion.div>

          <div className="relative">
            <div className="overflow-hidden">
              <motion.div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                animate={{ x: `${-currentSlide * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0 px-2">
                    <div className="grid md:grid-cols-3 gap-6">
                      {menuCategories.slice(slideIndex * slidesToShow, slideIndex * slidesToShow + slidesToShow).map((category) => (
                        <motion.div
                          key={category.id}
                          whileHover={{ y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-gray-800 border-gray-700 overflow-hidden group relative h-full">
                            <div 
                              className="h-64 bg-cover bg-center relative"
                              style={{ backgroundImage: `url(${category.image})` }}
                            >
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500"></div>
                              {category.featured && (
                                <div className="absolute top-4 right-4 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">
                                  Nouveau
                                </div>
                              }
                            </div>
                            <CardContent className="p-6 text-center">
                              <h3 className="text-xl font-semibold text-white mb-3">{category.name}</h3>
                              <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                              <Button variant="outline" className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white">
                                Voir les options
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );}
                    </div>
                  </div>
                );}
              </motion.div>
            </div>

            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 border-gray-600 text-white hover:bg-amber-600 z-10 h-10 w-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 border-gray-600 text-white hover:bg-amber-600 z-10 h-10 w-10"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-amber-600 w-6' : 'bg-gray-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );}
          </div>
        </div>
      </section>

      {/* Testimonials avec animations */}
      <section id="avis" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">Ce Que Disent Nos Clients</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Découvrez les expériences de ceux qui nous ont fait confiance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <Card className="bg-gray-900 border-gray-700 h-full">
                    <CardHeader>
                      <div className="flex justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < testimonial.rating ? 'text-amber-400 fill-current' : 'text-gray-600'}`} 
                          />
                        );}
                      </div>
                    </CardHeader>
                    <CardContent className="text-center">
                      <blockquote className="text-gray-300 italic mb-6 text-lg leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      <cite className="text-amber-400 font-semibold block">— {testimonial.author}</cite>
                      <span className="text-gray-500 text-sm mt-2 block">{testimonial.date}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              );}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Contact Section avec carte interactive */}
      <section id="contact" className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-light text-white mb-4">
              Nous Trouver
            </motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-gray-400 max-w-2xl mx-auto">
              Visitez-nous ou contactez-nous pour une réservation
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              variants={fadeIn}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.349646143843!2d-7.632376684798417!3d33.59324298073248!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDM1JzM1LjciTiA3wrAzNyczNi4xIlc!5e0!3m2!1sen!2sma!4v1620000000000!5m2!1sen!2sma"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              ></iframe>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6"
            >
              {[
                {
                  icon: <MapPin className="h-6 w-6 text-amber-400" />,
                  title: "Adresse",
                  content: "123 Rue du Café, Casablanca, Maroc"
                },
                {
                  icon: <Phone className="h-6 w-6 text-amber-400" />,
                  title: "Téléphone",
                  content: "+212 522 123 456"
                },
                {
                  icon: <Clock className="h-6 w-6 text-amber-400" />,
                  title: "Horaires",
                  content: "Lundi - Dimanche: 8h00 - 23h00"
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeIn}
                  className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-amber-500/30 transition-all duration-500"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-400 mb-1">{item.title}</h3>
                      <p className="text-gray-300">{item.content}</p>
                    </div>
                  </div>
                </motion.div>
              );}

              <motion.div variants={fadeIn} className="mt-4">
                <Button 
                  size="lg" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Réserver une table
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}