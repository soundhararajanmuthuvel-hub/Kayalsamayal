import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { brand, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Leaf,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Kayal Samayal | Traditional Taste & Pure Quality",
  description:
    "Learn about Kayal Samayal Masala, our Tirupattur kitchen, traditional Kayalpatnam heritage recipes, FSSAI certified standards, and pure spice craft.",
  alternates: {
    canonical: "https://www.kayalsamayal.in/about",
  },
  openGraph: {
    title: "About Kayal Samayal | Traditional Taste & Pure Quality",
    description:
      "Learn about Kayal Samayal Masala, our Tirupattur kitchen, traditional Kayalpatnam heritage recipes, FSSAI certified standards, and pure spice craft.",
    url: "https://www.kayalsamayal.in/about",
    siteName: "Kayal Samayal",
    images: [
      {
        url: "https://www.kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "About Kayal Samayal",
      },
    ],
  },
};

const values = [
  {
    icon: Leaf,
    title: "100% Pure & Unadulterated",
    desc: "We use only hand-sorted whole spices. No artificial color, no artificial flavoring, no preservatives, and no chemicals.",
  },
  {
    icon: Sparkles,
    title: "Ancestral Kayalpatnam Recipes",
    desc: "Our blends follow the timeless culinary tradition of Kayalpatnam coastal cuisine passed down through generations.",
  },
  {
    icon: ShieldCheck,
    title: "Small-Batch Fresh Grinding",
    desc: "Spices are slow-roasted and ground in small batches to preserve volatile aromatic oils and natural pungency.",
  },
  {
    icon: HeartHandshake,
    title: "Honest Family Nutrition",
    desc: "From Sathu Maavu to millet noodles, every recipe is wholesome, digestive-friendly, and crafted with complete care.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Hero Section */}
        <section className="bg-spice-gradient py-16 sm:py-20 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              OUR HERITAGE & MISSION
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              About Kayal Samayal
            </h1>
            <div className="divider-spice" />
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              Traditional Taste | Pure Quality | 35+ Varieties
            </p>
          </div>
        </section>

        {/* Narrative & Brand Story */}
        <section className="container-page pt-12 sm:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl max-w-sm text-center space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.jpg"
                  alt="Kayal Samayal Brand Heritage"
                  className="w-44 h-44 rounded-full object-cover mx-auto ring-4 ring-gold/40 shadow-md"
                />
                <div>
                  <h2 className="font-display font-bold text-lg text-primary">{brand.legalName}</h2>
                  <p className="text-xs text-secondary font-bold tracking-wider uppercase mt-0.5">
                    {brand.tagline}
                  </p>
                </div>
                <div className="pt-2 border-t border-border text-left text-xs text-muted-foreground space-y-1.5">
                  <p><strong>FSSAI Reg No:</strong> {brand.fssai}</p>
                  <p><strong>GST No:</strong> {brand.gst}</p>
                  <p><strong>Location:</strong> {brand.address.city}, {brand.address.state}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <span className="section-eyebrow">Rooted in Tradition</span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                From Historic Kayalpatnam to Every Indian Kitchen
              </h2>
              <div className="divider-spice lg:mx-0" />

              <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                <p>
                  Kayal Samayal was born with a passion to revive the genuine taste of traditional homemade South Indian food. Located in the heritage hub of Kayalpatnam and Tirupattur, our kitchen brings together whole coastal spices, unrefined herbs, and time-tested recipes.
                </p>
                <p>
                  Unlike commercial supermarket brands that rely on artificial flavor enhancers, food colors, and excessive starch fillers, we maintain strict quality standards: <strong>Zero chemicals, zero artificial colors, and zero preservatives.</strong>
                </p>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "35+ Authentic Homemade Varieties",
                  "100% Stone-Ground Whole Spices",
                  "Government Certified FSSAI Standards",
                  "Direct WhatsApp & Online Order Support",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Quality Values Grid */}
        <section className="container-page pt-16 sm:pt-24">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="section-eyebrow">Our Core Principles</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">
              The Kayal Samayal Promise
            </h2>
            <div className="divider-spice" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3 flex flex-col"
                >
                  <div className="h-11 w-11 rounded-xl bg-accent text-secondary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-primary">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section className="container-page pt-16">
          <div className="rounded-3xl bg-spice-gradient p-8 sm:p-12 text-center text-primary-foreground space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Ready to Experience Pure Coastal Flavours?
            </h2>
            <p className="text-white/80 text-sm max-w-lg mx-auto">
              Explore our catalogue of masalas, podis, noodles, and health mixes today.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/products">
                <Button variant="secondary" size="touch" className="font-bold gap-2 shadow-lg">
                  <span>Browse All 35+ Products</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href={whatsappLink("Hi Kayal Samayal! I would like to inquire about your products.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" size="touch" className="font-bold shadow-md">
                  <span>Order on WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
