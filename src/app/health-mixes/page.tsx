import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HealthMixesInteractive from "./HealthMixesInteractive";

export const metadata: Metadata = {
  title: "Kayal Samayal Health Mixes & Malts | Traditional Food Products",
  description:
    "Discover authentic Kayal Samayal health mixes, ABC Malt, Golden Milk, Sathu Maavu, and herbal drinks prepared natively without white sugar or chemicals.",
  alternates: {
    canonical: "https://kayalsamayal.in/health-mixes",
  },
  openGraph: {
    title: "Kayal Samayal Health Mixes & Malts | Traditional Food Products",
    description:
      "Discover authentic Kayal Samayal health mixes, ABC Malt, Golden Milk, Sathu Maavu, and herbal drinks prepared natively without white sugar or chemicals.",
    url: "https://kayalsamayal.in/health-mixes",
    siteName: "Kayal Samayal",
    images: [
      {
        url: "https://kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Kayal Samayal Health Mixes",
      },
    ],
  },
};

export default function HealthMixesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        {/* Hero */}
        <section className="relative bg-spice-gradient py-14 sm:py-20 text-center text-primary-foreground border-b border-white/10 overflow-hidden">
          <div className="container-page relative z-10 max-w-4xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">
              TRADITIONAL NOURISHMENT
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Kayal Samayal Health Mixes & Malts
            </h1>
            <div className="divider-spice mx-auto" />
            <p className="text-white/85 max-w-xl mx-auto text-xs sm:text-sm sm:text-base leading-relaxed">
              Explore our whole-food malts, black rice porridge, and herbal drinks processed natively without white sugar or chemicals.
            </p>
          </div>
        </section>

        {/* Interactive Accordion Section */}
        <div className="container-page pt-10 sm:pt-16">
          <HealthMixesInteractive />
        </div>
      </main>
      <Footer />
    </div>
  );
}
