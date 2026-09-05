"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { getSettings, type OrderResponse } from "@/lib/api";
import { brand, formatINR, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Truck,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerDetails, setCustomerDetails, placeOrder } = useCart();

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
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
  const [utr, setUtr] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [upiId, setUpiId] = useState("pay.kayalsamayal@okaxis");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderErr, setOrderErr] = useState("");
  const [orderResponse, setOrderResponse] = useState<OrderResponse | null>(null);

  // Payment Screenshot
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState<string>("");

  // Load store settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings) {
          const loadedUpi = settings.upi_id || settings.upiId;
          if (loadedUpi && loadedUpi.trim()) {
            setUpiId(loadedUpi.trim());
          }
        }
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    loadSettings();
  }, []);

  // Redirect if cart is empty and not on confirm step
  useEffect(() => {
    if (cart.length === 0 && step !== "confirm") {
      router.push("/cart");
    }
  }, [cart, step, router]);

  const isFreeShipping = cartSubtotal >= brand.freeShippingOver;
  const shipping = isFreeShipping ? 0 : cartSubtotal > 0 ? brand.shippingFlat : 0;
  const grandTotal = cartSubtotal + shipping;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Please upload a JPG, PNG or WEBP image under 5 MB.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size should be less than 5 MB.");
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPaymentScreenshotPreview(base64);
      setScreenshotBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handlePlaceFinalOrder = async () => {
    setOrderErr("");

    if (paymentMethod === "UPI") {
      if (!utr.trim()) {
        setOrderErr("Please enter the 12-digit UPI Reference / UTR Number from your payment app.");
        return;
      }
      if (!isChecked) {
        setOrderErr("Please confirm that you have completed the UPI payment transfer.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await placeOrder(
        paymentMethod === "UPI" ? utr.trim() : "COD",
        paymentMethod,
        screenshotBase64,
        screenshotName
      );

      if (res && res.success) {
        setOrderResponse(res);
        setStep("confirm");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setOrderErr(
          res?.message ||
            "Unable to place your order right now. Please check your internet connection and try again."
        );
      }
    } catch (e) {
      console.error(e);
      setOrderErr("A network error occurred. Please try again or reach out on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic UPI Intent String
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    brand.legalName
  )}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent("Kayal Samayal Order")}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
                  <span className="font-bold text-foreground">{paymentMethod === "UPI" ? "UPI (Manual Verification)" : "Cash on Delivery / Pay Later"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Address:</span>
                  <span className="font-bold text-foreground truncate max-w-[240px]">{customerDetails.address}, {customerDetails.city}</span>
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

                    {/* Payment Mode Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("UPI")}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          paymentMethod === "UPI"
                            ? "border-secondary bg-accent shadow-xs"
                            : "border-border bg-surface hover:bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display font-bold text-base text-primary">
                            Option 1: Pay via UPI
                          </span>
                          <QrCode className="h-5 w-5 text-secondary" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Scan QR, pay on GPay / PhonePe / Paytm, and enter UTR reference.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("COD")}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          paymentMethod === "COD"
                            ? "border-secondary bg-accent shadow-xs"
                            : "border-border bg-surface hover:bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display font-bold text-base text-primary">
                            Option 2: Cash on Delivery / Pay Later
                          </span>
                          <Truck className="h-5 w-5 text-secondary" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Skip online payment now. Pay cash upon doorstep delivery.
                        </p>
                      </button>
                    </div>

                    {/* OPTION 1: UPI INSTRUCTIONS & FORM */}
                    {paymentMethod === "UPI" && (
                      <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 space-y-6 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                          {/* QR Code */}
                          <div className="bg-white p-3 rounded-2xl border border-border shadow-xs shrink-0 text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrImageUrl}
                              alt="Kayal Samayal UPI Payment QR Code"
                              className="h-44 w-44 object-contain"
                            />
                            <span className="text-[0.65rem] text-muted-foreground font-bold mt-1 block">
                              Scan with any UPI App
                            </span>
                          </div>

                          {/* UPI ID & App Link */}
                          <div className="space-y-3.5 text-center sm:text-left flex-1">
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground font-semibold">Amount to Pay:</span>
                              <p className="font-display font-black text-2xl text-secondary">{formatINR(grandTotal)}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground font-semibold">UPI ID:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-card px-3 py-1.5 rounded-lg font-mono text-xs font-bold text-primary border border-border">
                                  {upiId}
                                </code>
                                <button
                                  type="button"
                                  onClick={handleCopyUPI}
                                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-secondary text-xs flex items-center gap-1 font-bold"
                                >
                                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  <span>{copied ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            </div>

                            <div>
                              <a href={upiIntentUrl} className="inline-block">
                                <Button variant="plum" size="sm" className="gap-1.5 font-bold">
                                  <span>Pay Directly via UPI App</span>
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Transaction UTR & Screenshot */}
                        <div className="space-y-4 pt-4 border-t border-border">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground flex items-center gap-1">
                              <span>12-Digit UPI Transaction / UTR Ref ID *</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 328109823471"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                            />
                            <p className="text-[0.65rem] text-muted-foreground">
                              Find the 12-digit UPI Reference Number inside your payment receipt on GPay, PhonePe, or Paytm.
                            </p>
                          </div>

                          {/* Screenshot Upload */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                              Upload Payment Screenshot (Optional)
                            </label>
                            {paymentScreenshotPreview ? (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={paymentScreenshotPreview}
                                  alt="Screenshot Preview"
                                  className="h-14 w-14 object-cover rounded-lg border border-border"
                                />
                                <span className="text-xs font-medium truncate flex-1">{screenshotName}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentScreenshotPreview(null);
                                    setScreenshotBase64("");
                                    setScreenshotName("");
                                  }}
                                  className="text-destructive p-1.5"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border bg-card hover:bg-accent/50 cursor-pointer text-xs font-bold text-secondary">
                                <Upload className="h-4 w-4" />
                                <span>Upload Payment Screenshot (JPG, PNG under 5MB)</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                              </label>
                            )}
                          </div>

                          {/* Checkbox */}
                          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setIsChecked(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                            />
                            <span className="text-xs text-foreground font-medium">
                              I have completed the UPI payment transfer of <strong>{formatINR(grandTotal)}</strong> to Kayal Samayal.
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* OPTION 2: COD / PAY LATER INSTRUCTIONS */}
                    {paymentMethod === "COD" && (
                      <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 space-y-3 animate-in fade-in">
                        <h3 className="font-display font-bold text-base text-primary">
                          Pay Cash on Doorstep Delivery
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Your order will be packed and dispatched directly. You can inspect the package and pay the delivery executive in cash or via UPI at the time of delivery.
                        </p>
                      </div>
                    )}

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
                        className="font-bold"
                      >
                        Back to Shipping
                      </Button>

                      <Button
                        type="button"
                        variant="plum"
                        size="touch"
                        disabled={loading}
                        onClick={handlePlaceFinalOrder}
                        className="font-bold gap-2 px-8 shadow-md"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Submitting Order…</span>
                          </>
                        ) : (
                          <>
                            <span>{paymentMethod === "UPI" ? "Confirm Payment & Place Order" : "Place Order (Pay on Delivery)"}</span>
                            <ArrowRight className="h-4 w-4" />
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
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-bold text-foreground">{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-border">
                    <span>Total Payable</span>
                    <span className="text-secondary font-extrabold text-lg">{formatINR(grandTotal)}</span>
                  </div>
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
