import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HealthMixesInteractive from "./HealthMixesInteractive";

export const metadata: Metadata = {
  title: "Wellness Through Tradition | Kayal Samayal Health Mixes",
  description:
    "Explore Kayal Samayal's authentic health mixes, traditional malts, and herbal blends. Learn about the benefits of ABC Malt, Golden Milk, and Kavuni Rice.",
  alternates: {
    canonical: "https://kayalsamayal-gamma.vercel.app/health-mixes",
  },
};

export default function HealthMixesPage() {
  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        {/* Hero */}
        <section className="relative bg-spice-gradient py-20 text-center text-cream-50 overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-3">
            <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-gold-400">
              TRADITIONAL NUTRITION
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Wellness Through Tradition
            </h1>
            <div className="divider-spice mx-auto bg-gold-gradient" />
            <p className="font-body text-cream-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Explore our slow-ground Ayurvedic malts and grain drinks processed natively to guard your body’s natural energy.
            </p>
          </div>
        </section>

        {/* Interactive Accordion Section */}
        <HealthMixesInteractive />

      </main>
      <Footer />
    </>
  );
}
