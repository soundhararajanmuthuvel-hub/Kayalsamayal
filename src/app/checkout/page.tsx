"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { type OrderResponse } from "@/lib/api";
import { brand, formatINR, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { CouponSection } from "@/components/coupon";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Banknote,
  Lock,
  Tag,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  one_click_checkout?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerDetails, setCustomerDetails, clearCart, appliedCoupon } = useCart();

  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: customerDetails.mobile || "",
    email: customerDetails.email || "",
    address: customerDetails.address || "",
    city: customerDetails.city || "",
    state: customerDetails.state || "Tamil Nadu",
    pincode: customerDetails.pincode || "",
    notes: customerDetails.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("");
  const [orderErr, setOrderErr] = useState("");
  const [orderResponse, setOrderResponse] = useState<OrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  // Redirect if cart is empty and not on confirm step
  useEffect(() => {
    if (cart.length === 0 && step !== "confirm") {
      router.push("/cart");
    }
  }, [cart, step, router]);

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  // Mirror the server: Math.max(0, ...) — free orders (100% coupon) legitimately total ₹0
  const grandTotal = Math.max(0, cartSubtotal + shipping - discountAmount);

  /** Dynamic discount label — derived from coupon definition, never hardcoded. */
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

  const validateField = (name: string, value: string) => {
    let err = "";
    if (["firstName", "lastName", "address", "city", "pincode"].includes(name) && !value.trim()) {
      err = "Required field.";
    } else if (name === "mobile" && !value.trim()) {
      err = "Mobile number is required.";
    } else if (name === "email" && value.trim()) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) err = "Invalid email address.";
    }
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleToPayment = () => {
    const newErrors: Record<string, string> = {};
    ["firstName", "lastName", "address", "city", "pincode", "mobile"].forEach((key) => {
      const val = formData[key as keyof typeof formData];
      if (!val || !val.trim()) newErrors[key] = "Required field.";
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCustomerDetails({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      mobile: formData.mobile,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      notes: formData.notes,
    });

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Razorpay Online Payment Flow
   */
  const handleOnlinePayment = async () => {
    setOrderErr("");
    setLoading(true);
    setLoadingStatusText("Preparing secure payment...");

    try {
      // 1. Create Razorpay order on server with validated pricing and coupon
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code || undefined,
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            mobile: formData.mobile,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            notes: formData.notes,
          },
        }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Could not initiate secure payment. Please try again or contact support on WhatsApp.");
      }

      // ── FREE ORDER PATH ───────────────────────────────────────────────
      // Server signals grand total = ₹0 — skip Razorpay entirely.
      if (orderData.freeOrder) {
        setLoadingStatusText("Completing your order...");
        try {
          const freeRes = await fetch("/api/orders/free", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                mobile: formData.mobile,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                notes: formData.notes,
              },
              items: cart.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
              })),
              couponCode: appliedCoupon?.code || undefined,
            }),
          });
          const freeData = await freeRes.json();
          if (!freeRes.ok || !freeData.success) {
            throw new Error(freeData.error || "Failed to complete order. Please try again.");
          }
          clearCart();
          setOrderResponse(freeData.orderResponse);
          setStep("confirm");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
          setLoading(false);
          setLoadingStatusText("");
        }
        return; // Do NOT open Razorpay modal
      }
      // ── END FREE ORDER PATH ─────────────────────────────────────────

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
      }

      setLoadingStatusText("Opening secure payment...");

      // 2. Configure official Razorpay Checkout
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: brand.name,
        description: `Order Payment (${cart.length} items)`,
        image: "https://www.kayalsamayal.in/logo.png",
        order_id: orderData.orderId,
        one_click_checkout: false,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          contact: formData.mobile,
          email: formData.email,
        },
        theme: {
          color: "#8B2500", // Spice red brand color
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setLoadingStatusText("");
            setOrderErr("Payment was not completed. Your cart is still saved. You can try again.");
          },
        },
        handler: async (response) => {
          // 3. Server-side verification of payment signature using server-stored order token
          setLoadingStatusText("Confirming your payment...");
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderToken: orderData.orderToken,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer: {
                  name: `${formData.firstName} ${formData.lastName}`.trim(),
                  mobile: formData.mobile,
                  email: formData.email,
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pincode,
                  notes: formData.notes,
                },
                items: cart.map((item) => ({
                  productId: item.product.id,
                  quantity: item.quantity,
                })),
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed. Please contact support.");
            }

            clearCart();
            setOrderResponse(verifyData.orderResponse);
            setStep("confirm");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (verErr: unknown) {
            console.error("Verification error:", verErr);
            const msg = verErr instanceof Error ? verErr.message : "Payment verification failed.";
            setOrderErr(msg);
          } finally {
            setLoading(false);
            setLoadingStatusText("");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failedRes: { error?: { description?: string } }) => {
        setLoading(false);
        setLoadingStatusText("");
        setOrderErr(
          failedRes?.error?.description || "Payment was not completed. Your cart is still saved. You can try again."
        );
      });
      rzp.open();
    } catch (err: unknown) {
      console.error("Payment initiation error:", err);
      const msg = err instanceof Error ? err.message : "Unable to start secure payment. Please try again.";
      setOrderErr(msg);
      setLoading(false);
      setLoadingStatusText("");
    }
  };

  /**
   * Cash on Delivery (COD) Order Flow
   */
  const handleCodOrder = async () => {
    setOrderErr("");
    setLoading(true);
    setLoadingStatusText("Placing your Cash on Delivery order...");

    try {
      const res = await fetch("/api/orders/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            mobile: formData.mobile,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            notes: formData.notes,
          },
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place Cash on Delivery order. Please try again.");
      }

      clearCart();
      setOrderResponse(data.orderResponse);
      setStep("confirm");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("COD placement error:", err);
      const msg = err instanceof Error ? err.message : "Failed to place Cash on Delivery order. Please try again.";
      setOrderErr(msg);
    } finally {
      setLoading(false);
      setLoadingStatusText("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner */}
        <section className="bg-spice-gradient py-10 sm:py-12 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold">
              Secure Checkout
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-white/80">
              <span className={step === "shipping" ? "text-gold font-bold" : "text-white/60"}>
                1. Customer Details
              </span>
              <span>→</span>
              <span className={step === "payment" ? "text-gold font-bold" : "text-white/60"}>
                2. Payment Method
              </span>
              <span>→</span>
              <span className={step === "confirm" ? "text-gold font-bold" : "text-white/60"}>
                3. Order Placed
              </span>
            </div>
          </div>
        </section>

        <div className="container-page pt-8 sm:pt-10">
          
          {/* STEP 3: ORDER CONFIRMED */}
          {step === "confirm" ? (
            <div className="max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-[var(--shadow-lift)] text-center space-y-6 animate-in zoom-in-95">
              <div className="h-16 w-16 mx-auto rounded-full bg-leaf/15 flex items-center justify-center text-leaf">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-leaf">
                  Order Successfully Placed
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-primary">
                  Thank You, {customerDetails.name}!
                </h2>
                {orderResponse?.orderId && (
                  <p className="text-sm font-mono font-bold text-foreground bg-surface py-1.5 px-4 rounded-full inline-block border border-border">
                    Order ID: {orderResponse.orderId}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                We have received your order details. Our team is preparing your authentic spice batch and will update you with tracking details.
              </p>

              <div className="rounded-2xl bg-surface border border-border p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span className="font-bold text-foreground">
                    {orderResponse?.paymentMethod || (grandTotal === 0 ? "Free Order (Coupon)" : paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)")}
                  </span>
                </div>
                {orderResponse?.discount && orderResponse.discount > 0 ? (
                  <div className="flex justify-between text-leaf font-bold">
                    <span>Coupon Discount:</span>
                    <span>- {formatINR(orderResponse.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className={`font-bold ${orderResponse?.paymentStatus === "Paid" ? "text-leaf" : "text-secondary"}`}>
                    {orderResponse?.paymentStatus || (paymentMethod === "cod" && grandTotal > 0 ? "Pending (Pay on Delivery)" : "Paid")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Address:</span>
                  <span className="font-bold text-foreground truncate max-w-[240px]">
                    {customerDetails.address}, {customerDetails.city}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={whatsappLink(`Hi Kayal Samayal! I placed order #${orderResponse?.orderId || ""}. Please confirm dispatch status.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="whatsapp" size="touch" className="w-full font-bold">
                    WhatsApp Order Updates
                  </Button>
                </a>
                <Link href="/" className="flex-1">
                  <Button variant="outline" size="touch" className="w-full font-bold">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Steps */}
              <div className="lg:col-span-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-8">
                
                {/* STEP 1: SHIPPING DETAILS */}
                {step === "shipping" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h2 className="font-display font-bold text-lg sm:text-xl text-primary">
                        1. Shipping & Customer Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="e.g. Soundhar"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.firstName && <p className="text-[0.7rem] text-destructive">{errors.firstName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="e.g. Muthuvel"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.lastName && <p className="text-[0.7rem] text-destructive">{errors.lastName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Mobile Phone Number *</label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.mobile && <p className="text-[0.7rem] text-destructive">{errors.mobile}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Email Address (Optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="For receipt & updates"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.email && <p className="text-[0.7rem] text-destructive">{errors.email}</p>}
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-foreground">Complete Shipping Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="House / Flat No., Street, Landmark"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.address && <p className="text-[0.7rem] text-destructive">{errors.address}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">City / Town *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. Tirupattur, Chennai"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.city && <p className="text-[0.7rem] text-destructive">{errors.city}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">State *</label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer"
                        >
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Puducherry">Puducherry</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Other">Other States</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="6-digit pincode"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                        {errors.pincode && <p className="text-[0.7rem] text-destructive">{errors.pincode}</p>}
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-foreground">Order Notes / Delivery Instructions (Optional)</label>
                        <textarea
                          name="notes"
                          rows={2}
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="e.g. Call before delivery, landmark near water tank"
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="plum"
                        size="touch"
                        className="w-full sm:w-auto font-bold gap-2 px-8 shadow-md"
                        onClick={handleToPayment}
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {step === "payment" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h2 className="font-display font-bold text-lg sm:text-xl text-primary">
                        2. Choose Payment Method
                      </h2>
                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    {/* PAYMENT METHOD SELECTION */}
                    {grandTotal === 0 ? (
                      <div className="rounded-2xl border-2 border-leaf bg-leaf/10 shadow-xs ring-1 ring-leaf/30 p-5 space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-leaf shrink-0" />
                          <div>
                            <h3 className="font-display font-bold text-base text-primary">
                              100% Discount Applied — Free Order
                            </h3>
                            <p className="text-xs font-medium text-muted-foreground">
                              No payment required. Your order will be placed instantly for free.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Option 1: Pay Online via Razorpay */}
                        <div
                          onClick={() => setPaymentMethod("razorpay")}
                          className={`rounded-2xl border-2 p-5 transition-all cursor-pointer space-y-3 ${
                            paymentMethod === "razorpay"
                              ? "border-secondary bg-accent shadow-xs ring-1 ring-secondary/30"
                              : "border-border bg-card hover:border-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  paymentMethod === "razorpay" ? "border-secondary" : "border-muted-foreground"
                                }`}
                              >
                                {paymentMethod === "razorpay" && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-base text-primary">
                                  Pay Online via Razorpay
                                </h3>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Instant confirmation &bull; UPI, Cards, Net Banking, Wallets
                                </p>
                              </div>
                            </div>
                            <CreditCard className="h-6 w-6 text-secondary" />
                          </div>
                          {paymentMethod === "razorpay" && (
                            <div className="border-t border-border/80 pt-3 flex items-start gap-2 text-xs text-muted-foreground">
                              <Lock className="h-3.5 w-3.5 text-leaf shrink-0 mt-0.5" />
                              <span>Encrypted 256-bit secure transaction via Razorpay gateway.</span>
                            </div>
                          )}
                        </div>

                        {/* Option 2: Cash on Delivery (COD) */}
                        <div
                          onClick={() => setPaymentMethod("cod")}
                          className={`rounded-2xl border-2 p-5 transition-all cursor-pointer space-y-3 ${
                            paymentMethod === "cod"
                              ? "border-secondary bg-accent shadow-xs ring-1 ring-secondary/30"
                              : "border-border bg-card hover:border-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  paymentMethod === "cod" ? "border-secondary" : "border-muted-foreground"
                                }`}
                              >
                                {paymentMethod === "cod" && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-base text-primary">
                                  Cash on Delivery (COD)
                                </h3>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Pay with Cash or UPI upon doorstep delivery
                                </p>
                              </div>
                            </div>
                            <Banknote className="h-6 w-6 text-secondary" />
                          </div>
                          {paymentMethod === "cod" && (
                            <div className="border-t border-border/80 pt-3 flex items-start gap-2 text-xs text-muted-foreground">
                              <ShieldCheck className="h-3.5 w-3.5 text-leaf shrink-0 mt-0.5" />
                              <span>Inspect your authentic spices batch upon delivery before paying.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border text-xs">
                      <span className="text-muted-foreground font-medium">Authoritative Payable Total:</span>
                      <span className="font-display font-black text-secondary text-base">{formatINR(grandTotal)}</span>
                    </div>

                    {orderErr && (
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{orderErr}</span>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="touch"
                        onClick={() => setStep("shipping")}
                        disabled={loading}
                        className="font-bold"
                      >
                        Back to Shipping
                      </Button>

                      <Button
                        type="button"
                        variant="plum"
                        size="touch"
                        disabled={loading}
                        onClick={
                          grandTotal === 0
                            ? handleOnlinePayment
                            : paymentMethod === "razorpay"
                            ? handleOnlinePayment
                            : handleCodOrder
                        }
                        className="font-bold gap-2 px-8 shadow-md"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{loadingStatusText || "Processing…"}</span>
                          </>
                        ) : grandTotal === 0 ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Place Free Order Now</span>
                          </>
                        ) : paymentMethod === "razorpay" ? (
                          <>
                            <Lock className="h-4 w-4" />
                            <span>Pay {formatINR(grandTotal)} Securely</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Confirm COD Order ({formatINR(grandTotal)})</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Order Summary Sidebar */}
              <div className="lg:col-span-4 rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-5">
                <h3 className="font-display font-bold text-base text-primary pb-3 border-b border-border">
                  Order Summary ({cart.length} Items)
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-border/50 pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-foreground truncate">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-foreground shrink-0">
                        {formatINR(getProductPrice(item.product) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatINR(cartSubtotal)}</span>
                  </div>

                  {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                    <div className="flex justify-between text-leaf font-bold items-center">
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3" />
                        <span>{discountLabel}</span>
                        <span
                          className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-help text-[0.7rem]"
                          title={appliedCoupon.message || `${appliedCoupon.code} promo applied`}
                        >
                          ⓘ
                        </span>
                      </span>
                      <span>-{formatINR(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-bold text-foreground">{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-border">
                    <span>Total Payable</span>
                    <span className="text-secondary font-extrabold text-lg">{formatINR(grandTotal)}</span>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2 border-t border-border/70">
                  <CouponSection variant="checkout" compact={true} />
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border/60 text-[0.7rem] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5 text-leaf" />
                    <span>Kayal Samayal Guarantee</span>
                  </div>
                  <p>FSSAI: {brand.fssai} • Direct from Tirupattur</p>
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

