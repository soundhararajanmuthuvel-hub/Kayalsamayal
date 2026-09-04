import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Kayal Samayal",
  description:
    "The page you are looking for does not exist. Browse authentic Kayal Samayal traditional masalas, homemade podis, and health mixes.",
  robots: {
    index: false,
    follow: true,
  },
};

const popularCategories = [
  { name: "Traditional Masalas", href: "/category/traditional-masalas" },
  { name: "Podi Products", href: "/category/podi-products" },
  { name: "Health Mixes & Malts", href: "/health-mixes" },
  { name: "Specialty Noodles", href: "/category/specialty-noodles" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        <section className="bg-spice-gradient py-14 sm:py-20 text-primary-foreground border-b border-white/10 text-center">
          <div className="container-page max-w-2xl mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center text-gold">
              <Compass className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              404 — PAGE NOT FOUND
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold">
              Looking for Authentic Flavours?
            </h1>
            <p className="text-white/85 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              The page you requested could not be found or has moved. Explore our traditional kitchen catalogue below.
            </p>
          </div>
        </section>

        <div className="container-page pt-10 sm:pt-14 max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-primary">
              Popular Kayal Samayal Categories
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {popularCategories.map((cat) => (
                <Link key={cat.href} href={cat.href}>
                  <Button variant="outline" size="sm" className="font-semibold text-xs border-border hover:border-secondary">
                    {cat.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/products">
              <Button variant="plum" size="touch" className="w-full sm:w-auto font-bold gap-2 shadow-md">
                <span>Browse All Products</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="touch" className="w-full sm:w-auto font-bold">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
