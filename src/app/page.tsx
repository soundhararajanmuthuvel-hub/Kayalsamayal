import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Story from "@/components/Story";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

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
          "@id": "https://kayalsamayal.in/#organization"
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://kayalsamayal.in/#organization",
        "name": "Kayal Samayal Masala",
        "image": "https://kayalsamayal.in/assets/logo.jpg",
        "url": "https://kayalsamayal.in",
        "telephone": "+919003860616",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "504, TNHB Phase 1",
          "addressLocality": "Tirupattur",
          "addressRegion": "Tamil Nadu",
          "postalCode": "635601",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "12.4962",
          "longitude": "78.9801"
        }
      }
    ]
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
