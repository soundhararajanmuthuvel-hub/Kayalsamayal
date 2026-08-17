"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Camera, CheckCircle, ChevronRight } from "lucide-react";
import { products, categories, type Category, type Product } from "@/data/products";

/* ── Photo Coming Soon placeholder ──────────────────────────────────── */
function PhotoPlaceholder({ name }: { name: string }) {
  return (
    <div className="photo-coming-soon w-full h-full rounded-t-xl">
      <Camera size={24} className="text-cream-400 opacity-50" />
      <span className="font-body text-xs text-espresso-800 opacity-60 text-center px-2 leading-tight">
        Photo Coming Soon
      </span>
    </div>
  );
}

/* ── Product Card ─────────────────────────────────────────────────────── */
function ProductCard({ product }: { product: Product }) {
  const isPremium = product.tier === "premium";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`card-hover relative bg-white rounded-xl shadow-md overflow-hidden border flex flex-col ${
        isPremium
          ? "border-gold-500/40 shadow-[0_4px_24px_rgba(212,136,6,0.12)]"
          : "border-cream-300"
      }`}
    >
      {/* Premium ribbon */}
      {isPremium && (
        <div className="ribbon text-[0.6rem] sm:text-[0.65rem]">
          ✦ PREMIUM
        </div>
      )}

      {/* Image — 1:1 square, full product visible */}
      <div className="aspect-square bg-cream-100 relative overflow-hidden rounded-t-xl">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <PhotoPlaceholder name={product.name} />
        )}

        {/* Tier badge overlay */}
        <div className="absolute bottom-2 left-2">
          <span className={isPremium ? "badge-premium" : "badge-regular"}>
            {isPremium ? "✦ Premium" : "Regular"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Category tag */}
        <p className="font-body text-[0.55rem] sm:text-[0.6rem] tracking-[0.12em] sm:tracking-[0.15em] uppercase text-gold-600 font-700 mb-1 leading-tight">
          {product.category}
        </p>

        <h3 className="font-display font-semibold text-espresso-900 text-sm sm:text-base leading-snug mb-1.5 sm:mb-2">
          {product.name}
        </h3>

        <p className="font-body text-espresso-800 text-xs leading-relaxed flex-1 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
          {product.description}
        </p>

        {/* Highlights — hidden on very small cards to save space */}
        <ul className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4 hidden sm:block">
          {product.highlights.map((h) => (
            <li key={h} className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-gold-600 shrink-0" />
              <span className="font-body text-espresso-800 text-[0.65rem] sm:text-[0.7rem]">{h}</span>
            </li>
          ))}
        </ul>

        {/* CTA — full width, min 44px tall */}
        <a
          id={`product-order-${product.id}`}
          href={product.whatsappMessage}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp w-full justify-center text-xs py-2.5 min-h-[44px] mt-auto"
        >
          <MessageCircle size={13} />
          Order on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}

/* ── Main Section ─────────────────────────────────────────────────────── */
export default function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const categoryCount = (cat: Category | "All") =>
    cat === "All"
      ? products.length
      : products.filter((p) => p.category === cat).length;

  return (
    <section id="products" className="relative texture-jute py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.p
            className="section-eyebrow mb-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Products
          </motion.p>
          <motion.h2
            className="section-title mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Five Ranges of{" "}
            <span className="gold-shimmer">Pure Tradition</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-5 sm:mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
          <motion.p
            className="font-body text-espresso-800 max-w-xl mx-auto text-base px-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Browse our complete range of masalas, podis, noodles, health mixes,
            and legiyams — available in Regular and Premium tiers.
          </motion.p>
        </div>

        {/* Category Filter Bar — horizontally scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8 sm:mb-10"
          role="tablist"
          aria-label="Product categories"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible scrollbar-none">
            {(["All", ...categories] as (Category | "All")[]).map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  flex-shrink-0 inline-flex items-center gap-1.5 font-body text-sm font-medium
                  px-4 py-2.5 rounded-full border min-h-[44px] whitespace-nowrap
                  transition-all duration-250
                  ${
                    activeCategory === cat
                      ? "bg-espresso-900 text-cream-100 border-espresso-900 shadow-md"
                      : "bg-white/80 text-espresso-800 border-cream-300 hover:border-gold-600 hover:text-gold-700"
                  }
                `}
              >
                {cat}
                <span
                  className={`text-[0.65rem] font-semibold rounded-full px-1.5 py-0.5 ${
                    activeCategory === cat
                      ? "bg-white/15 text-cream-200"
                      : "bg-cream-200 text-espresso-800"
                  }`}
                >
                  {categoryCount(cat)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid — 2 col on mobile, 3 col on md, 4 col on xl */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-espresso-800">
            <p className="font-display text-xl">No products found.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-10 sm:mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-body text-espresso-800 text-sm mb-4">
            Can&#39;t find what you&#39;re looking for? Talk to us directly.
          </p>
          <a
            id="products-whatsapp-enquiry-btn"
            href="https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I%20have%20a%20product%20enquiry."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp inline-flex min-h-[48px]"
          >
            <MessageCircle size={16} />
            WhatsApp Enquiry
            <ChevronRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
