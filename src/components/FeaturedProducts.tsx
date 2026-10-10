"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";

// Target real products highlighted in design brief:
// Kayal Curry Masala, Kayal Kalari Masala, Kayal Rasam Podi, Red Rice Noodles, Golden Milk Magic, A.B.C. Malt
const targetSlugs = [
  "kayal-curry-masala",
  "kayal-kalari-masala-regular",
  "kayal-rasam-podi",
  "red-rice-noodles",
  "golden-milk-magic",
  "abc-malt",
];

const initialFeatured = localProducts.filter((p) => targetSlugs.includes(p.id) || p.tier === "premium").slice(0, 4);

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState<Product[]>(
    initialFeatured.length > 0 ? initialFeatured : localProducts.slice(0, 4)
  );

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        const pool = data && data.length > 0 ? data : localProducts;
        
        // Match target signature products from live or local data
        const matched = targetSlugs
          .map((id) => pool.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p && p.active !== false));

        if (matched.length >= 4) {
          setFeatured(matched.slice(0, 4));
        } else {
          // Fallback to active items with images
          const fallback = pool.filter((p) => p.active !== false && p.image).slice(0, 4);
          setFeatured(fallback.length > 0 ? fallback : pool.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-border/80">
      <div className="container-page">
        {/* Header with View All link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B88A3B] uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>HANDPICKED SIGNATURE SELECTION</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#332820]">
              Signature Traditional Blends
            </h2>
            <p className="text-[#6B5E54] text-xs sm:text-sm max-w-xl">
              Authentic recipes prepared in micro-batches with slow sun-dried spices and zero chemical preservatives.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#174D35] hover:text-[#0D2F22] transition-colors group shrink-0"
          >
            <span>View All 35+ Varieties</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
