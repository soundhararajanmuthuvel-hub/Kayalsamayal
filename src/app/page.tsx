import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Story from "@/components/Story";
// InstagramReels is preserved for future re-enablement.
// import InstagramReels from "@/components/InstagramReels";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kayal Samayal | Traditional Masalas & Authentic South Indian Foods",
  description:
    "Shop Kayal Samayal Masala and authentic South Indian food products including traditional masalas, podis, health mixes and specialty foods. Explore 35+ varieties from Kayal Samayal.",
  alternates: {
    canonical: "https://www.kayalsamayal.in",
  },
  openGraph: {
    title: "Kayal Samayal | Traditional Masalas & Authentic South Indian Foods",
    description:
      "Shop Kayal Samayal Masala and authentic South Indian food products including traditional masalas, podis, health mixes and specialty foods. Explore 35+ varieties from Kayal Samayal.",
    url: "https://www.kayalsamayal.in",
    siteName: "Kayal Samayal",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Kayal Samayal - Traditional South Indian Foods",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kayal Samayal | Traditional Masalas & Authentic South Indian Foods",
    description:
      "Shop Kayal Samayal Masala and authentic South Indian food products including traditional masalas, podis, health mixes and specialty foods. Explore 35+ varieties from Kayal Samayal.",
    images: ["https://www.kayalsamayal.in/icon-512x512.png"],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.kayalsamayal.in/#website",
        "url": "https://www.kayalsamayal.in",
        "name": "Kayal Samayal",
        "alternateName": ["Kayal Samayal Masala", "Kayal Samayal Foods"],
        "description":
          "Shop Kayal Samayal Masala and authentic South Indian food products including traditional masalas, podis, health mixes and specialty foods.",
        "publisher": {
          "@id": "https://www.kayalsamayal.in/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.kayalsamayal.in/products?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": "https://www.kayalsamayal.in/#organization",
        "name": "Kayal Samayal",
        "legalName": "Kayal Samayal Masala",
        "url": "https://www.kayalsamayal.in",
        "logo": "https://www.kayalsamayal.in/icon-512x512.png",
        "image": "https://www.kayalsamayal.in/icon-512x512.png",
        "telephone": "+919003860616",
        "email": "kpmsamayal@gmail.com",
        "taxID": "33IKWPS3211P1ZB",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "504, TNHB Phase 1",
          "addressLocality": "Tirupattur",
          "addressRegion": "Tamil Nadu",
          "postalCode": "635601",
          "addressCountry": "IN",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 12.4925,
          "longitude": 78.5638,
        },
        "sameAs": [
          "https://wa.me/919003860616",
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Hero />
          <CategoriesGrid />
          <FeaturedProducts />
          <ProductShowcase />
          <WhyUs />
          <Story />
          {/*
           * Instagram Reels / video section temporarily disabled.
           * Re-enable by restoring: <InstagramReels />
           * Configuration: Google Sheets → Settings tab → instagram_reel_* keys.
           */}
          <Testimonials />

          {/* ── Small Instagram Follow CTA ──────────────────────────────── */}
          <div className="py-6 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="container-page flex items-center justify-center">
              <a
                href="https://www.instagram.com/kayalsamayal/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Kayal Samayal on Instagram"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 min-h-[40px]"
                style={{
                  background: "linear-gradient(135deg, #2E152C 0%, #D35400 100%)",
                  color: "white",
                }}
              >
                {/* Inline Instagram icon — no extra component needed */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="hp-ig" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497" />
                      <stop offset="5%" stopColor="#fdf497" />
                      <stop offset="45%" stopColor="#fd5949" />
                      <stop offset="60%" stopColor="#d6249f" />
                      <stop offset="90%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#hp-ig)" />
                  <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
                </svg>
                <span>Follow @kayalsamayal</span>
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
