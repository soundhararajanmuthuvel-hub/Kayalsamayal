"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { brand, formatINR, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ShoppingBag,
  Printer,
  MessageCircle,
  Truck,
  Mail,
  Tag,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity?: number;
  qty?: number;
  price?: number;
}

interface OrderRecord {
  orderId?: string;
  id?: string;
  grandTotal?: number;
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items?: OrderItem[];
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { lastOrderResponse, customerDetails } = useCart();

  const urlOrderId = searchParams.get("orderId") || "";
  const orderId = urlOrderId || lastOrderResponse?.orderId || "";

  const [order, setOrder] = useState<OrderRecord | null>(() => {
    if (lastOrderResponse) {
      return {
        orderId: lastOrderResponse.orderId,
        id: lastOrderResponse.orderId,
        grandTotal: lastOrderResponse.grandTotal,
        subtotal: lastOrderResponse.subtotal,
        discount: lastOrderResponse.discount,
        paymentMethod: lastOrderResponse.paymentMethod,
        paymentStatus: lastOrderResponse.paymentStatus,
        name: customerDetails.name,
        email: customerDetails.email,
        mobile: customerDetails.mobile,
        address: customerDetails.address,
        city: customerDetails.city,
        state: customerDetails.state,
        pincode: customerDetails.pincode,
        items: lastOrderResponse.items?.map((it) => ({
          name: typeof it === "string" ? it : (it as { name?: string }).name || "Authentic Spice Item",
          qty: (it as { quantity?: number; qty?: number }).quantity || (it as { quantity?: number; qty?: number }).qty || 1,
          price: (it as { price?: number }).price || 0,
        })),
      };
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!order && !!orderId);
  const [error, setError] = useState<string | null>(() => (!orderId && !lastOrderResponse ? "No Order ID provided." : null));

  const [orderDate] = useState(() =>
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let isMounted = true;

    async function fetchOrderDetails() {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (!res.ok) {
          throw new Error(`Order not found (${res.status})`);
        }
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          const rawOrder = json.data.order || json.data;
          const rawItems = json.data.items || [];
          setOrder((prev) => ({
            ...prev,
            orderId: rawOrder["Order ID"] || rawOrder.orderId || orderId,
            id: rawOrder["Order ID"] || rawOrder.orderId || orderId,
            grandTotal: Number(rawOrder["Grand Total"] || rawOrder.grandTotal || prev?.grandTotal || 0),
            discount: Number(rawOrder["Discount"] || rawOrder.discount || prev?.discount || 0),
            couponCode: rawOrder["Coupon Code"] || rawOrder.couponCode || prev?.couponCode || "",
            paymentMethod: rawOrder["Payment Method"] || rawOrder.paymentMethod || prev?.paymentMethod || "Razorpay Online",
            paymentStatus: rawOrder["Payment Status"] || rawOrder.paymentStatus || "Paid",
            name: rawOrder["Full Name"] || rawOrder.name || prev?.name || customerDetails.name,
            email: rawOrder["Email"] || rawOrder.email || prev?.email || customerDetails.email,
            mobile: rawOrder["Mobile"] || rawOrder.mobile || prev?.mobile || customerDetails.mobile,
            address: rawOrder["Shipping Address"] || rawOrder.address || prev?.address || customerDetails.address,
            city: rawOrder["City/Town"] || rawOrder.city || prev?.city || customerDetails.city,
            state: rawOrder["State"] || rawOrder.state || prev?.state || customerDetails.state || "Tamil Nadu",
            pincode: rawOrder["Pincode"] || rawOrder.pincode || prev?.pincode || customerDetails.pincode,
            items: Array.isArray(rawItems) && rawItems.length > 0
              ? rawItems.map((ri: Record<string, unknown>) => ({
                  name: String(ri["Product Name"] || ri.name || "Authentic Spice Blend"),
                  qty: Number(ri["Quantity"] || ri.quantity || ri.qty || 1),
                  price: Number(ri["Unit Price"] || ri.price || 0),
                }))
              : prev?.items || [],
          }));
          setError(null);
        }
      } catch (err: unknown) {
        console.warn("Order fetch note:", err);
        // Fallback to local session data if available
        if (!order && !lastOrderResponse) {
          setError("Could not load remote order details, but your payment was received.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId, lastOrderResponse, order, customerDetails]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const displayOrderId = order?.orderId || order?.id || orderId || "KS-CONFIRMED";
  const displayTotal = order?.grandTotal ?? (lastOrderResponse?.grandTotal || 0);
  const displayDiscount = order?.discount ?? (lastOrderResponse?.discount || 0);
  const displayEmail = order?.email || customerDetails.email || "";
  const displayMobile = order?.mobile || customerDetails.mobile || "";
  const displayCustomerName = order?.name || customerDetails.name || "Valued Customer";
  const displayAddress = order?.address || customerDetails.address || "";
  const displayCity = order?.city || customerDetails.city || "";
  const displayState = order?.state || customerDetails.state || "Tamil Nadu";
  const displayPincode = order?.pincode || customerDetails.pincode || "";
  const displayPaymentMethod = order?.paymentMethod || lastOrderResponse?.paymentMethod || "Razorpay Online";
  const displayPaymentStatus = order?.paymentStatus || lastOrderResponse?.paymentStatus || "Paid";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-secondary mx-auto" />
            <p className="font-display font-bold text-lg text-primary">Loading order confirmation...</p>
            <p className="text-xs text-muted-foreground">Retrieving verified order details from secure database</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !order && !lastOrderResponse) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center space-y-5 shadow-lg">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-xl text-primary">Order Lookup</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" size="touch" className="w-full font-bold gap-2">
                  <Home className="h-4 w-4" />
                  <span>Return to Home</span>
                </Button>
              </Link>
              <a
                href={whatsappLink(`Hi Kayal Samayal! I placed an order with ref ${orderId || ""}. Please assist.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="whatsapp" size="touch" className="w-full font-bold gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Help</span>
                </Button>
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-white/85 text-xs sm:text-sm max-w-md mx-auto">
              Your authentic Kayal Samayal spices order has been successfully placed and verified.
            </p>
          </div>
        </section>

        <div className="container-page pt-10 sm:pt-14 max-w-3xl mx-auto">
          {/* Order Details Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-6">
            
            {/* Order Reference & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Order ID
                </span>
                <p className="font-mono font-black text-lg sm:text-xl text-primary">{displayOrderId}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Order Date
                </span>
                <p className="font-semibold text-sm text-foreground">{orderDate}</p>
              </div>
            </div>

            {/* Total and Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border/60">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Amount Paid
                </span>
                <p className="font-display font-black text-2xl text-secondary">
                  {formatINR(displayTotal)}
                </p>
                {displayDiscount > 0 ? (
                  <span className="text-xs font-bold text-leaf flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Coupon Discount: -{formatINR(displayDiscount)}</span>
                  </span>
                ) : null}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Payment Status
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                  <span className="font-bold text-sm text-leaf">
                    {displayPaymentMethod === "Cash on Delivery" || displayPaymentMethod === "COD"
                      ? "Pending (Pay on Delivery)"
                      : displayTotal === 0
                      ? "100% Promo (No Payment Needed)"
                      : `${displayPaymentStatus} via ${displayPaymentMethod}`}
                  </span>
                </div>
                <p className="text-[0.7rem] text-muted-foreground">
                  Secured & verified by 256-bit gateway
                </p>
              </div>
            </div>

            {/* Items Ordered */}
            {order?.items && order.items.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                  Items Ordered ({order.items.length})
                </h3>
                <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-surface/60 overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty || item.quantity || 1}</p>
                      </div>
                      {item.price && item.price > 0 ? (
                        <span className="font-extrabold text-foreground shrink-0">
                          {formatINR(item.price * (item.qty || item.quantity || 1))}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Address & Contact */}
            <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                Delivery Address:
              </span>
              <p className="font-bold text-foreground text-sm">{displayCustomerName}</p>
              {displayAddress && (
                <p className="leading-relaxed">
                  {displayAddress}
                  {displayCity ? `, ${displayCity}` : ""}
                  {displayState ? `, ${displayState}` : ""}
                  {displayPincode ? ` – ${displayPincode}` : ""}
                </p>
              )}
              {displayMobile && (
                <p className="font-medium pt-1">
                  Mobile: <strong className="text-foreground">{displayMobile}</strong>
                  {displayEmail ? ` • Email: ${displayEmail}` : ""}
                </p>
              )}
            </div>

            {/* Email & WhatsApp Notification Status */}
            <div className="rounded-2xl bg-leaf/10 border border-leaf/30 p-4 text-xs text-foreground space-y-1">
              <div className="flex items-center gap-2 font-bold text-leaf">
                <Mail className="h-4 w-4" />
                <span>Confirmation & Updates</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {displayEmail ? (
                  <>A confirmation receipt and order details have been dispatched to <strong>{displayEmail}</strong>. </>
                ) : null}
                You will receive shipment and dispatch tracking updates directly on WhatsApp ({displayMobile || brand.phone}).
              </p>
            </div>

            {/* Next Steps Guarantee Banner */}
            <div className="rounded-2xl bg-accent p-4 text-xs text-primary flex items-start gap-3">
              <Truck className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Our team in Tirupattur is freshly milling and packing your traditional spices batch.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <a
                href={whatsappLink(`Hello Kayal Samayal! I placed order #${displayOrderId}. Please confirm dispatch status.`)}
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

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
