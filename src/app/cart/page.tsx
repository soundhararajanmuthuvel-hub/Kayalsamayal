"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { brand, formatINR } from "@/lib/brand";
import { CouponSection } from "@/components/coupon";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const {
    cart, updateQuantity, removeFromCart, cartSubtotal, cartCount,
    cartNotice, clearCartNotice,
    appliedCoupon, clearAppliedCoupon,
  } = useCart();

  const [couponDropNotice, setCouponDropNotice] = useState<string>("");

  // Subtotal drops below the minimum required for applied coupon
  useEffect(() => {
    if (!appliedCoupon || !appliedCoupon.minOrder) return;
    if (cartSubtotal > 0 && cartSubtotal < appliedCoupon.minOrder) {
      const code = appliedCoupon.code;
      const min = appliedCoupon.minOrder;
      const timer = setTimeout(() => {
        clearAppliedCoupon();
        setCouponDropNotice(
          `Cart total dropped below ₹${min} minimum required for ${code}. The coupon was automatically removed.`
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [cartSubtotal, appliedCoupon, clearAppliedCoupon]);

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const appliedDiscountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = Math.max(0, cartSubtotal - appliedDiscountAmount + shipping);
  const neededForFreeShipping = brand.freeShippingOver - cartSubtotal;

  /** Dynamic discount label */
  const discountLabel = (() => {
    if (!appliedCoupon) return "Discount";
    if (appliedCoupon.discountType === "percentage") {
      return `Discount (${appliedCoupon.discountValue}%)`;
    }
    if (appliedCoupon.discountValue) {
      return `Discount (${formatINR(appliedCoupon.discountValue)})`;
    }
    return `Discount (${appliedCoupon.code})`;
  })();

  const checkoutHref = appliedCoupon
    ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
    : "/checkout";

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4E9]">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-[#0D2F22] py-10 sm:py-14 text-[#F8F4E9] border-b border-[#B88A3B]/30">
          <div className="container-page text-center space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              Your Shopping Cart
            </h1>
            <p className="text-[#F8F4E9]/85 text-xs sm:text-sm">
              {cartCount > 0
                ? `You have ${cartCount} ${cartCount === 1 ? "item" : "items"} in your basket.`
                : "Your basket is currently empty."}
            </p>
          </div>
        </section>

        <div className="container-page pt-8 sm:pt-12">
          {cartNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
                <span>{cartNotice}</span>
              </div>
              <button
                type="button"
                onClick={clearCartNotice}
                className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {couponDropNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
                <span>{couponDropNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCouponDropNotice("")}
                className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {cart.length === 0 ? (
            /* Empty State */
            <div className="max-w-md mx-auto text-center rounded-3xl border border-border bg-white p-8 sm:p-12 shadow-sm space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-[#F8F4E9] flex items-center justify-center text-[#174D35]">
                <ShoppingBag className="h-8 w-8 text-[#174D35]" />
              </div>
              <h2 className="font-display font-bold text-xl text-[#332820]">Your Cart is Empty</h2>
              <p className="text-xs sm:text-sm text-[#6B5E54]">
                Add authentic coastal spices, traditional podis, or healthy noodle varieties to get started.
              </p>
              <div className="pt-2">
                <Link href="/products">
                  <Button variant="forest" size="touch" className="w-full font-bold rounded-xl">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Line Items */}
              <div className="lg:col-span-8 rounded-3xl border border-border bg-white p-5 sm:p-8 shadow-sm space-y-6">
                
                {/* Free Shipping Notice Bar */}
                <div className="rounded-2xl bg-[#F8F4E9] border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#332820]">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-[#174D35]" />
                      {isFreeShipping
                        ? "🎉 Congratulations! You unlocked Free Shipping"
                        : `Add ₹${neededForFreeShipping} more for Free Shipping`}
                    </span>
                    <span className="text-[#174D35]">{isFreeShipping ? "FREE" : `₹${brand.shippingFlat}`}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-[#174D35] transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (cartSubtotal / brand.freeShippingOver) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border">
                  {cart.map((item) => {
                    const price = getProductPrice(item.product);
                    const lineTotal = price * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                      >
                        {/* Product Image */}
                        <div className="h-20 w-20 shrink-0 rounded-2xl bg-[#F4F1E9] border border-border p-2 flex items-center justify-center overflow-hidden">
                          {item.product.image ? (
                            <picture>
                              <source
                                srcSet={item.product.image.replace(/\.jpg$/, ".webp")}
                                type="image/webp"
                              />
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                width={80}
                                height={80}
                                loading="lazy"
                                className="h-full w-full object-contain"
                              />
                            </picture>
                          ) : (
                            <span className="text-2xl">🌶️</span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#B88A3B]">
                            {item.product.category}
                          </span>
                          <h3 className="font-display font-bold text-[#332820] text-base leading-snug">
                            <Link href={`/products/${item.product.id}`} className="hover:text-[#174D35]">
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-xs text-[#6B5E54] font-semibold">
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
                            <span className="font-bold text-[#174D35] text-base">
                              {formatINR(lineTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center cursor-pointer"
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
                <div className="rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-sm space-y-5">
                  <h2 className="font-display font-bold text-lg text-[#332820] pb-3 border-b border-border">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between text-[#6B5E54]">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#332820]">{formatINR(cartSubtotal)}</span>
                    </div>

                    {appliedCoupon && appliedDiscountAmount > 0 && (
                      <div className="flex justify-between text-[#174D35] font-semibold items-center">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          <span>{discountLabel}</span>
                        </span>
                        <span>- {formatINR(appliedDiscountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6B5E54]">
                      <span>Shipping Fee</span>
                      <span className="font-bold text-[#332820]">
                        {shipping === 0 ? "FREE" : formatINR(shipping)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <div>
                      <span className="font-display font-bold text-base text-[#332820] block">
                        Grand Total
                      </span>
                      <span className="text-[0.7rem] text-[#6B5E54]">Inclusive of GST</span>
                    </div>
                    <span className="font-display font-extrabold text-2xl text-[#174D35]">
                      {formatINR(grandTotal)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => router.push(checkoutHref)}
                      className="block w-full"
                    >
                      <Button variant="forest" size="touch" className="w-full gap-2 font-bold shadow-md rounded-xl">
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </button>

                    <Link href="/products" className="block w-full">
                      <Button variant="outline" size="touch" className="w-full font-bold rounded-xl bg-white">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[0.7rem] text-[#6B5E54] pt-1">
                    <ShieldCheck className="h-4 w-4 text-[#174D35]" />
                    <span>100% Secure Razorpay Online Payment &amp; COD</span>
                  </div>
                </div>

                {/* Coupon Box */}
                <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-xs">
                  <CouponSection variant="cart" />
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
