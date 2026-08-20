"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle, Star, ArrowRight } from "lucide-react";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { useCart, getProductPrice } from "@/context/CartContext";

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        const pool = (data && data.length > 0) ? data : localProducts;
        // Filter premium products or get first 3 best sellers
        const items = pool.filter(p => p.tier === "premium" || (p.stock !== undefined && p.stock > 90)).slice(0, 3);
        setFeatured(items);
      } catch (err) {
        console.error(err);
        setFeatured(localProducts.slice(0, 3));
      }
    }
    loadData();
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="relative bg-cream-50 py-16 sm:py-24 border-b border-cream-300 overflow-hidden">
      {/* Decorative Jute Pattern Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gold-gradient opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="section-eyebrow mb-3">Chef Recommendation</p>
          <h2 className="section-title mb-4">
            From Our <span className="gold-shimmer font-semibold">Kitchen to Yours</span>
          </h2>
          <div className="divider-spice mb-5" />
          <p className="font-body text-espresso-800 max-w-xl mx-auto text-base">
            A handpicked selection of our most popular traditional blends, slow-roasted and ground to perfection.
          </p>
        </div>

        {/* Featured Grid — 3 Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((p, idx) => {
            const price = getProductPrice(p);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="bg-white rounded-2xl border-2 border-brand-cream-dark/60 shadow-xl overflow-hidden flex flex-col group relative hover:border-brand-orange/40 transition-all duration-300"
              >
                {/* Premium Label */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="badge-premium">✦ FEATURED</span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 z-10 bg-brand-purple text-white flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                  <Star size={12} className="text-gold-400 fill-gold-400" />
                  <span>5.0</span>
                </div>

                {/* Image Wrap */}
                <div className="aspect-video sm:aspect-square bg-brand-cream/40 relative overflow-hidden flex items-center justify-center p-6 border-b border-brand-cream-dark/30">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={`${p.name} - ${p.category}`}
                      className="max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-4xl">🏺</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="font-body text-[0.65rem] tracking-wider uppercase text-brand-orange font-bold mb-1.5">
                    {p.category}
                  </p>
                  <h3 className="font-display font-bold text-brand-purple text-lg sm:text-xl mb-2 group-hover:text-brand-orange transition-colors">
                    {p.name}
                  </h3>
                  <p className="font-body text-espresso-800 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                    {p.description}
                  </p>

                  <div className="border-t border-brand-cream-dark/40 pt-4 flex items-center justify-between mb-4">
                    <span className="font-body text-xs text-espresso-800/60 font-semibold uppercase">Pricing</span>
                    <span className="font-display font-extrabold text-brand-purple text-lg">Rs. {price}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(p)}
                      className="btn-primary w-full justify-center text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-sm min-h-[44px] cursor-pointer"
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                    <a
                      href={p.whatsappMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp w-full justify-center text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-sm min-h-[44px]"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View all products link */}
        <div className="text-center mt-12">
          <a
            href="#products"
            className="inline-flex items-center gap-1.5 font-body text-brand-purple hover:text-brand-orange font-bold text-sm transition-colors group cursor-pointer"
          >
            <span>View All Traditional Varieties</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
