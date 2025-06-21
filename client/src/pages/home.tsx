import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import About from "@/components/about";
import Menu from "@/components/menu";
import Reservation from "@/components/reservation";
import Map from "@/components/map";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-coffee-light">
      <Navigation />
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Map />
      <Contact />
      <Footer />
    </div>
  );
}
