import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <Story />
      <ProductShowcase />
      <WhyUs />
      <Contact />
      <Footer />
    </main>
  );
}
