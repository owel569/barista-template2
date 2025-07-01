import Hero from "@/components/hero";
import About from "@/components/about";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-coffee-light">
      <Hero />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
