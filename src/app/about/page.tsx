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
    "Learn about Kayal Samayal Masala, our Tirupattur kitchen, traditional heritage recipes, FSSAI certified standards, and pure spice craft.",
  alternates: {
    canonical: "https://www.kayalsamayal.in/about",
  },
  openGraph: {
    title: "About Kayal Samayal | Traditional Taste & Pure Quality",
    description:
      "Learn about Kayal Samayal Masala, our Tirupattur kitchen, traditional heritage recipes, FSSAI certified standards, and pure spice craft.",
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
    desc: "We use only hand-sorted whole spices. No artificial colour, no artificial flavouring, no preservatives, and no chemicals.",
  },
  {
    icon: Sparkles,
    title: "Ancestral Heritage Recipes",
    desc: "Our blends follow the timeless culinary tradition of South Indian coastal cuisine passed down through generations.",
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
    <div className="flex min-h-screen flex-col bg-[#F8F4E9]">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Hero Section */}
        <section className="bg-[#0D2F22] py-16 sm:py-20 text-[#F8F4E9] border-b border-[#B88A3B]/30">
          <div className="container-page text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B88A3B]">
              OUR HERITAGE &amp; MISSION
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-white">
              About Kayal Samayal
            </h1>
            <div className="divider-spice" />
            <p className="text-[#F8F4E9]/85 text-sm sm:text-base leading-relaxed">
              Traditional Taste | Pure Quality | 35+ Varieties
            </p>
          </div>
        </section>

        {/* Narrative & Brand Story */}
        <section className="container-page pt-12 sm:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-3xl border border-border bg-white p-6 shadow-md max-w-sm text-center space-y-4">
                <div className="flex items-center justify-center p-4 bg-[#F8F4E9] rounded-2xl border border-border">
                  <picture>
                    <source srcSet="/logo-card.webp" type="image/webp" />
                    <img
                      src="/logo.png"
                      alt="Kayal Samayal Brand Heritage"
                      width={357}
                      height={214}
                      className="w-56 h-auto max-h-36 object-contain filter drop-shadow-sm"
                    />
                  </picture>
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-[#332820]">{brand.legalName}</h2>
                  <p className="text-xs text-[#B88A3B] font-bold tracking-wider uppercase mt-0.5">
                    {brand.tagline}
                  </p>
                </div>
                <div className="pt-2 border-t border-border text-left text-xs text-[#6B5E54] space-y-1.5">
                  <p><strong>FSSAI Reg No:</strong> {brand.fssai}</p>
                  <p><strong>GST No:</strong> {brand.gst}</p>
                  <p><strong>Location:</strong> {brand.address.city}, {brand.address.state}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <span className="section-eyebrow">Rooted in Tradition</span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#332820]">
                From Heritage Kitchens to Every Dining Table
              </h2>
              <div className="divider-spice lg:mx-0" />

              <div className="space-y-4 text-[#6B5E54] text-sm sm:text-base leading-relaxed">
                <p>
                  Kayal Samayal was born with a passion to revive the genuine taste of traditional homemade South Indian food. Located in Tirupattur, Tamil Nadu, our kitchen brings together whole coastal spices, unrefined herbs, and time-tested recipes.
                </p>
                <p>
                  Unlike commercial supermarket brands that rely on artificial flavour enhancers, food colours, and excessive starch fillers, we maintain strict quality standards: <strong>Zero chemicals, zero artificial colours, and zero preservatives.</strong>
                </p>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "35+ Authentic Homemade Varieties",
                  "100% Stone-Ground Whole Spices",
                  "Government Certified FSSAI Standards",
                  "Direct WhatsApp & Online Order Support",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#332820]">
                    <CheckCircle2 className="h-4 w-4 text-[#174D35] shrink-0" />
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
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#332820]">
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
                  className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-3 flex flex-col"
                >
                  <div className="h-11 w-11 rounded-xl bg-[#F8F4E9] text-[#174D35] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#332820]">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6B5E54] leading-relaxed flex-1">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section className="container-page pt-16">
          <div className="rounded-3xl bg-[#0D2F22] p-8 sm:p-12 text-center text-[#F8F4E9] border border-[#B88A3B]/30 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Ready to Experience Pure Traditional Flavours?
            </h2>
            <p className="text-white/80 text-sm max-w-lg mx-auto leading-relaxed">
              Explore our catalogue of masalas, podis, noodles, and health mixes delivered fresh to your doorstep.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/products">
                <Button variant="gold" size="touch" className="font-bold gap-2 shadow-lg rounded-xl">
                  <span>Browse All 35+ Products</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href={whatsappLink("Hi Kayal Samayal! I would like to inquire about your products.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" size="touch" className="font-bold shadow-md rounded-xl">
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
