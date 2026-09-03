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

export default function ProductsPage() {
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
        selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
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
      return 0;
    });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              KAYAL SAMAYAL STORE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold">
              Traditional Spices & Healthy Foods
            </h1>
            <div className="divider-spice" />
            <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto">
              Explore 35+ varieties of stone-ground masalas, podis, noodles, and herbal mixes handcrafted without preservatives.
            </p>
          </div>
        </section>

        <div className="container-page pt-8 sm:pt-12">
          {/* Search, Filter Bar, and Sort Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search masalas, podis, noodles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Buttons & Sort Dropdown */}
            <div className="flex items-center gap-3 justify-between md:justify-end">
              {/* Mobile Filter Trigger */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center gap-1.5 font-bold"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {selectedCategory !== "All" && (
                  <span className="ml-1 rounded-full bg-secondary text-white px-1.5 py-0.2 text-[0.65rem]">
                    1
                  </span>
                )}
              </Button>

              {/* Sort Selector */}
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
                  <option value="name">Alphabetical (A - Z)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Desktop Left Sidebar Filters */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-card rounded-2xl border border-border/80 p-6 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="font-display font-bold text-lg text-primary">Filters</h2>
                {(selectedCategory !== "All" || selectedTier !== "All" || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedTier("All");
                      setSearch("");
                    }}
                    className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Category Filter List */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === "All"
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="text-xs opacity-75">{products.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <span className="truncate pr-2">{cat}</span>
                        <span className="text-xs opacity-75">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier Filter */}
              <div className="space-y-2.5 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Blend Tier
                </h3>
                <div className="flex gap-2">
                  {["All", "regular", "premium"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                        selectedTier === tier
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-surface text-foreground hover:bg-accent border border-border"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Products Grid */}
            <div className="lg:col-span-9 space-y-6">
              {/* Category Pills on Tablet/Mobile */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === "All"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-surface text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  All ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-surface text-foreground hover:bg-accent border border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Showing count indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing <strong>{filteredProducts.length}</strong> authentic {filteredProducts.length === 1 ? "product" : "products"}
                </span>
                {selectedCategory !== "All" && (
                  <span className="font-semibold text-secondary">{selectedCategory}</span>
                )}
              </div>

              {/* Grid Layout */}
              <ProductGrid
                products={filteredProducts}
                loading={loading}
                emptyTitle="No matches found"
                emptyMessage="Try clearing your search query or selecting a different category."
                action={
                  <Button
                    variant="plum"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("All");
                      setSelectedTier("All");
                    }}
                  >
                    Clear All Filters
                  </Button>
                }
              />
            </div>

          </div>
        </div>
      </main>
      <Footer />

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-primary/70 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-card h-full p-6 shadow-2xl flex flex-col space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-display font-bold text-lg">Filter Products</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Category
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setMobileFiltersOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
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
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                      selectedCategory === cat ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <Button
                variant="plum"
                size="touch"
                className="w-full font-bold"
                onClick={() => setMobileFiltersOpen(false)}
              >
                View {filteredProducts.length} Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
