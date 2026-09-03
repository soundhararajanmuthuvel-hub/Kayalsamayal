"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice, useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/shop/ProductCard";
import { PriceDisplay } from "@/components/shop/PriceDisplay";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { whatsappLink, brand } from "@/lib/brand";
import {
  ShoppingBag,
  MessageCircle,
  Star,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        const pool = data && data.length > 0 ? data : localProducts;
        const item = pool.find((p) => p.id === resolvedParams.id);
        if (item) {
          setProduct(item);
          const others = pool
            .filter((p) => p.category === item.category && p.id !== item.id)
            .slice(0, 4);
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
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 space-y-4">
          <span className="text-5xl">🏺</span>
          <h1 className="font-display font-bold text-2xl text-primary">Product Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            We couldn&apos;t find this product in our catalogue. It may have been renamed or moved.
          </p>
          <Link href="/products">
            <Button variant="plum" size="touch">
              Browse All Products
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const price = getProductPrice(product);
  const hasStock = product.stock !== undefined;
  const isOutOfStock = hasStock && (product.stock ?? 0) <= 0;
  const isLowStock = hasStock && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
  const isPremium = product.tier === "premium";

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  const waOrderUrl = whatsappLink(
    `Hi Kayal Samayal! I would like to order "${product.name}" (${quantity} unit${quantity > 1 ? "s" : ""}).`
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Breadcrumb Navigation */}
        <div className="container-page pt-6 pb-4">
          <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
            <span>/</span>
            <span className="text-secondary truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>

        {/* Product Details Section */}
        <section className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-card rounded-3xl border border-border/80 p-6 sm:p-10 shadow-[var(--shadow-card)]">
            
            {/* Left: Product Image Box */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative aspect-square w-full max-w-[460px] overflow-hidden rounded-2xl bg-surface border border-border/60 flex items-center justify-center p-8 shadow-xs">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain filter drop-shadow-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <span className="text-6xl filter drop-shadow-md">🌶️</span>
                    <span className="mt-3 text-sm font-bold text-muted-foreground">Kayal Samayal</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
                      Out of stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center rounded-full bg-amber-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      Low Stock: Only {product.stock} pcs left
                    </span>
                  ) : isPremium ? (
                    <span className="badge-premium">✦ PREMIUM BLEND</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-leaf/90 text-white px-2.5 py-0.5 text-[0.65rem] font-bold shadow-xs">
                    100% Pure
                  </span>
                </div>
              </div>

              {/* Trust Badges below image */}
              <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-[460px] text-center">
                <div className="rounded-xl bg-surface p-3 border border-border/60">
                  <ShieldCheck className="mx-auto h-5 w-5 text-leaf mb-1" />
                  <p className="text-[0.65rem] font-bold text-foreground">FSSAI Certified</p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border/60">
                  <Truck className="mx-auto h-5 w-5 text-secondary mb-1" />
                  <p className="text-[0.65rem] font-bold text-foreground">Fresh Batch</p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border/60">
                  <Sparkles className="mx-auto h-5 w-5 text-gold mb-1" />
                  <p className="text-[0.65rem] font-bold text-foreground">No Chemicals</p>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Purchase Actions */}
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Category & Rating */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    <span>4.9 / 5.0 (Customer Reviews)</span>
                  </div>
                </div>

                {/* Product Name */}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary leading-tight">
                  {product.name}
                </h1>

                {/* Pricing Display */}
                <div className="py-2 border-y border-border/60">
                  <PriceDisplay price={price} mrp={product.mrp} size="lg" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Inclusive of all taxes. Free shipping on orders above ₹{brand.freeShippingOver}.
                  </p>
                </div>

                {/* Description */}
                <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-2">
                  <p>{product.description}</p>
                </div>

                {/* Highlights */}
                {product.highlights && product.highlights.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Highlights & Purity
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.highlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90">
                          <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Actions Block */}
              <div className="space-y-4 pt-6 border-t border-border/60">
                {/* Quantity Control */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quantity:
                  </span>
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={99}
                    size="md"
                    label={`${product.name} count`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="plum"
                    size="touch"
                    className="w-full gap-2 font-bold shadow-md"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="touch"
                    className="w-full gap-2 font-bold shadow-md"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                  >
                    <Zap className="h-4 w-4" />
                    <span>Buy Now</span>
                  </Button>
                </div>

                {/* WhatsApp Quick Order */}
                <a
                  href={waOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button
                    variant="whatsapp"
                    size="touch"
                    className="w-full gap-2 font-bold shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Order directly via WhatsApp</span>
                  </Button>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className="container-page pt-16 sm:pt-20">
            <div className="mb-8 space-y-1">
              <span className="section-eyebrow">Pair With</span>
              <h2 className="font-display text-2xl font-bold text-primary">
                You May Also Like
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
}
