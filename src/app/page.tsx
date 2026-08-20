import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductShowcase from "@/components/ProductShowcase";
import WhyUs from "@/components/WhyUs";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://kayalsamayal-gamma.vercel.app/#website",
        "url": "https://kayalsamayal-gamma.vercel.app",
        "name": "Kayal Samayal",
        "description": "Buy authentic South Indian spices, traditional coastal masalas, organic podis, and health mixes from Kayalpatnam heritage.",
        "publisher": {
          "@id": "https://kayalsamayal-gamma.vercel.app/#organization"
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://kayalsamayal-gamma.vercel.app/#organization",
        "name": "Kayal Samayal",
        "image": "https://kayalsamayal-gamma.vercel.app/assets/logo.jpg",
        "url": "https://kayalsamayal-gamma.vercel.app",
        "telephone": "+919003860616",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "No.504, Housing Board Ph1",
          "addressLocality": "Tirupattur",
          "addressRegion": "Tamil Nadu",
          "postalCode": "635601",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "12.4962",
          "longitude": "78.9801"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "09:00",
          "closes": "19:00"
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
      <main className="relative">
        <Header />
        <Hero />
        <Story />
        <FeaturedProducts />
        <CategoriesGrid />
        <ProductShowcase />
        <WhyUs />
        <Testimonials />
        <Newsletter />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
