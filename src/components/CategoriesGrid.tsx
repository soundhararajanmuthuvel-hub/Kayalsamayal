"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { products as localProducts, type Category } from "@/data/products";

const categoriesConfig = [
  {
    name: "Traditional Masalas" as Category,
    emoji: "🌶️",
    desc: "Aromatic slow-roasted traditional spice blends.",
  },
  {
    name: "Podi Products" as Category,
    emoji: "🏺",
    desc: "Authentic South Indian rice powders & mixes.",
  },
  {
    name: "Specialty Noodles" as Category,
    emoji: "🍜",
    desc: "Nutritious multi-grain & organic millet noodles.",
  },
  {
    name: "Health Mixes & Malts" as Category,
    emoji: "🌾",
    desc: "Power-packed Ayurvedic malts & grain drinks.",
  },
  {
    name: "PeruKalam Legiyam" as Category,
    emoji: "🍯",
    desc: "Traditional herbal jams & wellness remedies.",
  },
  {
    name: "Specialty Powders" as Category,
    emoji: "🌱",
    desc: "Pure single-ingredient culinary powders.",
  },
];

export default function CategoriesGrid() {
  const getCount = (catName: Category) => {
    return localProducts.filter((p) => p.category === catName).length;
  };

  const handleNavigate = (catName: Category) => {
    const slug = encodeURIComponent(catName.toLowerCase().replace(/\s+/g, "-"));
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#products-${slug}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      const el = document.getElementById("products");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="categories" className="relative bg-white py-16 sm:py-24 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="section-eyebrow mb-3">Spice Categories</p>
          <h2 className="section-title mb-4">
            Explore Our <span className="gold-shimmer font-semibold">Product Range</span>
          </h2>
          <div className="divider-spice mb-5" />
          <p className="font-body text-espresso-800 max-w-xl mx-auto text-base">
            Handcrafted South Indian varieties processed natively to retain original nutrition, colour, and taste.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categoriesConfig.map((cat, idx) => {
            const count = getCount(cat.name);
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => handleNavigate(cat.name)}
                className="group relative bg-cream-50 rounded-2xl p-6 border border-cream-300 shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-md"
              >
                {/* Left Slide Border Effect */}
                <span className="absolute left-0 top-0 bottom-0 w-0 bg-brand-orange transition-all duration-300 group-hover:w-1.5" />

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
                    Shop Category
                  </span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
