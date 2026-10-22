"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
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
  Copy,
  RotateCcw,
  Printer,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

// =============================================================================
// CONFIGURATION
// =============================================================================
// Razorpay Key ID - Use ONLY Razorpay TEST keys ('rzp_test_...').
// HOW TO SWITCH TO LIVE MODE LATER:
// 1. Replace the key below (or set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local) with your live key ('rzp_live_...').
// 2. Set matching live RAZORPAY_KEY_SECRET in server environment and Google Apps Script Script Properties.
// 3. Remove or toggle the TEST_MODE indicator.
export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXXXXX";
export const IS_TEST_MODE = RAZORPAY_KEY_ID.startsWith("rzp_test_");

// Google Apps Script Web App URL for recording orders in Google Sheets
// Set NEXT_PUBLIC_KAYAL_API_URL in .env.local to your deployed Apps Script Web App URL
export const GOOGLE_APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_KAYAL_API_URL || "";

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

interface ConfirmedPaymentDetails {
  orderId: string;
  paymentId: string;
  amount: number;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  date: string;
  paymentMethod: string;
  sheetStatus: "saving" | "saved" | "failed";
  itemsSummary: string;
  verificationStatus: "verified" | "pending";
  verificationMessage?: string;
  signature?: string;
  orderToken?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    customerDetails,
    setCustomerDetails,
    clearCart,
    appliedCoupon,
    isHydrated,
  } = useCart();

  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");

  const [formData, setFormData] = useState(() => {
    const nameParts = (customerDetails?.name || "").trim().split(/\s+/);
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      mobile: customerDetails?.mobile || "",
      email: customerDetails?.email || "",
      address: customerDetails?.address || "",
      city: customerDetails?.city || "",
      state: customerDetails?.state || "Tamil Nadu",
      pincode: customerDetails?.pincode || "",
      notes: customerDetails?.notes || "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("");
  const [orderErr, setOrderErr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [codEnabled, setCodEnabled] = useState<boolean>(false);
  const [confirmedPayment, setConfirmedPayment] = useState<ConfirmedPaymentDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch dynamic payment settings (COD availability) from backend
  useEffect(() => {
    let isMounted = true;
    async function loadStorefrontSettings() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success && data?.settings) {
            const isCod =
              data.settings.cod_enabled === true ||
              String(data.settings.cod_enabled).toLowerCase() === "true";
            setCodEnabled(isCod);
            if (!isCod && paymentMethod === "cod") {
              setPaymentMethod("razorpay");
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch storefront payment settings:", err);
        if (isMounted) setCodEnabled(false);
      }
    }
    loadStorefrontSettings();
    return () => {
      isMounted = false;
    };
  }, [paymentMethod]);

  // Redirect if cart is empty and not on confirm step (only after storage hydration)
  useEffect(() => {
    if (isHydrated && cart.length === 0 && step !== "confirm") {
      router.push("/cart");
    }
  }, [cart, step, router, isHydrated]);

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, cartSubtotal + shipping - discountAmount);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
   * Helper to copy text to clipboard with temporary feedback indicator.
   */
  const handleCopy = (text: string, field: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  /**
   * Dynamically ensures the official Razorpay Checkout SDK is loaded.
   */
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const existing = document.getElementById("razorpay-sdk-script");
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-sdk-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * Saves the order to Google Sheets via the Apps Script Web App.
   * Uses Content-Type: text/plain;charset=utf-8 to avoid CORS preflight failures.
   * If initial write is slow or fails, retries once in the background.
   */
  const saveOrderToGoogleSheets = async (payload: Record<string, unknown>) => {
    console.log("[GOOGLE_SHEETS] Initiating order write to Apps Script...", payload);
    try {
      const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({ success: true }));
        if (json.success !== false) {
          setConfirmedPayment((prev) => (prev ? { ...prev, sheetStatus: "saved" } : null));
          console.log("[GOOGLE_SHEETS] Order successfully saved in Sheets:", json);
          return;
        }
      }
      throw new Error(`Google Apps Script write returned HTTP ${res.status}`);
    } catch (err) {
      console.warn("[GOOGLE_SHEETS] First attempt failed, retrying once in background...", err);
      // Background retry once after 2.5 seconds
      setTimeout(async () => {
        try {
          const retryRes = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
          });
          if (retryRes.ok) {
            setConfirmedPayment((prev) => (prev ? { ...prev, sheetStatus: "saved" } : null));
            console.log("[GOOGLE_SHEETS] Order saved on background retry.");
          } else {
            console.error("[GOOGLE_SHEETS] Background retry failed with HTTP", retryRes.status);
            setConfirmedPayment((prev) => (prev ? { ...prev, sheetStatus: "failed" } : null));
          }
        } catch (retryErr) {
          console.error("[GOOGLE_SHEETS] Background retry exception:", retryErr);
          setConfirmedPayment((prev) => (prev ? { ...prev, sheetStatus: "failed" } : null));
        }
      }, 2500);
    }
  };

  /**
   * Razorpay Online Payment Flow
   */
  const handleOnlinePayment = async () => {
    setOrderErr("");
    setLoading(true);
    setLoadingStatusText("Preparing secure payment...");

    try {
      // 1. Ensure Razorpay checkout script is loaded
      const isLoaded = await ensureRazorpayLoaded();
      if (!isLoaded || typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
      }

      const custFullName = `${formData.firstName} ${formData.lastName}`.trim();
      const deliveryAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

      // 2. Create Razorpay order on server with validated pricing and coupon
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontendTotal: grandTotal,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code || undefined,
          customer: {
            name: custFullName,
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
        throw new Error(
          orderData.error || "Could not initiate secure payment. Please try again or contact support."
        );
      }

      // ── FREE ORDER PATH (₹0 Grand Total) ──────────────────────────────────
      if (orderData.freeOrder) {
        setLoadingStatusText("Completing free order...");
        const freeOrderId = `KS-FREE-${Date.now().toString().slice(-6)}`;
        const freePaymentDetails: ConfirmedPaymentDetails = {
          orderId: freeOrderId,
          paymentId: "FREE_ORDER",
          amount: 0,
          customerName: custFullName,
          phone: formData.mobile,
          email: formData.email,
          address: deliveryAddress,
          date: new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          paymentMethod: "Free Order (100% Discount)",
          sheetStatus: "saving",
          itemsSummary: cart.map((i) => `${i.product.name} (x${i.quantity})`).join(", "),
          verificationStatus: "verified",
        };

        setConfirmedPayment(freePaymentDetails);
        setStep("confirm");
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });

        saveOrderToGoogleSheets({
          timestamp: new Date().toISOString(),
          order_id: freeOrderId,
          payment_id: "FREE_ORDER",
          status: "Paid",
          amount: 0,
          currency: "INR",
          customer_name: custFullName,
          phone: formData.mobile,
          email: formData.email || "",
          address: deliveryAddress,
          items_notes: freePaymentDetails.itemsSummary + (formData.notes ? ` | Notes: ${formData.notes}` : ""),
          razorpay_signature: "FREE_ORDER",
        });

        setLoading(false);
        setLoadingStatusText("");
        return;
      }

      setLoadingStatusText("Opening secure payment...");

      const activeRazorpayKey = RAZORPAY_KEY_ID || orderData.keyId;
      const activeRazorpayOrderId = orderData.razorpayOrderId || orderData.orderId;

      // 3. Configure official Razorpay Checkout Options
      const options: RazorpayOptions = {
        key: activeRazorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: brand.name,
        description: `Order Payment (${cart.length} items)`,
        image: "https://www.kayalsamayal.in/logo.png",
        order_id: activeRazorpayOrderId,
        one_click_checkout: false,
        prefill: {
          name: custFullName,
          contact: formData.mobile,
          email: formData.email,
        },
        theme: {
          color: "#8B2500", // Spice red brand color
        },
        modal: {
          ondismiss: () => {
            // Never fail silently on cancel
            setLoading(false);
            setLoadingStatusText("");
            setOrderErr(
              "Payment window was closed before completion. Your cart is preserved. Click 'Retry Payment' to proceed whenever you are ready."
            );
          },
        },
        handler: async (response) => {
          // Keep the user on checkout page and show spinner while confirming
          setLoading(true);
          setLoadingStatusText("Confirming your payment...");
          setOrderErr("");

          const resolvedOrderId =
            response.razorpay_order_id ||
            activeRazorpayOrderId ||
            `KS-${Date.now().toString().slice(-6)}`;
          const resolvedPaymentId = response.razorpay_payment_id;
          const resolvedSignature = response.razorpay_signature || "";

          const formattedDate = new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const itemsSummary = cart.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");

          const baseRecord: ConfirmedPaymentDetails = {
            orderId: resolvedOrderId,
            paymentId: resolvedPaymentId,
            amount: grandTotal,
            customerName: custFullName,
            phone: formData.mobile,
            email: formData.email,
            address: deliveryAddress,
            date: formattedDate,
            paymentMethod: "Razorpay Online",
            sheetStatus: "saving",
            itemsSummary,
            verificationStatus: "pending",
            signature: resolvedSignature,
            orderToken: orderData.orderToken,
          };

          try {
            // Strict server-side verification (order_id, payment_id, signature)
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderToken: orderData.orderToken,
                razorpay_payment_id: resolvedPaymentId,
                razorpay_order_id: resolvedOrderId,
                razorpay_signature: resolvedSignature,
                customer: { ...formData, name: custFullName },
                items: cart.map((item) => ({
                  productId: item.product.id,
                  quantity: item.quantity,
                })),
              }),
              signal: AbortSignal.timeout(20000), // 20s timeout
            });

            const verifyData = await verifyRes.json().catch(() => ({}));

            if (verifyRes.ok && verifyData.success) {
              // VERIFIED: Payment signature & gateway verified successfully
              setConfirmedPayment({
                ...baseRecord,
                verificationStatus: "verified",
                paymentMethod: "Razorpay Online (Verified)",
                sheetStatus: "saved",
              });
              setStep("confirm");
              clearCart();
              window.scrollTo({ top: 0, behavior: "smooth" });

              // Record in Google Sheets database
              saveOrderToGoogleSheets({
                timestamp: new Date().toISOString(),
                order_id: resolvedOrderId,
                payment_id: resolvedPaymentId,
                status: "Paid",
                amount: grandTotal,
                currency: "INR",
                customer_name: custFullName,
                phone: formData.mobile,
                email: formData.email || "",
                address: deliveryAddress,
                items_notes: itemsSummary + (formData.notes ? ` | Notes: ${formData.notes}` : ""),
                razorpay_signature: resolvedSignature,
              });
            } else {
              // Verification failed / signature invalid
              const failReason = verifyData.error || "Payment verification could not be confirmed immediately.";
              console.warn("[PAYMENT_FLOW] Verification returned unconfirmed:", failReason);
              setConfirmedPayment({
                ...baseRecord,
                verificationStatus: "pending",
                verificationMessage: failReason,
                sheetStatus: "failed",
              });
              setStep("confirm");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          } catch (verErr: unknown) {
            // Network timeout / connection error
            console.error("[PAYMENT_FLOW] Verification request failed/timed out:", verErr);
            const isTimeout = verErr instanceof Error && verErr.name === "AbortError";
            setConfirmedPayment({
              ...baseRecord,
              verificationStatus: "pending",
              verificationMessage: isTimeout
                ? "Server verification timed out. If your bank deducted the amount, your order is safe!"
                : "Unable to verify payment with server. Please click Retry Confirmation below.",
              sheetStatus: "failed",
            });
            setStep("confirm");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } finally {
            setLoading(false);
            setLoadingStatusText("");
          }
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure explicitly
      rzp.on("payment.failed", (failedRes: { error?: { description?: string } }) => {
        setLoading(false);
        setLoadingStatusText("");
        setOrderErr(
          failedRes?.error?.description ||
            "Payment failed with the selected payment method. Please check your card or UPI details and click 'Retry Payment'."
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
   * Retry Payment Confirmation (for pending/timed-out verification)
   */
  const retryVerification = async () => {
    if (!confirmedPayment) return;
    setLoading(true);
    setLoadingStatusText("Confirming your payment...");
    try {
      const verifyRes = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderToken: confirmedPayment.orderToken,
          razorpay_payment_id: confirmedPayment.paymentId,
          razorpay_order_id: confirmedPayment.orderId,
          razorpay_signature: confirmedPayment.signature,
          customer: {
            name: confirmedPayment.customerName,
            mobile: confirmedPayment.phone,
            email: confirmedPayment.email,
          },
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
        signal: AbortSignal.timeout(20000),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (verifyRes.ok && verifyData.success) {
        setConfirmedPayment((prev) =>
          prev
            ? {
                ...prev,
                verificationStatus: "verified",
                paymentMethod: "Razorpay Online (Verified)",
                sheetStatus: "saved",
                verificationMessage: undefined,
              }
            : null
        );
        clearCart();
      } else {
        setConfirmedPayment((prev) =>
          prev
            ? {
                ...prev,
                verificationStatus: "pending",
                verificationMessage:
                  verifyData.error || "Payment confirmation still pending. Please wait a moment and try again.",
              }
            : null
        );
      }
    } catch {
      setConfirmedPayment((prev) =>
        prev
          ? {
              ...prev,
              verificationStatus: "pending",
              verificationMessage: "Connection error. Please try again in a few moments.",
            }
          : null
      );
    } finally {
      setLoading(false);
      setLoadingStatusText("");
    }
  };

  /**
   * Cash on Delivery (COD) Order Flow
   */
  const handleCodOrder = async () => {
    if (!codEnabled) {
      setOrderErr("Cash on Delivery is currently disabled. Please choose Online Payment.");
      return;
    }
    setOrderErr("");
    setLoading(true);
    setLoadingStatusText("Placing your Cash on Delivery order...");

    const custFullName = `${formData.firstName} ${formData.lastName}`.trim();
    const deliveryAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

    try {
      const res = await fetch("/api/orders/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: custFullName,
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

      const confirmedCod = data.orderResponse || data;
      const codOrderId = confirmedCod.orderId || `KS-COD-${Date.now().toString().slice(-6)}`;
      const itemsSummary = cart.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");

      const codDetails: ConfirmedPaymentDetails = {
        orderId: codOrderId,
        paymentId: "COD_PENDING",
        amount: grandTotal,
        customerName: custFullName,
        phone: formData.mobile,
        email: formData.email,
        address: deliveryAddress,
        date: new Date().toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: "Cash on Delivery",
        sheetStatus: "saving",
        itemsSummary,
        verificationStatus: "verified",
      };

      setConfirmedPayment(codDetails);
      setStep("confirm");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Save COD order to Google Sheets
      saveOrderToGoogleSheets({
        timestamp: new Date().toISOString(),
        order_id: codOrderId,
        payment_id: "COD_PENDING",
        status: "Pending (COD)",
        amount: grandTotal,
        currency: "INR",
        customer_name: custFullName,
        phone: formData.mobile,
        email: formData.email || "",
        address: deliveryAddress,
        items_notes: itemsSummary + (formData.notes ? ` | Notes: ${formData.notes}` : ""),
        razorpay_signature: "COD",
      });
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
        id="razorpay-sdk-script"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      {/* Loading & Confirmation Spinner Overlay */}
      {loading && Boolean(loadingStatusText) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-primary">
                {loadingStatusText}
              </h3>
              <p className="text-xs text-muted-foreground">
                Please wait while we communicate with the gateway. Do not close or refresh.
              </p>
            </div>
          </div>
        </div>
      )}
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        {/* Banner with Test Mode Badge */}
        <section className="bg-spice-gradient py-10 sm:py-12 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            {IS_TEST_MODE && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold tracking-wider uppercase shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Test Mode (Simulated Gateway)</span>
              </div>
            )}
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
          {/* STEP 3: ORDER CONFIRMED SCREEN */}
          {step === "confirm" ? (
            <div className="max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-lift)] text-center space-y-6 animate-in zoom-in-95">
              {/* Badge & Heading based on Verification Status */}
              {confirmedPayment?.verificationStatus === "verified" ? (
                <>
                  {/* Green Success Badge */}
                  <div className="h-20 w-20 mx-auto rounded-full bg-leaf/15 flex items-center justify-center text-leaf shadow-inner ring-4 ring-leaf/20">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-leaf">
                      Payment Successful
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-primary">
                      Thank You, {confirmedPayment?.customerName || customerDetails.name || "Valued Customer"}!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      Your payment has been received and verified. Our kitchen team in Tirupattur is preparing your authentic spice batch.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Amber Pending Badge */}
                  <div className="h-20 w-20 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 shadow-inner ring-4 ring-amber-500/20">
                    <Clock className="h-12 w-12" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                      Payment Received, Confirmation Pending
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-primary">
                      Order Under Verification
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      We received your payment through Razorpay, but our server is still awaiting gateway confirmation.
                    </p>
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-xs text-left max-w-md mx-auto space-y-1">
                      <p className="font-bold">Peace of Mind Guarantee:</p>
                      <p>
                        If money was deducted from your bank or UPI app, your order is completely safe! You can click <strong>Retry Confirmation</strong> below or share your Payment ID with our WhatsApp support.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Database Save Status Indicator */}
              <div className="flex items-center justify-center">
                {confirmedPayment?.sheetStatus === "saving" && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                    <span>Saving your order to database...</span>
                  </div>
                )}
                {confirmedPayment?.sheetStatus === "saved" && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Order verified and saved to database</span>
                  </div>
                )}
                {confirmedPayment?.sheetStatus === "failed" && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-foreground text-xs font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Confirmation pending server verification</span>
                  </div>
                )}
              </div>

              {/* Order Confirmation Card */}
              <div className="rounded-2xl bg-surface border border-border p-5 text-left text-xs sm:text-sm space-y-3 shadow-xs">
                {/* Order ID */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Order ID:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                    <span>{confirmedPayment?.orderId || "KS-CONFIRMED"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(confirmedPayment?.orderId || "", "orderId")}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Order ID"
                    >
                      {copiedField === "orderId" ? (
                        <Check className="h-3.5 w-3.5 text-leaf" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Payment ID */}
                {confirmedPayment?.paymentId && (
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Payment ID:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-secondary">
                      <span>{confirmedPayment.paymentId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(confirmedPayment.paymentId, "paymentId")}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Payment ID"
                      >
                        {copiedField === "paymentId" ? (
                          <Check className="h-3.5 w-3.5 text-leaf" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount Paid */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Amount:</span>
                  <span className="font-extrabold text-secondary text-base">
                    {formatINR(confirmedPayment?.amount ?? grandTotal)}
                  </span>
                </div>

                {/* Customer Name */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Customer Name:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedPayment?.customerName || customerDetails.name}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Date & Time:</span>
                  <span className="font-medium text-foreground">
                    {confirmedPayment?.date || new Date().toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Payment Method:</span>
                  <span className="font-bold text-leaf">
                    {confirmedPayment?.paymentMethod || "Razorpay Online"}
                  </span>
                </div>

                {/* Delivery Address */}
                <div className="flex items-start justify-between py-1">
                  <span className="text-muted-foreground font-medium shrink-0 pr-4">Delivery Address:</span>
                  <span className="font-medium text-foreground text-right max-w-[280px]">
                    {confirmedPayment?.address || `${customerDetails.address}, ${customerDetails.city}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                {confirmedPayment?.verificationStatus === "verified" ? (
                  <>
                    <Link href="/" className="flex-1">
                      <Button variant="plum" size="touch" className="w-full font-bold shadow-md">
                        Continue Shopping
                      </Button>
                    </Link>
                    <a
                      href={whatsappLink(
                        `Hi Kayal Samayal! I placed order #${confirmedPayment?.orderId || ""} (Payment ID: ${confirmedPayment?.paymentId || ""}). Please share dispatch updates.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="whatsapp" size="touch" className="w-full font-bold">
                        WhatsApp Order Updates
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="plum"
                      size="touch"
                      onClick={retryVerification}
                      disabled={loading}
                      className="flex-1 font-bold shadow-md gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      <span>Retry Confirmation</span>
                    </Button>
                    <a
                      href={whatsappLink(
                        `Hi Kayal Samayal! My payment was processed on Razorpay with Payment ID: ${confirmedPayment?.paymentId || ""} (Order ID: ${confirmedPayment?.orderId || ""}), but confirmation is pending. Please check and confirm my order.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="whatsapp" size="touch" className="w-full font-bold">
                        WhatsApp Support
                      </Button>
                    </a>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  onClick={() => window.print()}
                  className="font-bold gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </Button>
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
                        <label className="text-xs font-bold text-foreground">
                          Order Notes / Delivery Instructions (Optional)
                        </label>
                        <textarea
                          name="notes"
                          rows={2}
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="e.g. Call before delivery, landmark near temple"
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
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-bold text-lg sm:text-xl text-primary">
                          2. Choose Payment Method
                        </h2>
                        {IS_TEST_MODE && (
                          <span className="text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Test Mode
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    {/* Test Mode Guidance Box */}
                    {IS_TEST_MODE && (
                      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Test Gateway Credentials (No real money charged):</span>
                        </div>
                        <p className="text-[0.75rem] leading-relaxed">
                          • <strong>Card:</strong>{" "}
                          <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold">
                            4111 1111 1111 1111
                          </code>{" "}
                          (Expiry: any future date, CVV: 123, OTP: any 4 digits)
                        </p>
                        <p className="text-[0.75rem]">
                          • <strong>UPI:</strong>{" "}
                          <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold">
                            success@razorpay
                          </code>
                        </p>
                      </div>
                    )}

                    {/* Payment Method Selection */}
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
                        {codEnabled && (
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
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border text-xs">
                      <span className="text-muted-foreground font-medium">Payable Total:</span>
                      <span className="font-display font-black text-secondary text-base">{formatINR(grandTotal)}</span>
                    </div>

                    {/* Prominent Error Banner with RETRY Button */}
                    {orderErr && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm space-y-3 animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Payment Incomplete</p>
                            <p className="text-xs opacity-90 leading-relaxed">{orderErr}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            variant="plum"
                            size="sm"
                            onClick={handleOnlinePayment}
                            disabled={loading}
                            className="font-bold gap-1.5 shadow-sm"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Retry Payment</span>
                          </Button>
                          <a
                            href={whatsappLink(
                              `Hi Kayal Samayal! I had an issue during payment for ₹${grandTotal}. Please assist me.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button type="button" variant="outline" size="sm" className="font-bold text-xs">
                              WhatsApp Help
                            </Button>
                          </a>
                        </div>
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

                      {/* Pay Button - Disabled while loading to prevent double submission */}
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
