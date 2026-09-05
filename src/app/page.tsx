import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Story from "@/components/Story";
import InstagramReels from "@/components/InstagramReels";
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
          <InstagramReels />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </>
  );
}
