"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "./PriceDisplay";
import { QuantitySelector } from "./QuantitySelector";
import { useCart, getProductPrice } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [pending, setPending] = useState(false);

  const cartItem = cart.find((item) => item.product.id === product.id);
  const inCart = cartItem ? cartItem.quantity : 0;
  const price = getProductPrice(product);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isPremium = product.tier === "premium";

  const handleAdd = () => {
    setPending(true);
    setTimeout(() => {
      addToCart(product, 1);
      setPending(false);
    }, 200);
  };

  const handleQuantityChange = (newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, newQty);
    }
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-lift)] hover:border-secondary/40",
        className,
      )}
    >
      {/* Product Image Box */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-surface"
        aria-label={`View details for ${product.name}`}
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={`${product.name} - Kayal Samayal`}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-surface p-4 text-center">
            <span className="text-4xl filter drop-shadow-sm">🌶️</span>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Kayal Samayal</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase text-primary-foreground shadow-sm">
              <Sparkles className="h-3 w-3 text-gold" />
              PREMIUM
            </span>
          )}
        </div>

        {/* Rating or stock */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[0.65rem] font-bold text-destructive-foreground shadow-sm">
              Out of stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[0.7rem] font-bold text-foreground shadow-xs border border-border/60">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span>4.9</span>
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-secondary">
          {product.category}
        </p>

        <h3 className="font-display text-[0.95rem] leading-snug font-bold text-foreground sm:text-base line-clamp-1">
          <Link
            href={`/products/${product.id}`}
            className="hover:text-secondary transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-xs text-muted-foreground sm:text-xs leading-relaxed min-h-[32px]">
          {product.description}
        </p>

        {/* Price and Cart Action */}
        <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
          <PriceDisplay price={price} mrp={product.mrp} size="sm" />

          {isOutOfStock ? (
            <Button variant="outline" size="touch" className="w-full text-xs opacity-60" disabled>
              Out of stock
            </Button>
          ) : inCart > 0 ? (
            <QuantitySelector
              value={inCart}
              onChange={handleQuantityChange}
              label={`${product.name} quantity`}
              size="sm"
              className="w-full justify-between"
            />
          ) : (
            <Button
              variant="plum"
              size="touch"
              className="w-full text-xs font-bold gap-2"
              onClick={handleAdd}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{pending ? "Adding…" : "Add to cart"}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted mt-4" />
      </div>
    </div>
  );
}
