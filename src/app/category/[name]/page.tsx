"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, categories, type Category, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice, useCart } from "@/context/CartContext";
import { ShoppingBag, MessageCircle, Star, CheckCircle, ChevronLeft, Camera } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const [categoryName, setCategoryName] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const decoded = decodeURIComponent(resolvedParams.name).replace(/-/g, " ");
        const matched = categories.find((c) => c.toLowerCase() === decoded.toLowerCase());
        
        if (matched) {
          setCategoryName(matched);
          const data = await getProducts();
          const pool = data && data.length > 0 ? data : localProducts;
          const items = pool.filter((p) => p.category === matched);
          setProducts(items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.name]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream-50 pt-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (!categoryName) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream-50 pt-32 text-center space-y-4">
          <span className="text-4xl">🏺</span>
          <h1 className="font-display font-bold text-brand-purple text-xl">Category Not Found</h1>
          <Link href="/products" className="btn-primary text-sm inline-flex min-h-[44px]">
            Back to Products
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 font-body text-xs sm:text-sm font-bold text-brand-purple hover:text-brand-orange transition-colors"
          >
            <ChevronLeft size={16} />
            <span>All Products</span>
          </Link>
        </div>

        {/* Category Header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl border border-cream-300 p-8 sm:p-12 shadow-xs text-center space-y-4">
            <span className="font-body text-xs font-bold tracking-widest text-brand-orange uppercase">
              CATEGORY ARCHIVE
            </span>
            <h1 className="font-display font-black text-brand-purple text-3xl sm:text-4xl leading-tight">
              {categoryName}
            </h1>
            <div className="divider-spice mx-auto bg-gold-gradient" />
            <p className="font-body text-espresso-800 max-w-xl mx-auto text-xs sm:text-sm">
              Discover our handcrafted selection of {categoryName.toLowerCase()} processed naturally.
            </p>
          </div>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          {products.length === 0 ? (
            <div className="bg-white border border-cream-300 rounded-2xl p-12 text-center space-y-3">
              <span className="text-4xl">🏺</span>
              <h3 className="font-display font-bold text-brand-purple text-lg">No products found</h3>
              <p className="font-body text-espresso-800 text-sm max-w-xs mx-auto">
                We couldn&apos;t find any items in this category right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
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
                      </div>
                    </Link>

                    <div className="p-4 flex flex-col flex-1">
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
        </section>

      </main>
      <Footer />
    </>
  );
}
