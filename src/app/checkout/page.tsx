"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { getSettings } from "@/lib/api";
import { ShieldCheck, ChevronRight, CheckCircle, AlertCircle, QrCode, Camera, Trash2, RefreshCw, Copy, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerDetails, setCustomerDetails, placeOrder, clearCart } = useCart();

  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping");
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
  const [upiId, setUpiId] = useState("pay.kayalsamayal@okaxis"); // Dynamic fallback
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderErr, setOrderErr] = useState("");

  // Screenshot Upload State
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG or WEBP image under 5 MB.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload a JPG, PNG or WEBP image under 5 MB.");
      return;
    }

    setPaymentScreenshot(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      setPaymentScreenshotPreview(base64Url);
      setScreenshotBase64(base64Url);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setPaymentScreenshotPreview(null);
    setScreenshotBase64("");
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load Settings from Sheet
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.upiId) {
          setUpiId(settings.upiId);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  // Redirect if cart empty
  useEffect(() => {
    if (cart.length === 0 && step !== "review") {
      router.push("/cart");
    }
  }, [cart, step, router]);

  const validateField = (name: string, value: string) => {
    let err = "";
    if (["firstName", "lastName", "address", "city", "pincode"].includes(name) && !value.trim()) {
      err = "Required field.";
    } else if (name === "mobile" && !value.trim()) {
      err = "Mobile number is required.";
    } else if (name === "email" && !value.trim()) {
      err = "Email is required.";
    } else if (name === "email") {
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

  const handleNextStep = () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      if (["firstName", "lastName", "address", "city", "pincode", "mobile", "email"].includes(key)) {
        const val = formData[key as keyof typeof formData];
        if (!val.trim()) newErrors[key] = "Required field.";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Set context details
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
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "UPI") {
      const hasUtr = utr.trim() !== "";
      const hasScreenshot = !!paymentScreenshot;

      if (!hasUtr && !hasScreenshot) {
        alert("Please enter your UTR / Transaction ID or upload a payment screenshot.");
        return;
      }
      if (!isChecked) {
        alert("Please confirm you have completed the UPI payment transfer.");
        return;
      }
    }

    setLoading(true);
    setOrderErr("");

    try {
      const response = await placeOrder(
        paymentMethod === "UPI" ? utr : "",
        paymentMethod,
        paymentMethod === "UPI" ? screenshotBase64 : "",
        paymentMethod === "UPI" && paymentScreenshot ? paymentScreenshot.name : ""
      );
      if (response && response.success) {
        router.push("/thank-you");
      } else {
        setOrderErr(response?.message || "Failed to submit order. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setOrderErr("A connection error occurred. Please verify your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const shipping = cartSubtotal >= 500 ? 0 : 50;
  const grandTotal = cartSubtotal + shipping;

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* Progress Step Header */}
        <section className="bg-white border-b border-cream-300 py-6">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between font-body text-xs sm:text-sm font-bold">
            <button
              onClick={() => step !== "shipping" && setStep("shipping")}
              className={`flex items-center gap-1.5 ${
                step === "shipping" ? "text-brand-orange" : "text-espresso-800 hover:text-brand-orange"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center">1</span>
              <span>Shipping Address</span>
            </button>
            <ChevronRight size={16} className="text-cream-400" />
            
            <button
              onClick={() => step === "review" && setStep("payment")}
              className={`flex items-center gap-1.5 ${
                step === "payment" ? "text-brand-orange" : "text-espresso-800 hover:text-brand-orange"
              }`}
              disabled={step === "shipping"}
            >
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center">2</span>
              <span>Payment Details</span>
            </button>
            <ChevronRight size={16} className="text-cream-400" />

            <div className={`flex items-center gap-1.5 ${step === "review" ? "text-brand-orange" : "text-espresso-800"}`}>
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center">3</span>
              <span>Review & Place</span>
            </div>
          </div>
        </section>

        {/* Content Panel Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Details */}
            <div className="lg:col-span-8 bg-white border border-cream-300 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              
              {orderErr && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="text-xs sm:text-sm">{orderErr}</span>
                </div>
              )}

              {/* STEP 1: SHIPPING */}
              {step === "shipping" && (
                <div className="space-y-6">
                  <h2 className="font-display font-bold text-brand-purple text-xl">Shipping Address</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase text-brand-purple">Shipping Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      placeholder="Street address, apartment, suite"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">City / Town *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px] text-brand-purple"
                      >
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Puducherry">Puducherry</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-body text-xs font-bold uppercase text-brand-purple">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase text-brand-purple">Delivery Notes (Optional)</label>
                    <textarea
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3"
                      placeholder="Notes for courier delivery instructions"
                    />
                  </div>

                  <div className="pt-4 border-t border-cream-200 flex justify-end">
                    <button
                      onClick={handleNextStep}
                      className="btn-primary text-sm font-bold py-3.5 px-8 rounded-xl min-h-[48px] cursor-pointer"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {step === "payment" && (
                <div className="space-y-6">
                  <h2 className="font-display font-bold text-brand-purple text-xl">Payment Details</h2>

                  <div className="bg-cream-100/30 border border-cream-300 p-4 sm:p-6 rounded-2xl space-y-6">
                    {/* QR Code and Copy UPI ID */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center sm:justify-start">
                      {/* QR Box */}
                      <div className="bg-white p-3 border border-cream-300 rounded-xl shadow-xs inline-flex flex-col items-center shrink-0">
                        <QrCode size={100} className="text-brand-purple" />
                        <span className="font-body text-[0.6rem] font-bold text-brand-purple mt-1 select-none">UPI SCAN CODE</span>
                      </div>

                      {/* Details copy */}
                      <div className="text-center sm:text-left space-y-2.5 min-w-0 w-full">
                        <p className="font-body text-xs font-bold text-brand-orange uppercase tracking-wider">UPI Account Coordinates</p>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                            <span className="font-display font-bold text-brand-purple text-sm sm:text-base break-all bg-white px-3 py-1.5 rounded-lg border border-cream-300 select-all">
                              {upiId}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyUPI}
                              className="inline-flex items-center gap-1 bg-brand-purple hover:bg-brand-purple-light text-white text-[0.7rem] font-bold px-3 py-2 rounded-lg cursor-pointer min-h-[36px]"
                            >
                              <Copy size={12} />
                              <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="font-body text-espresso-900 text-xs font-semibold">
                            Account Holder: <span className="text-brand-purple">Kayal Samayal Spices</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pay via UPI App button */}
                    <div className="pt-2 text-center sm:text-left">
                      <a
                        href={`upi://pay?pa=${upiId}&pn=Kayal%20Samayal%20Spices&am=${grandTotal}&cu=INR`}
                        className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-light text-white text-xs sm:text-sm font-bold py-2.5 px-6 rounded-xl shadow-sm min-h-[44px]"
                      >
                        <ShieldCheck size={16} />
                        <span>Pay via UPI App — Rs. {grandTotal}</span>
                      </a>
                    </div>

                    {/* OR divider */}
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-cream-300"></div>
                      <span className="flex-shrink mx-4 text-espresso-800 text-xs font-bold uppercase tracking-wider">Verification Options</span>
                      <div className="flex-grow border-t border-cream-300"></div>
                    </div>

                    <p className="font-body text-xs text-espresso-800 text-center sm:text-left">
                      Enter your UTR / Transaction ID OR upload your payment screenshot.
                    </p>

                    {/* Option 1: UTR Input */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block font-body text-xs font-bold uppercase text-brand-purple">
                          Option 1: UTR / Transaction ID
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 12-digit UTR Reference Number"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          className="w-full font-body text-sm bg-white border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                        />
                      </div>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-cream-200/50"></div>
                        <span className="flex-shrink mx-4 text-cream-400 text-xs font-bold uppercase tracking-wider">OR</span>
                        <div className="flex-grow border-t border-cream-200/50"></div>
                      </div>

                      {/* Option 2: Payment Screenshot */}
                      <div className="space-y-2.5">
                        <label className="block font-body text-xs font-bold uppercase text-brand-purple">
                          Option 2: Payment Screenshot
                        </label>
                        
                        <div className="flex flex-col items-stretch sm:items-start gap-2">
                          <label className="btn-outline border-2 border-brand-purple text-brand-purple hover:bg-brand-cream/20 font-bold text-xs sm:text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer min-h-[44px]">
                            <Camera size={16} />
                            <span>📷 Upload Payment Screenshot</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="font-body text-[0.65rem] text-espresso-800">
                            Supported: PNG, JPG, JPEG, WEBP. Max size: 5 MB.
                          </span>
                        </div>

                        {/* Screenshot Preview Card */}
                        {paymentScreenshotPreview && (
                          <div className="bg-white border border-cream-300 p-4 rounded-xl shadow-xs max-w-sm space-y-3">
                            <div className="flex justify-between items-center border-b border-cream-200 pb-2">
                              <span className="font-body text-xs font-bold text-brand-purple">Payment Screenshot</span>
                              <button
                                type="button"
                                onClick={handleRemoveScreenshot}
                                className="text-red-500 hover:text-red-700 font-body text-[0.7rem] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Remove</span>
                              </button>
                            </div>
                            <div className="aspect-video bg-cream-50 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-cream-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={paymentScreenshotPreview}
                                alt="Payment Screenshot Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex justify-between text-[0.65rem] text-espresso-800/80 font-mono">
                              <span className="truncate max-w-[200px]">{paymentScreenshot?.name}</span>
                              <span>{paymentScreenshot ? `${(paymentScreenshot.size / 1024).toFixed(0)} KB` : ""}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="pt-4 border-t border-cream-200/50 space-y-1.5">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="mt-1 rounded text-brand-orange focus:ring-brand-orange cursor-pointer shrink-0"
                        />
                        <div className="space-y-0.5">
                          <span className="font-body text-xs sm:text-sm font-bold text-brand-purple">
                            I have completed the UPI payment of Rs. {grandTotal}
                          </span>
                          <span className="block font-body text-[0.65rem] sm:text-xs text-espresso-800 leading-normal">
                            Please make sure your payment was successful before placing the order.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Confirm UPI Payment Button */}
                    <div className="pt-2">
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading || !isChecked || (!utr.trim() && !paymentScreenshot)}
                        className={`btn-primary w-full justify-center text-sm font-bold py-3.5 px-6 rounded-xl flex items-center gap-1.5 min-h-[48px] cursor-pointer ${
                          (loading || !isChecked || (!utr.trim() && !paymentScreenshot)) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Confirming Payment...</span>
                          </>
                        ) : (
                          <span>Confirm Payment & Place Order</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Skip Payment / COD Section */}
                  <div className="border-t border-cream-300 pt-6 space-y-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="font-display font-bold text-brand-purple text-base">Don&apos;t want to pay online?</h3>
                      <p className="font-body text-espresso-800 text-xs sm:text-sm leading-relaxed">
                        Place your order now and pay on delivery or as agreed with Kayal Samayal. We will contact you to confirm your order.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setPaymentMethod("COD");
                        setLoading(true);
                        setOrderErr("");
                        try {
                          const response = await placeOrder("", "COD");
                          if (response && response.success) {
                            router.push("/thank-you");
                          } else {
                            setOrderErr(response?.message || "Failed to submit order. Please try again.");
                          }
                        } catch (e) {
                          console.error(e);
                          setOrderErr("A connection error occurred. Please verify your internet and try again.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="btn-outline w-full justify-center text-brand-purple border-2 border-brand-purple hover:bg-brand-cream/20 text-sm font-bold py-3 px-6 rounded-xl min-h-[48px] cursor-pointer"
                    >
                      {loading ? "Processing..." : "Skip Payment & Place Order"}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-cream-200 flex justify-start">
                    <button
                      onClick={() => setStep("shipping")}
                      className="font-body text-xs sm:text-sm font-bold text-brand-purple hover:underline"
                    >
                      Back to Address
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ORDER REVIEW */}
              {step === "review" && (
                <div className="space-y-6">
                  <h2 className="font-display font-bold text-brand-purple text-xl">Review & Place Order</h2>

                  {/* Read-only Address Coordinates */}
                  <div className="bg-cream-50 p-4 border border-cream-300 rounded-xl space-y-2">
                    <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Shipping Destination</h3>
                    <p className="font-body text-espresso-900 text-sm leading-relaxed">
                      <span className="font-bold text-brand-purple">{customerDetails.name}</span><br />
                      {customerDetails.address}, {customerDetails.city}, {customerDetails.state} – {customerDetails.pincode}<br />
                      Mobile: {customerDetails.mobile} | Email: {customerDetails.email}
                    </p>
                  </div>

                  <div className="bg-cream-50 p-4 border border-cream-300 rounded-xl space-y-2">
                    <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange">Selected Payment Mode</h3>
                    <p className="font-body text-espresso-900 text-sm font-semibold">
                      {paymentMethod === "UPI" ? `Direct UPI Payment (UTR: ${utr})` : "Skip Payment / Cash on Delivery / Pay Later"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-cream-200 flex justify-between items-center">
                    <button
                      onClick={() => setStep("payment")}
                      className="font-body text-xs sm:text-sm font-bold text-brand-purple hover:underline"
                    >
                      Back to Payment
                    </button>
                    
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="btn-primary text-sm font-bold py-3.5 px-8 rounded-xl min-h-[48px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <span>Place Order</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Order Items Summary */}
            <div className="lg:col-span-4 bg-white border border-cream-300 rounded-3xl p-6 shadow-xs space-y-6">
              <h2 className="font-display font-bold text-brand-purple text-lg border-b border-cream-200 pb-4">
                Items Summary
              </h2>

              <div className="space-y-4 divide-y divide-cream-200 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {cart.map((item, idx) => {
                  const price = getProductPrice(item.product);
                  return (
                    <div key={item.product.id} className={`flex gap-3 justify-between items-center ${idx > 0 ? "pt-4" : ""}`}>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-brand-purple text-sm truncate">{item.product.name}</p>
                        <p className="font-body text-espresso-800 text-xs">Qty: {item.quantity} x Rs. {price}</p>
                      </div>
                      <span className="font-display font-bold text-brand-purple text-sm shrink-0">
                        Rs. {price * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-cream-200 pt-6 space-y-3.5">
                <div className="flex justify-between font-body text-sm text-espresso-900">
                  <span>Subtotal</span>
                  <span className="font-bold">Rs. {cartSubtotal}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-espresso-900">
                  <span>Courier Shipping</span>
                  <span className="font-bold">{shipping === 0 ? "FREE" : `Rs. ${shipping}`}</span>
                </div>
                <div className="flex justify-between items-center font-display text-brand-purple pt-2 border-t border-cream-200">
                  <span className="text-base font-bold">Grand Total</span>
                  <span className="text-xl font-black text-brand-orange">Rs. {grandTotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-body text-espresso-800 opacity-60 justify-center">
                <ShieldCheck size={14} className="text-green-600" />
                <span>Secure Manual Verification</span>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
