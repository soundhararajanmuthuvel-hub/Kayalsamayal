"use client";

import { useCart, getProductPrice } from "@/context/CartContext";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { brand, formatINR } from "@/lib/brand";
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartCount,
  } = useCart();

  if (!isCartOpen) return null;

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const grandTotal = cartSubtotal + shipping;
  const neededForFreeShipping = brand.freeShippingOver - cartSubtotal;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Your shopping cart"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Box */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="relative w-screen max-w-md bg-card shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary" />
              <h2 className="font-display font-bold text-lg text-primary">
                Your Basket ({cartCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="px-6 py-3 bg-accent border-b border-border/60">
              <div className="flex items-center justify-between text-xs font-bold text-primary mb-1.5">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-secondary" />
                  {isFreeShipping
                    ? "Free Shipping Unlocked!"
                    : `Add ₹${neededForFreeShipping} for Free Shipping`}
                </span>
                <span>{isFreeShipping ? "FREE" : `₹${brand.shippingFlat}`}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (cartSubtotal / brand.freeShippingOver) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Items Viewport */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="h-14 w-14 rounded-full bg-surface flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="font-display font-bold text-lg text-primary">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground">
                  Browse our authentic coastal masalas, noodles, and health mixes.
                </p>
                <Button
                  variant="plum"
                  size="touch"
                  className="font-bold"
                  onClick={() => setIsCartOpen(false)}
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              cart.map((item) => {
                const price = getProductPrice(item.product);
                return (
                  <div key={item.product.id} className="py-4 flex gap-4 items-center">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-surface border border-border/60 p-1 flex items-center justify-center overflow-hidden">
                      {item.product.image ? (
                        <picture>
                          <source
                            srcSet={item.product.image.replace(/\.jpg$/, ".webp")}
                            type="image/webp"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        </picture>
                      ) : (
                        <span className="text-xl">🌶️</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-foreground text-sm leading-snug truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {formatINR(price)}
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.product.id, q)}
                          label={item.product.name}
                          size="sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Bottom Actions */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-border bg-surface space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">{formatINR(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-foreground">
                    {shipping === 0 ? "FREE" : formatINR(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-border/60">
                  <span>Total</span>
                  <span className="text-secondary font-extrabold text-base">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full"
                >
                  <Button variant="plum" size="touch" className="w-full gap-2 font-bold shadow-md">
                    <span>Checkout Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full font-bold">
                    View Full Cart Page
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1 text-[0.65rem] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-leaf" />
                <span>Manual UPI QR & COD Payment Supported</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
