"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { brand, formatINR, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Printer, MessageCircle, Truck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { getOrder } from "@/lib/api";

function ThankYouContent() {
  const { lastOrderResponse, customerDetails } = useCart();
  const searchParams = useSearchParams();

  const urlOrderId = searchParams.get("orderId");
  const [orderId] = useState(() => {
    return urlOrderId || lastOrderResponse?.orderId || `KS-${Math.floor(100000 + Math.random() * 900000)}`;
  });

  const [orderDate] = useState(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [remoteOrder, setRemoteOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId && !lastOrderResponse) {
      getOrder(orderId)
        .then((res) => {
          if (res.success && res.data) {
            setRemoteOrder(res.data);
          }
        })
        .catch((e) => console.warn("Failed to fetch order details on reload", e));
    }
  }, [orderId, lastOrderResponse]);

  const grandTotal =
    lastOrderResponse?.grandTotal ??
    (remoteOrder?.order?.["Grand Total"] !== undefined ? Number(remoteOrder.order["Grand Total"]) : 0);

  const discount =
    lastOrderResponse?.discount ??
    (remoteOrder?.order?.["Discount"] !== undefined ? Number(remoteOrder.order["Discount"]) : 0);

  const paymentMethod =
    lastOrderResponse?.paymentMethod ||
    remoteOrder?.order?.["Payment Method"] ||
    "Razorpay Online";

  const paymentStatus =
    lastOrderResponse?.paymentStatus ||
    remoteOrder?.order?.["Payment Status"] ||
    "Paid";

  const customerName =
    customerDetails.name ||
    remoteOrder?.order?.["Full Name"] ||
    remoteOrder?.customer?.[0]?.["Full Name"] ||
    "";

  const shippingAddress =
    customerDetails.address ||
    remoteOrder?.order?.["Shipping Address"] ||
    "";

  const city =
    customerDetails.city ||
    remoteOrder?.order?.["City/Town"] ||
    "";

  const state =
    customerDetails.state ||
    remoteOrder?.order?.["State"] ||
    "Tamil Nadu";

  const pincode =
    customerDetails.pincode ||
    remoteOrder?.order?.["Pincode"] ||
    "";

  const mobile =
    customerDetails.mobile ||
    remoteOrder?.order?.["Mobile"] ||
    "";

  const email =
    customerDetails.email ||
    remoteOrder?.order?.["Email"] ||
    "";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-leaf/20 border border-leaf/40 flex items-center justify-center text-leaf">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold">
              Order Confirmed!
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-md mx-auto">
              Thank you for shopping with Kayal Samayal. We are preparing your fresh batch.
            </p>
          </div>
        </section>

        <div className="container-page pt-10 sm:pt-14 max-w-3xl mx-auto">
          
          {/* Order Details Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Reference</span>
                <p className="font-mono font-bold text-lg text-primary">{orderId}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Date</span>
                <p className="font-semibold text-sm text-foreground">{orderDate}</p>
              </div>
            </div>

            {/* Total and Payment Status */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-surface border border-border/60">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Amount</span>
                <p className="font-display font-black text-xl text-secondary">
                  {grandTotal > 0 ? formatINR(grandTotal) : "FREE (₹0)"}
                </p>
                {discount > 0 ? (
                  <span className="text-[0.7rem] font-bold text-leaf block">
                    Saved {formatINR(discount)} with promo
                  </span>
                ) : null}
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Payment Status</span>
                {paymentMethod === "Free Order (Coupon)" || grandTotal === 0 ? (
                  <p className="font-bold text-xs sm:text-sm text-leaf flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4" /> 100% Promo (No Payment Needed)
                  </p>
                ) : paymentMethod === "Cash on Delivery" || paymentMethod === "COD" ? (
                  <p className="font-bold text-xs sm:text-sm text-amber-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4" /> Pending (Pay on Delivery)
                  </p>
                ) : (
                  <p className="font-bold text-xs sm:text-sm text-leaf flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4" /> {paymentStatus === "Paid" ? "Paid via Razorpay" : paymentStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            {customerName && (
              <div className="space-y-1 text-xs sm:text-sm text-muted-foreground pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Delivery To:</span>
                <p className="font-bold text-foreground">{customerName}</p>
                {shippingAddress && (
                  <p>{shippingAddress}{city ? `, ${city}` : ""}{state ? `, ${state}` : ""}{pincode ? ` – ${pincode}` : ""}</p>
                )}
                {mobile && (
                  <p>Phone: {mobile} {email ? `• ${email}` : ""}</p>
                )}
              </div>
            )}

            {/* Next Steps Notification */}
            <div className="rounded-2xl bg-accent p-4 text-xs text-primary flex items-start gap-3">
              <Truck className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                You will receive shipping and dispatch tracking updates directly on WhatsApp ({mobile || brand.phone}).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href={whatsappLink(`Hello Kayal Samayal! I placed order #${orderId}. Please confirm packing status.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="whatsapp" size="touch" className="w-full gap-2 font-bold shadow-md">
                  <MessageCircle className="h-4 w-4" />
                  <span>Track on WhatsApp</span>
                </Button>
              </a>

              <Button
                variant="outline"
                size="touch"
                onClick={handlePrint}
                className="flex-1 gap-2 font-bold"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </Button>

              <Link href="/products" className="flex-1">
                <Button variant="plum" size="touch" className="w-full gap-2 font-bold shadow-md">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Continue Shopping</span>
                </Button>
              </Link>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading order confirmation...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
