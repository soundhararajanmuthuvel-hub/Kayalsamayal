"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, categories, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice } from "@/context/CartContext";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        setProducts(data && data.length > 0 ? data : localProducts);
      } catch {
        setProducts(localProducts);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter & Sort
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "All" ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase().split(" ")[0]);

      const matchTier =
        selectedTier === "All" || p.tier === selectedTier;

      return matchSearch && matchCategory && matchTier;
    })
    .sort((a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // featured/default
    });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              OUR COMPLETE CATALOGUE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold">
              Traditional Masalas & Foods
            </h1>
            <p className="text-white/80 max-w-xl mx-auto text-xs sm:text-sm sm:text-base">
              Over 35+ pure South Indian varieties stone ground in small batches with zero preservatives.
            </p>
          </div>
        </section>

        <div className="container-page pt-8 sm:pt-12">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-border">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search masalas, podis, noodles, malts..."
                className="w-full rounded-2xl border border-border bg-card pl-10 pr-10 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Sort & Mobile Filter Trigger */}
            <div className="flex items-center gap-2 sm:gap-3 justify-between md:justify-end">
              
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden gap-1.5 font-bold text-xs"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {(selectedCategory !== "All" || selectedTier !== "All") && (
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                )}
              </Button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline-block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "featured" | "price-asc" | "price-desc" | "name")}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

            </div>

          </div>

          {/* Main Content: Sidebar + Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
            
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-6 sticky top-28">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-sm tracking-wider uppercase text-primary">
                  Categories
                </h3>
                {(selectedCategory !== "All" || selectedTier !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedTier("All");
                    }}
                    className="text-xs text-secondary font-semibold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Radio / Pills */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    selectedCategory === "All"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) =>
                    p.category.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
                  ).length;
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className="text-xs opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Tier Filter */}
              <div className="pt-4 border-t border-border space-y-2">
                <h3 className="font-display font-bold text-xs tracking-wider uppercase text-primary">
                  Blend Tier
                </h3>
                <div className="flex gap-1.5 p-1 rounded-xl bg-surface border border-border">
                  {["All", "regular", "premium"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                        selectedTier === tier
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

            </aside>

            {/* Products Grid Area */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Active Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
                </span>

                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary border border-border">
                    <span>Category: {selectedCategory}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-secondary"
                      onClick={() => setSelectedCategory("All")}
                    />
                  </span>
                )}

                {selectedTier !== "All" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary border border-border">
                    <span>Tier: {selectedTier}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-secondary"
                      onClick={() => setSelectedTier("All")}
                    />
                  </span>
                )}

                {search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary border border-border">
                    <span>Query: &ldquo;{search}&rdquo;</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-secondary"
                      onClick={() => setSearch("")}
                    />
                  </span>
                )}
              </div>

              {/* Grid Component */}
              <ProductGrid
                products={filteredProducts}
                loading={loading}
                emptyMessage="No products match your active search or filters."
              />

            </div>

          </div>

        </div>

      </main>
      <Footer />

      {/* ── Mobile Filter Modal ────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-xs bg-card p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-base text-primary">Filters</h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      selectedCategory === "All" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        selectedCategory === cat ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiers */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tier</span>
                <div className="flex gap-2">
                  {["All", "regular", "premium"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setSelectedTier(tier);
                        setMobileFiltersOpen(false);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize ${
                        selectedTier === tier
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface border border-border"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="plum"
              size="touch"
              className="w-full mt-6"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
