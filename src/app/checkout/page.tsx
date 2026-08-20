"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, getProductPrice } from "@/context/CartContext";
import { getSettings } from "@/lib/api";
import { ShieldCheck, CreditCard, ChevronRight, CheckCircle, AlertCircle, QrCode, MessageSquare } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [orderErr, setOrderErr] = useState("");

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
      if (!utr.trim()) {
        alert("Please enter the UTR / Transaction ID for manual UPI verification.");
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
      const response = await placeOrder(paymentMethod === "UPI" ? utr : "", paymentMethod);
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
                  <h2 className="font-display font-bold text-brand-purple text-xl">Select Payment Method</h2>
                  
                  <div className="space-y-4">
                    {/* UPI Radio */}
                    <label className="flex items-start gap-3 border border-cream-300 p-4 rounded-xl cursor-pointer hover:bg-cream-100/20 transition-all select-none">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "UPI"}
                        onChange={() => setPaymentMethod("UPI")}
                        className="mt-1 text-brand-orange focus:ring-brand-orange"
                      />
                      <div>
                        <h3 className="font-display font-bold text-brand-purple text-sm sm:text-base">Pay via UPI (Instant Order Dispatch)</h3>
                        <p className="font-body text-espresso-800 text-xs mt-1">
                          Transfer directly using any UPI App (GPay, PhonePe, Paytm). Safe & verified.
                        </p>
                      </div>
                    </label>

                    {/* WhatsApp COD Radio */}
                    <label className="flex items-start gap-3 border border-cream-300 p-4 rounded-xl cursor-pointer hover:bg-cream-100/20 transition-all select-none">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="mt-1 text-brand-orange focus:ring-brand-orange"
                      />
                      <div>
                        <h3 className="font-display font-bold text-brand-purple text-sm sm:text-base">Skip Payment / Cash on Delivery</h3>
                        <p className="font-body text-espresso-800 text-xs mt-1">
                          Order now, verify shipping details, and pay on delivery (or via WhatsApp catalog chat).
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* UPI Details Box */}
                  {paymentMethod === "UPI" && (
                    <div className="bg-cream-100/30 border border-cream-300 p-6 rounded-2xl space-y-6">
                      <div className="flex flex-col md:flex-row items-center gap-6 justify-center md:justify-start">
                        {/* QR Box */}
                        <div className="bg-white p-3.5 border border-cream-300 rounded-xl shadow-xs inline-flex flex-col items-center">
                          <QrCode size={100} className="text-brand-purple" />
                          <span className="font-body text-[0.6rem] font-bold text-brand-purple mt-1 select-none">UPI SCAN CODE</span>
                        </div>

                        {/* Details copy */}
                        <div className="text-center md:text-left space-y-2">
                          <p className="font-body text-xs font-bold text-brand-orange uppercase tracking-wider">UPI Account Coordinates</p>
                          <div className="space-y-1">
                            <p className="font-display font-bold text-brand-purple text-sm sm:text-base">
                              UPI ID: <span className="underline select-all">{upiId}</span>
                            </p>
                            <p className="font-body text-espresso-800 text-xs">
                              Account Holder: <span className="font-semibold text-brand-purple">Kayal Samayal Spices</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* UTR Input Form */}
                      <div className="space-y-4 pt-4 border-t border-cream-200">
                        <div className="space-y-1.5">
                          <label className="block font-body text-xs font-bold uppercase text-brand-purple">
                            UTR / Transaction Reference Number *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter the 12-digit transaction UTR code"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="w-full font-body text-sm bg-white border border-cream-300 rounded-xl px-4 py-3 min-h-[44px]"
                          />
                        </div>

                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="mt-0.5 rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                          />
                          <span className="font-body text-xs sm:text-sm text-espresso-900 leading-normal">
                            I confirm that I have transferred <span className="font-bold text-brand-purple">Rs. {grandTotal}</span> to the above UPI address.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-cream-200 flex justify-between items-center">
                    <button
                      onClick={() => setStep("shipping")}
                      className="font-body text-xs sm:text-sm font-bold text-brand-purple hover:underline"
                    >
                      Back to Address
                    </button>
                    <button
                      onClick={() => setStep("review")}
                      className="btn-primary text-sm font-bold py-3.5 px-8 rounded-xl min-h-[48px]"
                    >
                      Review Order Details
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
