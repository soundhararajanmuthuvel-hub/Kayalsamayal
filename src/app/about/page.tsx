import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Leaf, Star, HelpCircle, Phone, Mail, MapPin, QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "About Kayal Samayal | Traditional Taste & Pure Quality",
  description:
    "Learn about Kayal Samayal, our traditional food range, coastal flavours, quality promise and 35+ varieties of authentic masalas, podis and more.",
  alternates: {
    canonical: "https://kayalsamayal-gamma.vercel.app/about",
  },
};

const WA_LINK =
  "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20explore%20your%20products.";
const WA_CATALOGUE_LINK =
  "https://wa.me/c/919003860616";

const qualityPoints = [
  {
    icon: ShieldCheck,
    title: "100% Traditional Taste",
    desc: "Blends created from recipes guarded and passed down through generations by families in historic Kayalpatnam.",
  },
  {
    icon: Leaf,
    title: "Genuine Whole Spices",
    desc: "Prepared using only natural whole spices, unrefined herbs, and clean ingredients. Absolutely no fillers or starch.",
  },
  {
    icon: Star,
    title: "Zero Preservatives",
    desc: "We add no artificial colors, chemical preservatives, or flavour enhancers. Natural colours reflect the actual ground spices.",
  },
  {
    icon: HelpCircle,
    title: "Crafted in Small Batches",
    desc: "Every package is ground and packed in controlled, small batches to keep the essential spice oils active and aromatic.",
  },
];

const productRanges = [
  { name: "Traditional Masalas", image: "/assets/fish-curry-masala.jpg" },
  { name: "Podi Products", image: "/assets/andhra-paruppu-sadham-podi.jpg" },
  { name: "Specialty Noodles", image: "/assets/moringa-noodles.jpg" },
  { name: "Health Mixes & Malts", image: "/assets/abc-malt.jpg" },
  { name: "PeruKalam Legiyam", image: "/assets/kindiya-kaayam.jpg" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* 1. ABOUT PAGE HERO */}
        <section className="relative bg-spice-gradient py-24 sm:py-32 overflow-hidden text-center text-cream-50">
          <div className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-4">
            <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-gold-400">
              ABOUT KAYAL SAMAYAL
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-tight">
              Traditional Taste.<br />
              <span className="gold-shimmer font-semibold">Pure Quality.</span>
            </h1>
            
            <div className="pt-6 flex justify-center">
              <img
                src="/assets/logo.jpg"
                alt="Kayal Samayal Brand Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-2xl ring-4 ring-gold-500/50"
              />
            </div>
          </div>
        </section>

        {/* 2. BRAND INTRODUCTION */}
        <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-cream-300">
          <div className="text-center space-y-4 mb-10">
            <h2 className="font-display font-extrabold text-brand-purple text-2xl sm:text-3xl lg:text-4xl">
              About Kayal Samayal
            </h2>
            <p className="font-body text-sm font-bold tracking-wider text-brand-orange uppercase">
              Traditional Taste | Pure Quality | 35+ Varieties
            </p>
            <div className="divider-spice" />
          </div>
          
          <div className="font-body text-espresso-800 text-base leading-relaxed space-y-6 text-center sm:text-left">
            <p>
              Kayal Samayal is a premium traditional food brand dedicated to reviving the honest culinary traditions of coastal South India. Rooted in the rich food heritage of Kayalpatnam—the historic spice trading port of Tamil Nadu—we focus on creating spice blends, masalas, and health mixes that taste exactly like homemade food.
            </p>
            <p>
              We believe in uncompromised purity. Unlike modern mass-produced food products that rely on chemical preservatives, artificial colors, and high-heat processing, we slow-roast our whole ingredients and dry them naturally. This preserves the essential oils that give spices their natural depth and health benefits.
            </p>
          </div>
        </section>

        {/* 3. OUR TRADITION */}
        <section className="py-16 sm:py-24 bg-white border-b border-cream-300">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              {/* Image box */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border border-cream-300 shadow-lg p-2 bg-cream-100/40">
                  <img
                    src="/assets/logo.jpg"
                    alt="Kayal Samayal traditional food spices representation"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
              
              {/* Text box */}
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                <h3 className="font-display font-extrabold text-brand-purple text-xl sm:text-2xl lg:text-3xl">
                  Our Tradition
                </h3>
                <div className="divider-spice lg:mx-0" />
                <p className="font-body text-espresso-800 text-base leading-relaxed">
                  For centuries, families in coastal port towns like Kayalpatnam prepared their meals using stone-ground spices and whole grain health mixes. This slower method retained the natural freshness, aroma, and inherent nutritional properties.
                </p>
                <p className="font-body text-espresso-800 text-base leading-relaxed">
                  Our recipes remain faithful to these kitchen traditions. From our signature Fish Curry Masala to health drinks like ABC Malt and traditional Peruvian remedies, we bring authentic flavours back to modern households.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PRODUCT RANGE & 35+ VARIETIES */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-cream-300">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display font-extrabold text-brand-purple text-2xl sm:text-3xl">
              35+ Traditional Varieties
            </h2>
            <div className="divider-spice mb-4" />
            <p className="font-body text-espresso-800 max-w-xl mx-auto text-sm sm:text-base">
              Explore our range of masalas, podis, herbal mixes, and specialties designed for pure taste and health.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {productRanges.map((cat, idx) => (
              <div key={idx} className="bg-white border border-cream-300 p-4 rounded-xl shadow-xs text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-brand-cream/50 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-brand-cream-dark/30 mb-3">
                  <img src={cat.image} alt={cat.name} className="max-h-full object-contain" />
                </div>
                <h3 className="font-display font-bold text-brand-purple text-xs sm:text-sm leading-tight">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/#products" className="btn-primary text-sm font-bold min-h-[44px]">
              Explore All Products
            </Link>
          </div>
        </section>

        {/* 5. QUALITY PROMISE */}
        <section className="py-16 sm:py-24 bg-white border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="font-display font-extrabold text-brand-purple text-2xl sm:text-3xl">
                Our Quality Promise
              </h2>
              <div className="divider-spice mb-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {qualityPoints.map((item, idx) => (
                <div key={idx} className="bg-cream-50 rounded-xl p-6 border border-cream-300 text-center flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                    <item.icon size={22} className="text-brand-orange" />
                  </div>
                  <h3 className="font-display font-bold text-brand-purple text-sm sm:text-base leading-tight">
                    {item.title}
                  </h3>
                  <p className="font-body text-espresso-800 text-xs sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. TRUST & AUTHENTICITY */}
        <section className="py-12 bg-cream-100 border-b border-cream-300 text-center">
          <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div className="text-left">
                <p className="font-body text-[0.65rem] tracking-wider uppercase text-brand-orange font-bold">Standard Certification</p>
                <p className="font-display font-extrabold text-brand-purple text-sm sm:text-base leading-tight">FSSAI Registered Brand</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-cream-300 pt-4 sm:pt-0 sm:pl-12">
              <span className="text-3xl">📋</span>
              <div className="text-left">
                <p className="font-body text-[0.65rem] tracking-wider uppercase text-brand-orange font-bold">Business Registration</p>
                <p className="font-display font-extrabold text-brand-purple text-sm sm:text-base leading-tight">GST Registered Facility</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. WHATSAPP CATALOGUE SECTION */}
        <section className="py-16 sm:py-24 bg-white border-b border-cream-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-display font-extrabold text-brand-purple text-2xl sm:text-3xl">
              Explore Our Catalogue
            </h2>
            <div className="divider-spice" />
            
            <p className="font-body text-espresso-800 text-sm sm:text-base max-w-xl mx-auto">
              Prefer to browse directly on WhatsApp? You can scan our official QR code below or tap to view our live traditional catalog.
            </p>

            <div className="flex flex-col items-center gap-4 py-4">
              {/* QR frame */}
              <div className="bg-cream-50 p-4 border-2 border-brand-orange/30 rounded-2xl shadow-md inline-flex flex-col items-center">
                <QrCode size={120} className="text-brand-purple" />
                <span className="font-body text-[0.65rem] font-bold text-brand-purple tracking-widest uppercase mt-2">KAYAL CATALOGUE QR</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href={WA_CATALOGUE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full sm:w-auto text-sm font-bold min-h-[48px] justify-center"
              >
                View WhatsApp Catalogue
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp w-full sm:w-auto text-sm font-bold min-h-[48px] justify-center"
              >
                <MessageCircle size={16} /> Order on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* 8. CONTACT INFORMATION */}
        <section id="contact-info" className="py-16 sm:py-24 bg-cream-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="font-display font-extrabold text-brand-purple text-2xl sm:text-3xl">
                Contact Information
              </h2>
              <div className="divider-spice mb-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-xs text-center flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Phone size={16} className="text-brand-orange" />
                </div>
                <h3 className="font-display font-bold text-brand-purple text-sm">Call / WhatsApp</h3>
                <a href="tel:+919003860616" className="font-body text-espresso-800 text-xs sm:text-sm hover:text-brand-orange transition-colors">
                  (+91) 9003860616
                </a>
              </div>

              <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-xs text-center flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Mail size={16} className="text-brand-orange" />
                </div>
                <h3 className="font-display font-bold text-brand-purple text-sm">Email Us</h3>
                <a href="mailto:kpmsamayal@gmail.com" className="font-body text-espresso-800 text-xs sm:text-sm hover:text-brand-orange transition-colors break-all">
                  kpmsamayal@gmail.com
                </a>
              </div>

              <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-xs text-center flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <MapPin size={16} className="text-brand-orange" />
                </div>
                <h3 className="font-display font-bold text-brand-purple text-sm">Business Address</h3>
                <p className="font-body text-espresso-800 text-[0.7rem] sm:text-xs leading-relaxed">
                  No.504, Housing Board Ph1,<br />Tirupattur – 635601, Tamil Nadu
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
