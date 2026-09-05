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

function slugifyCategory(cat: string) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function CategoryClient({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const canonicalSlug = resolvedParams.name.toLowerCase();
  const matched = categories.find((c) => slugifyCategory(c) === canonicalSlug);
  const initialCat = matched || decodeURIComponent(resolvedParams.name).replace(/-/g, " ");
  const initialItems = localProducts.filter(
    (p) => p.category.toLowerCase() === initialCat.toLowerCase()
  );

  const categoryName = initialCat;
  const [products, setProducts] = useState<Product[]>(initialItems);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          const items = data.filter(
            (p) => p.category.toLowerCase() === initialCat.toLowerCase()
          );
          setProducts(items);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [initialCat]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              KAYAL SAMAYAL CATEGORY ARCHIVE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold capitalize">
              Kayal Samayal {categoryName || "Traditional Range"}
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
            loading={false}
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
