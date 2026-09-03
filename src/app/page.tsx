import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Story from "@/components/Story";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kayal Samayal | Authentic Coastal Masalas & Pure South Indian Foods",
  description:
    "Buy authentic South Indian spices, traditional coastal masalas, organic podis, herbal mixes and health mixes from Kayalpatnam heritage. 100% pure, zero preservatives.",
  alternates: {
    canonical: "https://kayalsamayal.in",
  },
  openGraph: {
    title: "Kayal Samayal | Authentic Coastal Masalas & Pure South Indian Foods",
    description:
      "Handcrafted spices, masalas, and health mixes rooted in Kayalpatnam coastal heritage. Pure, clean ingredients. 35+ Varieties.",
    url: "https://kayalsamayal.in",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://kayalsamayal.in/#website",
        "url": "https://kayalsamayal.in",
        "name": "Kayal Samayal",
        "description": "Authentic South Indian spices, traditional coastal masalas, organic podis, and health mixes from Kayalpatnam heritage.",
        "publisher": {
          "@id": "https://kayalsamayal.in/#organization",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://kayalsamayal.in/#organization",
        "name": "Kayal Samayal Masala",
        "legalName": "Kayal Samayal Masala",
        "url": "https://kayalsamayal.in",
        "logo": "https://kayalsamayal.in/assets/logo.jpg",
        "image": "https://kayalsamayal.in/assets/logo.jpg",
        "telephone": "+919003860616",
        "email": "kayalsamayal@gmail.com",
        "taxID": "33IKWPS3211P1ZB",
        "identifier": "22423509000118",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "504, TNHB Phase 1",
          "addressLocality": "Tirupattur",
          "addressRegion": "Tamil Nadu",
          "postalCode": "635601",
          "addressCountry": "IN",
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
          <Testimonials />
        </main>
        <Footer />
      </div>
    </>
  );
}
