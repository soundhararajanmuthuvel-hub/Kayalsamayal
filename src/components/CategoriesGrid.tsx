"use client";

import { motion } from "framer-motion";
import { products as localProducts } from "@/data/products";
import { CategoryCard } from "@/components/shop/CategoryCard";

const categoryList = [
  {
    name: "Traditional Masalas",
    slug: "traditional-masalas",
    tagline: "Stone-ground everyday and coastal curry blends",
    image: "/assets/fish-curry-masala.jpg",
    emoji: "🌶️",
  },
  {
    name: "Podi Products",
    slug: "podi-products",
    tagline: "For idli, dosa and piping hot rice with ghee",
    image: "/assets/andhra-paruppu-sadham-podi.jpg",
    emoji: "🏺",
  },
  {
    name: "Specialty Noodles",
    slug: "specialty-noodles",
    tagline: "Millet & moringa noodles for healthy quick meals",
    image: "/assets/moringa-noodles.jpg",
    emoji: "🍜",
  },
  {
    name: "Health Mixes & Malts",
    slug: "health-mixes-malts",
    tagline: "Sathu maavu, ABC malt & herbal nutritional drinks",
    image: "/assets/abc-malt.jpg",
    emoji: "🌾",
  },
  {
    name: "PeruKalam Legiyam",
    slug: "perukalam-legiyam",
    tagline: "Time-honoured postpartum & digestion remedies",
    image: "/assets/kindiya-kaayam.jpg",
    emoji: "🍯",
  },
  {
    name: "Specialty Powders",
    slug: "specialty-powders",
    tagline: "Nannari sukku & herbal teas for daily wellness",
    image: "/assets/nannari-sukku-powder.jpg",
    emoji: "🌱",
  },
];

export default function CategoriesGrid() {
  const getCount = (catName: string) => {
    return localProducts.filter(
      (p) => p.category.toLowerCase().includes(catName.toLowerCase().split(" ")[0])
    ).length;
  };

  return (
    <section id="categories" className="py-16 sm:py-20 bg-surface border-b border-border/60">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
          <p className="section-eyebrow">Explore Our Kitchen</p>
          <h2 className="section-title">
            Shop by <span className="text-secondary font-display italic">Category</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed pt-1">
            Carefully curated, unadulterated South Indian staples made the traditional way without industrial preservatives.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categoryList.map((cat, idx) => {
            const count = getCount(cat.name);
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <CategoryCard
                  name={cat.name}
                  slug={cat.slug}
                  tagline={cat.tagline}
                  image={cat.image}
                  emoji={cat.emoji}
                  count={count > 0 ? count : undefined}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
