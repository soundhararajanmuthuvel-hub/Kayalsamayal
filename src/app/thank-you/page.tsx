"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { CheckCircle2, ShoppingBag, Printer, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function ThankYouPage() {
  const { lastOrderResponse, customerDetails } = useCart();

  // Generate random order ID inside state initializer to keep render pure
  const [orderId] = useState(() => {
    return lastOrderResponse?.orderId || `KS-${Math.floor(100000 + Math.random() * 900000)}`;
  });
  const [orderDate] = useState(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });
  const grandTotal = lastOrderResponse?.grandTotal || 0;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        <section className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
          
          {/* Animated Success Badge */}
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-md">
              <CheckCircle2 size={48} className="animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-black text-brand-purple text-3xl sm:text-4xl">
              Order Received!
            </h1>
            <p className="font-body text-espresso-800 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Thank you for your order. We are validating your transaction reference to prepare your dispatch coordinates.
            </p>
          </div>

          {/* Details Summary Panel */}
          <div className="bg-white border border-cream-300 rounded-3xl p-6 sm:p-8 shadow-xs text-left space-y-6">
            <h2 className="font-display font-bold text-brand-purple text-lg border-b border-cream-200 pb-4">
              Order Coordinates
            </h2>

            <div className="grid grid-cols-2 gap-4 border-b border-cream-200 pb-6 text-sm">
              <div className="space-y-1">
                <p className="font-body text-xs text-espresso-800/60 font-bold uppercase">Order Reference</p>
                <p className="font-display font-bold text-brand-purple">{orderId}</p>
              </div>
              <div className="space-y-1">
                <p className="font-body text-xs text-espresso-800/60 font-bold uppercase">Order Date</p>
                <p className="font-display font-bold text-brand-purple">{orderDate}</p>
              </div>
              {grandTotal > 0 && (
                <div className="space-y-1">
                  <p className="font-body text-xs text-espresso-800/60 font-bold uppercase">Grand Total</p>
                  <p className="font-display font-bold text-brand-orange">Rs. {grandTotal}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="font-body text-xs text-espresso-800/60 font-bold uppercase">Payment Status</p>
                <p className="font-display font-bold text-green-600">Pending Verification</p>
              </div>
            </div>

            {/* Shipping Info read-only */}
            {customerDetails.name && (
              <div className="space-y-2">
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Shipping Destination</h3>
                <p className="font-body text-espresso-900 text-sm leading-relaxed">
                  <span className="font-bold text-brand-purple">{customerDetails.name}</span><br />
                  {customerDetails.address}, {customerDetails.city}, {customerDetails.state} – {customerDetails.pincode}<br />
                  Mobile: {customerDetails.mobile} | Email: {customerDetails.email}
                </p>
              </div>
            )}
          </div>

          {/* Next Steps messages */}
          <div className="bg-cream-100/50 border border-cream-300 p-6 rounded-2xl space-y-4 max-w-xl mx-auto text-xs sm:text-sm">
            <div className="flex items-start gap-3 text-left text-espresso-800">
              <MessageSquare size={18} className="text-brand-orange shrink-0 mt-0.5" />
              <p>
                We have registered your mobile number <span className="font-semibold text-brand-purple">{customerDetails.mobile || "provided"}</span> to receive instant shipment tracker updates via WhatsApp.
              </p>
            </div>
            <div className="flex items-start gap-3 text-left text-espresso-800">
              <Mail size={18} className="text-brand-orange shrink-0 mt-0.5" />
              <p>
                A copy of this invoice receipts summary details has been queued to compile and route to <span className="font-semibold text-brand-purple">{customerDetails.email || "your inbox"}</span>.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto pt-4">
            <Link
              href="/products"
              className="btn-primary w-full sm:w-auto text-sm font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <ShoppingBag size={15} />
              <span>Continue Shopping</span>
            </Link>
            <button
              onClick={handlePrint}
              className="btn-outline w-full sm:w-auto text-sm font-bold py-3 px-6 rounded-xl border-2 border-brand-purple text-brand-purple hover:bg-brand-cream/20 flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
          </div>

        </section>

      </main>
      <Footer />
    </>
  );
}
