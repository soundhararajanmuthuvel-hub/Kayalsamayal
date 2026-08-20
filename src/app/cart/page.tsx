"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartSubtotal, cartCount } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.toUpperCase() === "WELCOME10") {
      setAppliedDiscount(Math.round(cartSubtotal * 0.1));
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try WELCOME10.");
      setAppliedDiscount(0);
    }
  };

  const shipping = cartSubtotal >= 500 ? 0 : cartSubtotal > 0 ? 50 : 0;
  const grandTotal = cartSubtotal - appliedDiscount + shipping;

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* Banner */}
        <section className="bg-spice-gradient py-12 text-center text-cream-50 border-b border-gold-500/10">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight">
              Your Cart
            </h1>
            <div className="divider-spice mx-auto bg-gold-gradient" />
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {cart.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white border border-cream-300 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
              <span className="text-5xl">🛒</span>
              <h2 className="font-display font-bold text-brand-purple text-xl">Your cart is empty</h2>
              <p className="font-body text-espresso-800 text-sm">
                Add premium South Indian spices and health mixes to your cart to checkout.
              </p>
              <Link href="/products" className="btn-primary text-sm inline-flex min-h-[44px]">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Items List */}
              <div className="lg:col-span-8 bg-white border border-cream-300 rounded-3xl p-6 sm:p-8 space-y-6">
                <h2 className="font-display font-bold text-brand-purple text-lg border-b border-cream-200 pb-4">
                  Shopping Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                </h2>
                
                <div className="divide-y divide-cream-200">
                  {cart.map((item) => {
                    const price = getProductPrice(item.product);
                    const subtotal = price * item.quantity;
                    return (
                      <div key={item.product.id} className="py-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group">
                        
                        {/* Image */}
                        <div className="w-20 h-20 bg-brand-cream/35 border border-cream-300/60 rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0">
                          {item.product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image} alt={item.product.name} className="max-h-full object-contain" />
                          ) : (
                            <span className="text-xl">🌶️</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center sm:text-left space-y-1">
                          <span className="font-body text-[0.55rem] font-bold text-brand-orange uppercase tracking-wider">
                            {item.product.category}
                          </span>
                          <h3 className="font-display font-bold text-brand-purple text-base">
                            {item.product.name}
                          </h3>
                          <p className="font-body text-xs text-espresso-800">
                            Price: Rs. {price}
                          </p>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center border border-cream-300 rounded-lg overflow-hidden bg-cream-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-2 hover:bg-cream-200 text-brand-purple transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-body text-sm font-bold text-brand-purple px-3">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-2 hover:bg-cream-200 text-brand-purple transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Total Price & Delete button */}
                        <div className="flex items-center gap-4 shrink-0 justify-between w-full sm:w-auto">
                          <span className="font-display font-black text-brand-purple text-base sm:text-lg">
                            Rs. {subtotal}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-espresso-800 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
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
                <div className="bg-white border border-cream-300 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <h2 className="font-display font-bold text-brand-purple text-lg border-b border-cream-200 pb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-3.5 border-b border-cream-200 pb-4">
                    <div className="flex justify-between font-body text-sm text-espresso-900">
                      <span>Subtotal</span>
                      <span className="font-bold">Rs. {cartSubtotal}</span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between font-body text-sm text-green-700 font-semibold">
                        <span>Discount (10%)</span>
                        <span>- Rs. {appliedDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-body text-sm text-espresso-900">
                      <span>Estimated Shipping</span>
                      <span className="font-bold">
                        {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="font-body text-[0.65rem] text-brand-orange leading-snug">
                        💡 Add spices worth Rs. {500 - cartSubtotal} more to get Free Shipping!
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-brand-purple font-display">
                    <span className="text-base font-bold">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-black text-brand-orange">
                      Rs. {grandTotal}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <Link
                      href="/checkout"
                      className="btn-primary w-full justify-center text-sm font-bold py-3.5 px-6 rounded-xl flex items-center gap-1.5 min-h-[48px]"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/products"
                      className="btn-outline w-full justify-center text-sm font-bold py-3 px-6 rounded-xl border-2 border-brand-purple text-brand-purple hover:bg-brand-cream/20 text-center block"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-body text-espresso-800 opacity-60 justify-center">
                    <ShieldCheck size={14} className="text-green-600" />
                    <span>100% Manual Payment Verification</span>
                  </div>
                </div>

                {/* Coupon Form */}
                <div className="bg-white border border-cream-300 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="font-display font-bold text-brand-purple text-sm flex items-center gap-1.5">
                    <Tag size={16} className="text-brand-orange" />
                    <span>Apply Coupon</span>
                  </h3>
                  
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange uppercase"
                    />
                    <button
                      type="submit"
                      className="btn-primary text-xs font-bold px-4 py-2 rounded-xl min-h-[38px] cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  {couponError && (
                    <p className="font-body text-[0.7rem] text-red-500 font-semibold">{couponError}</p>
                  )}
                  {appliedDiscount > 0 && (
                    <p className="font-body text-[0.7rem] text-green-700 font-bold">WELCOME10 Coupon applied!</p>
                  )}
                </div>

              </div>

            </div>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
