"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { brand, formatINR } from "@/lib/brand";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartSubtotal, cartCount } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === "WELCOME10") {
      setAppliedDiscount(Math.round(cartSubtotal * 0.1));
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try WELCOME10 for 10% off.");
      setAppliedDiscount(0);
    }
  };

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const grandTotal = cartSubtotal - appliedDiscount + shipping;
  const neededForFreeShipping = brand.freeShippingOver - cartSubtotal;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-10 sm:py-14 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold">
              Your Shopping Cart
            </h1>
            <p className="text-white/80 text-xs sm:text-sm">
              {cartCount > 0
                ? `You have ${cartCount} ${cartCount === 1 ? "item" : "items"} in your basket.`
                : "Your basket is currently empty."}
            </p>
          </div>
        </section>

        <div className="container-page pt-8 sm:pt-12">
          {cart.length === 0 ? (
            /* Empty State */
            <div className="max-w-md mx-auto text-center rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-accent flex items-center justify-center text-primary">
                <ShoppingBag className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="font-display font-bold text-xl text-primary">Your Cart is Empty</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Add authentic coastal spices, organic podis, or healthy noodle varieties to get started.
              </p>
              <div className="pt-2">
                <Link href="/products">
                  <Button variant="plum" size="touch" className="w-full font-bold">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Line Items */}
              <div className="lg:col-span-8 rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                
                {/* Free Shipping Notice Bar */}
                <div className="rounded-2xl bg-surface border border-border/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-secondary" />
                      {isFreeShipping
                        ? "🎉 Congratulations! You unlocked Free Shipping"
                        : `Add ₹${neededForFreeShipping} more for Free Shipping`}
                    </span>
                    <span>{isFreeShipping ? "FREE" : `₹${brand.shippingFlat}`}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (cartSubtotal / brand.freeShippingOver) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border/60">
                  {cart.map((item) => {
                    const price = getProductPrice(item.product);
                    const lineTotal = price * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                      >
                        {/* Product Image */}
                        <div className="h-20 w-20 shrink-0 rounded-2xl bg-surface border border-border/60 p-2 flex items-center justify-center overflow-hidden">
                          {item.product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🌶️</span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-secondary">
                            {item.product.category}
                          </span>
                          <h3 className="font-display font-bold text-foreground text-base leading-snug">
                            <Link href={`/products/${item.product.id}`} className="hover:text-secondary">
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Unit Price: {formatINR(price)}
                          </p>
                        </div>

                        {/* Quantity and Line Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(q) => updateQuantity(item.product.id, q)}
                            label={item.product.name}
                            size="sm"
                          />

                          <div className="text-right min-w-[70px]">
                            <span className="font-bold text-foreground text-base">
                              {formatINR(lineTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Order Summary & Coupon */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Summary Box */}
                <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-5">
                  <h2 className="font-display font-bold text-lg text-primary pb-3 border-b border-border">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-bold text-foreground">{formatINR(cartSubtotal)}</span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-leaf font-semibold">
                        <span>Discount (10%)</span>
                        <span>- {formatINR(appliedDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping Fee</span>
                      <span className="font-bold text-foreground">
                        {shipping === 0 ? "FREE" : formatINR(shipping)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <div>
                      <span className="font-display font-bold text-base text-primary block">
                        Grand Total
                      </span>
                      <span className="text-[0.7rem] text-muted-foreground">Inclusive of GST</span>
                    </div>
                    <span className="font-display font-extrabold text-2xl text-secondary">
                      {formatINR(grandTotal)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-2">
                    <Link href="/checkout" className="block w-full">
                      <Button variant="plum" size="touch" className="w-full gap-2 font-bold shadow-md">
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link href="/products" className="block w-full">
                      <Button variant="outline" size="touch" className="w-full font-bold">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[0.7rem] text-muted-foreground pt-1">
                    <ShieldCheck className="h-4 w-4 text-leaf" />
                    <span>Safe & Verified Manual UPI / COD Payment</span>
                  </div>
                </div>

                {/* Coupon Box */}
                <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-secondary" />
                    <span>Have a Coupon?</span>
                  </h3>

                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs uppercase font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                    <Button type="submit" variant="plum" size="sm" className="font-bold">
                      Apply
                    </Button>
                  </form>

                  {couponError && (
                    <p className="text-[0.7rem] font-semibold text-destructive">{couponError}</p>
                  )}
                  {appliedDiscount > 0 && (
                    <p className="text-[0.7rem] font-bold text-leaf flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> WELCOME10 applied successfully!
                    </p>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}
