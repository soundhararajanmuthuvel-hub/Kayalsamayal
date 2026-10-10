"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, Sparkles } from "lucide-react";
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
  const hasStock = product.stock !== undefined;
  const isOutOfStock = hasStock && (product.stock ?? 0) <= 0;
  const isLowStock = hasStock && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
  const isPremium = product.tier === "premium";

  const handleAdd = () => {
    setPending(true);
    setTimeout(() => {
      addToCart(product, 1);
      setPending(false);
    }, 180);
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
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#174D35]/50",
        className,
      )}
    >
      {/* Product Image Box */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-[#F4F1E9]"
        aria-label={`View details for ${product.name}`}
      >
        {product.image ? (
          <picture>
            <source
              srcSet={product.image.replace(/\.jpg$/, ".webp")}
              type="image/webp"
            />
            <img
              src={product.image}
              alt={`${product.name} - Kayal Samayal`}
              width={450}
              height={450}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          </picture>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#F4F1E9] p-4 text-center">
            <span className="text-4xl filter drop-shadow-sm">🌶️</span>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Kayal Samayal</span>
          </div>
        )}

        {/* Badges Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center rounded-full bg-destructive px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-xs">
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center rounded-full bg-amber-700 text-white px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase shadow-xs">
              Low Stock: {product.stock} left
            </span>
          ) : isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0D2F22] px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase text-[#F8F4E9] border border-[#B88A3B]/40 shadow-xs">
              <Sparkles className="h-3 w-3 text-[#B88A3B]" />
              PREMIUM
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[0.6rem] font-bold tracking-wider uppercase text-[#174D35] border border-border shadow-xs">
              EXPLORE
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4 bg-white">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#B88A3B]">
          {product.category}
        </p>

        <h3 className="font-display text-[0.95rem] leading-snug font-bold text-[#332820] sm:text-base line-clamp-1">
          <Link
            href={`/products/${product.id}`}
            className="hover:text-[#174D35] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-xs text-[#6B5E54] leading-relaxed min-h-[32px]">
          {product.description}
        </p>

        {/* Price and Cart Action */}
        <div className="mt-auto space-y-3 pt-3 border-t border-border/60">
          <PriceDisplay price={price} mrp={product.mrp} size="sm" />

          {isOutOfStock ? (
            <Button variant="outline" size="touch" className="w-full text-xs opacity-60 rounded-xl" disabled>
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
              variant="forest"
              size="touch"
              className="w-full text-xs font-bold gap-2 rounded-xl"
              onClick={handleAdd}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{pending ? "Adding…" : "Add to Cart"}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
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
