"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice, useCart } from "@/context/CartContext";
import { ShoppingBag, MessageCircle, Star, CheckCircle, ChevronLeft, ShieldCheck, Heart, Camera } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        const pool = data && data.length > 0 ? data : localProducts;
        const item = pool.find((p) => p.id === resolvedParams.id);
        if (item) {
          setProduct(item);
          // Get 3 related items from same category
          const others = pool.filter((p) => p.category === item.category && p.id !== item.id).slice(0, 3);
          setRelated(others);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

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

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream-50 pt-32 text-center space-y-4">
          <span className="text-4xl">🏺</span>
          <h1 className="font-display font-bold text-brand-purple text-xl">Product Not Found</h1>
          <Link href="/products" className="btn-primary text-sm inline-flex min-h-[44px]">
            Back to Products
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const price = getProductPrice(product);
  const isPremium = product.tier === "premium";

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
            <span>Back to Spices Catalogue</span>
          </Link>
        </div>

        {/* Details Wrapper */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-3xl border border-cream-300 shadow-sm p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              
              {/* Left Column: Image wrapper */}
              <div className="flex flex-col items-center relative select-none">
                <div className="w-full max-w-[400px] aspect-square bg-brand-cream/30 border border-cream-300/60 rounded-2xl p-6 flex items-center justify-center shadow-xs">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full object-contain p-2"
                      loading="eager"
                    />
                  ) : (
                    <div className="photo-coming-soon w-full h-full rounded-t-xl flex flex-col items-center justify-center bg-cream-100">
                      <Camera size={36} className="text-cream-400 opacity-50 mb-1" />
                      <span className="font-body text-xs text-espresso-800 opacity-60">Photo Coming Soon</span>
                    </div>
                  )}
                  {isPremium && (
                    <span className="absolute top-4 left-4 badge-premium text-[0.6rem]">✦ PREMIUM TIER</span>
                  )}
                </div>
              </div>

              {/* Right Column: Information details */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <span className="font-body text-xs font-bold tracking-widest text-brand-orange uppercase">
                    {product.category}
                  </span>
                  <h1 className="font-display font-black text-brand-purple text-2xl sm:text-3xl lg:text-4xl mt-1.5 leading-tight">
                    {product.name}
                  </h1>
                  
                  {/* Rating display */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex text-gold-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={15} className="fill-current" />
                      ))}
                    </div>
                    <span className="font-body text-xs text-espresso-800 font-semibold">(5.0 Rating from customers)</span>
                  </div>
                </div>

                <div className="border-y border-cream-200 py-4 flex items-center justify-between">
                  <span className="font-body text-xs text-espresso-800/60 font-bold uppercase">Heritage Price</span>
                  <div className="text-right">
                    <span className="font-display font-black text-brand-purple text-2xl sm:text-3xl">
                      Rs. {price}
                    </span>
                    <span className="block font-body text-[0.65rem] text-espresso-800/50">Inclusive of all local GST taxes</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Description</h3>
                  <p className="font-body text-espresso-900 text-sm sm:text-base leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-3">
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Product Highlights</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-espresso-800">
                        <CheckCircle size={14} className="text-brand-orange shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => addToCart(product)}
                    className="btn-primary w-full justify-center text-sm font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 min-h-[48px] cursor-pointer"
                  >
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                  <a
                    href={product.whatsappMessage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp w-full justify-center text-sm font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 min-h-[48px]"
                  >
                    <MessageCircle size={16} /> Order on WhatsApp
                  </a>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className="bg-cream-100/50 py-16 border-t border-cream-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-display font-extrabold text-brand-purple text-xl sm:text-2xl mb-8 text-center sm:text-left">
                Related Spices & Blends
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((item) => {
                  const relPrice = getProductPrice(item);
                  return (
                    <div key={item.id} className="bg-white border border-cream-300 p-4 rounded-2xl flex flex-col justify-between card-hover shadow-xs">
                      <div>
                        <div className="aspect-square bg-brand-cream/20 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} className="max-h-full object-contain" />
                          ) : (
                            <Camera size={24} className="text-cream-400 opacity-40" />
                          )}
                        </div>
                        <h3 className="font-display font-bold text-brand-purple text-sm sm:text-base leading-snug mb-1">
                          {item.name}
                        </h3>
                        <p className="font-body text-[0.6rem] tracking-wider uppercase text-brand-orange font-bold mb-2">
                          {item.category}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-cream-200/50">
                        <span className="font-body text-xs font-bold text-brand-purple">Rs. {relPrice}</span>
                        <Link href={`/products/${item.id}`} className="font-body text-xs font-bold text-brand-orange hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  );
}
