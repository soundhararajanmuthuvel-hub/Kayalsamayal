"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { products as localProducts, categories, type Category } from "@/data/products";
import Link from "next/link";

const categoriesConfig = [
  {
    name: "Traditional Masalas" as Category,
    emoji: "🌶️",
    desc: "Aromatic slow-roasted traditional spice blends.",
    borderColor: "border-l-[#c86432]", // Terracotta
  },
  {
    name: "Podi Products" as Category,
    emoji: "🏺",
    desc: "Authentic South Indian rice powders & mixes.",
    borderColor: "border-l-[#8b3a1f]", // Deep Red
  },
  {
    name: "Specialty Noodles" as Category,
    emoji: "🍜",
    desc: "Nutritious multi-grain & organic millet noodles.",
    borderColor: "border-l-[#e8704a]", // Warm Orange
  },
  {
    name: "Health Mixes & Malts" as Category,
    emoji: "🌾",
    desc: "Power-packed Ayurvedic malts & grain drinks.",
    borderColor: "border-l-[#d4af37]", // Gold
  },
  {
    name: "PeruKalam Legiyam" as Category,
    emoji: "🍯",
    desc: "Traditional herbal jams & wellness remedies.",
    borderColor: "border-l-[#6b4423]", // Brown
  },
  {
    name: "Specialty Powders" as Category,
    emoji: "🌱",
    desc: "Pure single-ingredient culinary powders.",
    borderColor: "border-l-[#d4af37]", // Gold
  },
];

export default function CategoriesGrid() {
  const getCount = (catName: Category) => {
    return localProducts.filter((p) => p.category === catName).length;
  };

  return (
    <section id="categories" className="relative bg-white py-16 sm:py-24 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="section-eyebrow mb-3">Spice Categories</p>
          <h2 className="section-title mb-4">
            Shop by <span className="gold-shimmer font-semibold">Category</span>
          </h2>
          <div className="divider-spice mb-5" />
          <p className="font-body text-espresso-800 max-w-xl mx-auto text-base">
            Explore our authentic collections, handcrafted natively to retain original nutrition, colour, and taste.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categoriesConfig.map((cat, idx) => {
            const count = getCount(cat.name);
            const slug = encodeURIComponent(cat.name.toLowerCase().replace(/\s+/g, "-"));
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex"
              >
                <Link
                  href={`/category/${slug}`}
                  className={`group relative w-full bg-cream-50 rounded-2xl p-6 border-y border-r border-cream-300 border-l-4 ${cat.borderColor} shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.03]`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl filter drop-shadow-sm select-none">{cat.emoji}</span>
                      <span className="font-body text-[0.7rem] font-bold text-brand-orange bg-white border border-cream-300 px-2.5 py-0.5 rounded-full">
                        {count} {count === 1 ? "Item" : "Items"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-brand-purple text-lg sm:text-xl group-hover:text-brand-orange transition-colors">
                        {cat.name}
                      </h3>
                      <p className="font-body text-espresso-800 text-xs sm:text-sm leading-relaxed mt-1.5">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cream-300/60 flex items-center justify-between text-brand-purple group-hover:text-brand-orange transition-colors">
                    <span className="font-body text-xs font-bold uppercase tracking-wider">
                      Explore Category
                    </span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
