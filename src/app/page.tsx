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
  title: "Traditional Masala & South Indian Spices | Kayal Samayal",
  description:
    "Buy 100% Pure Handmade Traditional Masala & South Indian Spices Online. 35+ Organic Masala Varieties - No Preservatives. Free Shipping Above ₹500. Order Kayal Samayal Today!",
  alternates: {
    canonical: "https://www.kayalsamayal.in",
  },
  openGraph: {
    title: "Traditional Masala & South Indian Spices | Kayal Samayal",
    description:
      "Buy 100% Pure Handmade Traditional Masala & South Indian Spices Online. 35+ Organic Masala Varieties - No Preservatives. Free Shipping Above ₹500. Order Kayal Samayal Today!",
    url: "https://www.kayalsamayal.in",
    siteName: "Kayal Samayal",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Traditional Masala & South Indian Spices | Kayal Samayal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Traditional Masala & South Indian Spices | Kayal Samayal",
    description:
      "Buy 100% Pure Handmade Traditional Masala & South Indian Spices Online. 35+ Organic Masala Varieties - No Preservatives. Free Shipping Above ₹500. Order Kayal Samayal Today!",
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
        "alternateName": [
          "Kayal Samayal Masala",
          "Kayal Samayal Traditional Foods",
          "Kayal Samayal Spices",
        ],
        "description":
          "Buy 100% Pure Handmade Traditional Masala & South Indian Spices Online. 35+ Organic Masala Varieties - No Preservatives. Free Shipping Above ₹500.",
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
        "logo": "https://www.kayalsamayal.in/logo.png",
        "image": "https://www.kayalsamayal.in/icon-512x512.png",
        "telephone": "+91 9003860616",
        "email": "kpmsamayal@gmail.com",
        "taxID": "33IKWPS3211P1ZB",
        "priceRange": "₹140 - ₹500",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "No.504 Housing Board Ph1",
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
        "areaServed": {
          "@type": "Country",
          "name": "India",
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            "opens": "09:00",
            "closes": "18:00",
          },
        ],
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
