"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, categories, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const [categoryName, setCategoryName] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const decoded = decodeURIComponent(resolvedParams.name).replace(/-/g, " ");
        // Match against known categories
        const matched = categories.find(
          (c) => c.toLowerCase() === decoded.toLowerCase() || c.toLowerCase().includes(decoded.toLowerCase().split(" ")[0])
        );

        const currentCat = matched || decoded;
        setCategoryName(currentCat);

        const data = await getProducts();
        const pool = data && data.length > 0 ? data : localProducts;
        const items = pool.filter(
          (p) => p.category.toLowerCase().includes(decoded.toLowerCase().split(" ")[0])
        );
        setProducts(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.name]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              CATEGORY ARCHIVE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold capitalize">
              {categoryName || "Traditional Range"}
            </h1>
            <div className="divider-spice" />
            <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto">
              Authentic South Indian varieties crafted with pure spices, traditional stone grinding, and zero preservatives.
            </p>
          </div>
        </section>

        <div className="container-page pt-6 sm:pt-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between pb-6">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-secondary hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to All Products</span>
            </Link>
            <span className="text-xs text-muted-foreground">
              {products.length} {products.length === 1 ? "Product" : "Products"}
            </span>
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle={`No items in ${categoryName}`}
            emptyMessage="We are currently crafting fresh batches for this category. Please check out our other offerings!"
            action={
              <Link href="/products">
                <Button variant="plum" size="sm">
                  View Full Catalogue
                </Button>
              </Link>
            }
          />
        </div>

      </main>
      <Footer />
    </div>
  );
}
