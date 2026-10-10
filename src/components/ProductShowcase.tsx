"use client";

import { useState, useEffect } from "react";
import { products as localProducts, type Product } from "@/data/products";
import { getUniqueCategories, normalizeCategory } from "@/lib/categories";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";

export default function ProductShowcase() {
  const [allProducts, setAllProducts] = useState<Product[]>(localProducts);
  const dynamicCategories = getUniqueCategories(allProducts);
  const [activeCategory, setActiveCategory] = useState<string>(dynamicCategories[0] || "Traditional Masalas");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          setAllProducts(data);
          const liveCats = getUniqueCategories(data);
          if (liveCats.length > 0) {
            setActiveCategory((current) => {
              return liveCats.some((c) => normalizeCategory(c) === normalizeCategory(current))
                ? current
                : liveCats[0];
            });
          }
        }
      } catch {
        // Keeps local fallback
      }
    }
    loadData();
  }, []);

  const displayedProducts = allProducts.filter(
    (p) => p.active !== false && normalizeCategory(p.category) === normalizeCategory(activeCategory)
  );

  return (
    <section id="products" className="py-16 sm:py-24 bg-white border-b border-border/80">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
          <p className="section-eyebrow">Product Discovery</p>
          <h2 className="section-title">
            Explore by <span className="text-[#174D35] font-display italic">Specialty</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-[#6B5E54] text-sm sm:text-base">
            Select a category to browse signature blends, health mixes, and noodles.
          </p>
        </div>

        {/* Category Tabs (Scrollable on Mobile) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 sm:mb-12 px-1">
          {dynamicCategories.map((cat) => {
            const isActive = normalizeCategory(activeCategory) === normalizeCategory(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[40px] cursor-pointer ${
                  isActive
                    ? "bg-[#174D35] text-white shadow-sm"
                    : "bg-[#F8F4E9] text-[#332820] hover:bg-[#EFE8D6] border border-border"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#F8F4E9] rounded-2xl border border-border p-8">
            <span className="text-3xl">🏺</span>
            <h3 className="font-display font-bold text-lg mt-2 text-[#332820]">No items found in this section</h3>
            <p className="text-xs text-[#6B5E54] mt-1">Please explore our other authentic categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-4">
            {displayedProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Bottom Discovery Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Link href="/products">
            <Button variant="forest" size="pill" className="gap-2 font-bold shadow-md rounded-full">
              <span>View Full Catalogue (35+ Items)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174D35] hover:underline">
            <Search className="h-3.5 w-3.5" />
            <span>Search complete collection</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
