"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        const pool = data && data.length > 0 ? data : localProducts;
        // Select popular signature bestsellers
        const items = pool
          .filter((p) => p.tier === "premium" || p.image?.includes("fish") || p.image?.includes("biriyani") || p.image?.includes("abc"))
          .slice(0, 4);
        setFeatured(items.length > 0 ? items : pool.slice(0, 4));
      } catch (err) {
        console.error(err);
        setFeatured(localProducts.slice(0, 4));
      }
    }
    loadData();
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-background border-b border-border/60">
      <div className="container-page">
        {/* Header with View All link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>HANDPICKED FOR YOU</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
              Best Sellers & Signature Blends
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl">
              Our most celebrated recipes, roasted slowly and ground in small batches for peak aromatic freshness.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:text-primary transition-colors group shrink-0"
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
