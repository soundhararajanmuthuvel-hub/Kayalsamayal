"use client";

import { useState, useEffect } from "react";
import { products as localProducts, categories, type Category, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState<Category>("Traditional Masalas");
  const [allProducts, setAllProducts] = useState<Product[]>(localProducts);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          setAllProducts(data);
        }
      } catch {
        // Keeps local fallback
      }
    }
    loadData();
  }, []);

  const displayedProducts = allProducts.filter(
    (p) => p.category === activeCategory
  );

  return (
    <section id="products" className="py-16 sm:py-24 bg-surface border-b border-border/60">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
          <p className="section-eyebrow">Pure Spices & Foods</p>
          <h2 className="section-title">
            Our Traditional <span className="text-secondary font-display italic">Collection</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse our complete assortment by category or view our entire catalogue.
          </p>
        </div>

        {/* Category Tabs (Scrollable on Mobile) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 sm:mb-12 px-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all min-h-[40px] cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground hover:bg-accent border border-border"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border p-8">
            <span className="text-3xl">🏺</span>
            <h3 className="font-display font-bold text-lg mt-2">No items in this category currently</h3>
            <p className="text-xs text-muted-foreground mt-1">Check out our other authentic categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-4">
            {displayedProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Bottom Link to Full Shop */}
        <div className="mt-12 text-center">
          <Link href="/products">
            <Button variant="plum" size="pill" className="gap-2 font-bold shadow-md">
              <span>View Full Shop Catalogue (35+ Items)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
