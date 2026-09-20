"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getCategoryCardList } from "@/lib/categories";
import { CategoryCard } from "@/components/shop/CategoryCard";

export default function CategoriesGrid() {
  const [products, setProducts] = useState<Product[]>(localProducts);

  useEffect(() => {
    async function loadData() {
      try {
        const live = await getProducts();
        if (live && live.length > 0) {
          setProducts(live);
        }
      } catch {
        // Keeps local fallback
      }
    }
    loadData();
  }, []);

  const categoryCards = getCategoryCardList(products);

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
          {categoryCards.map((cat, idx) => (
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
                count={cat.count > 0 ? cat.count : undefined}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

