"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, categories, type Category, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice, useCart } from "@/context/CartContext";
import { Search, SlidersHorizontal, ArrowUpDown, ShoppingBag, Star, CheckCircle, Camera } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(localProducts);
        }
      } catch (err) {
        console.error(err);
        setProducts(localProducts);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync category hash if user lands with one
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#products-")) {
        const catName = decodeURIComponent(hash.substring(10)).replace(/-/g, " ");
        const matched = categories.find((c) => c.toLowerCase() === catName.toLowerCase());
        if (matched) {
          setSelectedCategories([matched]);
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleCategoryToggle = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                            p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesPrice = getProductPrice(p) <= maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "alpha") return a.name.localeCompare(b.name);
      return 0; // Default: database order
    });

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* Banner Header */}
        <section className="bg-spice-gradient py-12 text-center text-cream-50 border-b border-gold-500/10">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-gold-500">
              KAYAL CATALOGUE
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight">
              Our Traditional Spices
            </h1>
            <div className="divider-spice mx-auto bg-gold-gradient" />
            <p className="font-body text-cream-300 max-w-xl mx-auto text-xs sm:text-sm">
              Discover masalas, podis, noodles, and health mixes crafted natively without synthetic shortcuts.
            </p>
          </div>
        </section>

        {/* Content Directory */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* 1. SIDEBAR FILTERS - COLLAPSIBLE ON MOBILE */}
            <aside className={`w-full lg:w-64 flex-shrink-0 bg-white border border-cream-300 p-6 rounded-2xl shadow-xs space-y-6 lg:block ${sidebarOpen ? "block" : "hidden"}`}>
              <div className="flex justify-between items-center pb-4 border-b border-cream-200">
                <h2 className="font-display font-bold text-brand-purple text-lg">Filters</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden font-body text-xs font-bold text-brand-orange"
                >
                  Close
                </button>
              </div>

              {/* Category selector */}
              <div className="space-y-3">
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-body text-espresso-900">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={() => setSelectedCategories([])}
                      className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                    />
                    <span>All Products</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm font-body text-espresso-900">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range selector */}
              <div className="space-y-3 pt-4 border-t border-cream-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Max Price</h3>
                  <span className="font-body text-xs font-bold text-brand-purple">Rs. {maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-orange cursor-pointer"
                />
              </div>
            </aside>

            {/* 2. MAIN PRODUCTS CONTENT */}
            <div className="flex-1 w-full space-y-6">
              
              {/* Controls bar */}
              <div className="bg-white border border-cream-300 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-900/40" />
                  <input
                    type="text"
                    placeholder="Search spices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange placeholder-espresso-900/40 text-espresso-900"
                  />
                </div>

                {/* Sort & Mobile filters launcher */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-purple transition-colors min-h-[40px] cursor-pointer"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Filter</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-brand-orange" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-cream-50 border border-cream-300 text-xs sm:text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-brand-purple min-h-[40px]"
                    >
                      <option value="newest">Sort: Default</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="alpha">Name: A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Loading spinner */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-cream-300 overflow-hidden flex flex-col h-[320px] animate-pulse">
                      <div className="aspect-square bg-cream-200" />
                      <div className="p-4 flex flex-col flex-1 space-y-2">
                        <div className="h-3 bg-cream-200 rounded w-1/4" />
                        <div className="h-5 bg-cream-200 rounded w-3/4" />
                        <div className="h-4 bg-cream-200 rounded w-full" />
                        <div className="h-9 bg-cream-200 rounded w-full mt-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border border-cream-300 rounded-2xl p-12 text-center space-y-3">
                  <span className="text-4xl">🏺</span>
                  <h3 className="font-display font-bold text-brand-purple text-lg">No products found</h3>
                  <p className="font-body text-espresso-800 text-sm max-w-xs mx-auto">
                    Try adjusting your search keywords, price limits, or category selectors.
                  </p>
                </div>
              ) : (
                /* Products Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const price = getProductPrice(product);
                    const isPremium = product.tier === "premium";
                    return (
                      <div
                        key={product.id}
                        className={`card-hover relative bg-white rounded-xl shadow-xs overflow-hidden border flex flex-col justify-between ${
                          isPremium
                            ? "border-brand-orange/40 shadow-[0_4px_24px_rgba(200,100,50,0.06)]"
                            : "border-cream-300"
                        }`}
                      >
                        {isPremium && (
                          <div className="ribbon text-[0.6rem] sm:text-[0.65rem]">
                            ✦ PREMIUM
                          </div>
                        )}

                        <Link href={`/products/${product.id}`} className="group block cursor-pointer">
                          <div className="aspect-square bg-brand-cream/30 relative overflow-hidden rounded-t-xl flex items-center justify-center p-4">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="photo-coming-soon w-full h-full rounded-t-xl flex flex-col items-center justify-center bg-cream-100">
                                <Camera size={24} className="text-cream-400 opacity-50 mb-1" />
                                <span className="font-body text-xs text-espresso-800 opacity-60">Photo Coming Soon</span>
                              </div>
                            )}

                            {/* Rating */}
                            <div className="absolute top-2 left-2 bg-brand-purple text-cream-100 text-[0.65rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star size={10} className="text-gold-500 fill-gold-500" />
                              <span>5.0</span>
                            </div>
                          </div>
                        </Link>

                        <div className="p-4 flex flex-col flex-1">
                          <p className="font-body text-[0.55rem] sm:text-[0.6rem] tracking-[0.12em] uppercase text-brand-orange font-bold mb-1">
                            {product.category}
                          </p>

                          <div className="flex items-start justify-between gap-1 mb-2">
                            <Link href={`/products/${product.id}`} className="hover:text-brand-orange transition-colors">
                              <h3 className="font-display font-bold text-brand-purple text-sm sm:text-base leading-snug">
                                {product.name}
                              </h3>
                            </Link>
                            <span className="font-body text-xs font-bold text-brand-purple shrink-0 whitespace-nowrap bg-brand-cream px-2 py-0.5 rounded-lg border border-brand-cream-dark/65">
                              Rs. {price}
                            </span>
                          </div>

                          <p className="font-body text-espresso-800 text-xs leading-relaxed flex-1 mb-3 line-clamp-2">
                            {product.description}
                          </p>

                          {/* Highlights */}
                          <ul className="space-y-0.5 mb-4 hidden sm:block">
                            {product.highlights.slice(0, 2).map((h) => (
                              <li key={h} className="flex items-center gap-1.5">
                                <CheckCircle size={10} className="text-brand-orange shrink-0" />
                                <span className="font-body text-espresso-800 text-[0.65rem] truncate">{h}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-1.5 mt-auto">
                            <button
                              onClick={() => addToCart(product)}
                              className="flex items-center justify-center gap-1.5 w-full bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold py-2 rounded-lg transition-colors min-h-[40px] cursor-pointer"
                            >
                              <ShoppingBag size={13} />
                              Add to Cart
                            </button>
                            <a
                              href={product.whatsappMessage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-whatsapp w-full justify-center text-xs py-2 min-h-[40px] flex items-center gap-1"
                            >
                              Order on WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
