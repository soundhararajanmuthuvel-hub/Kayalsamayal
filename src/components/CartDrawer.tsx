"use client";

import React, { useState } from "react";
import {
  X, Plus, Minus, Trash2, ShoppingBag, CheckCircle,
  ArrowLeft, MessageCircle, Copy, Check, Smartphone, PackageCheck,
} from "lucide-react";
import { useCart, getProductPrice } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

// ── CONFIG ────────────────────────────────────────────────────────────────────

const UPI_ID          = process.env.NEXT_PUBLIC_UPI_ID || "";
const BUSINESS_NAME   = "Kayal Samayal";
const WHATSAPP_NUMBER = "919003860616";

// Must match backend Settings defaults exactly
const SHIPPING_CHARGE         = 60;
const FREE_SHIPPING_THRESHOLD = 500;
const DEFAULT_GST_RATE        = 0.05;

// ── STATES ────────────────────────────────────────────────────────────────────

const STATES = [
  "Tamil Nadu", "Puducherry", "Karnataka", "Kerala",
  "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi", "Other State",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function calcTotals(sub: number) {
  const gst      = Math.round(sub * DEFAULT_GST_RATE * 100) / 100;
  const shipping = sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  return { gst, shipping, grandTotal: sub + gst + shipping };
}

function buildUpiIntent(upiId: string, amount: number) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${amount.toFixed(2)}&cu=INR`;
}

function buildQrUrl(intent: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(intent)}`;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function CartDrawer() {
  const {
    cart, removeFromCart, updateQuantity, clearCart,
    cartCount, cartSubtotal,
    isCartOpen, setIsCartOpen,
    customerDetails, setCustomerDetails,
    checkoutStep, setCheckoutStep,
    placeOrder, lastOrderResponse,
  } = useCart();

  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  // UPI payment state
  const [utr,              setUtr]              = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [utrError,         setUtrError]         = useState("");
  const [upiCopied,        setUpiCopied]        = useState(false);

  // Computed totals
  const { gst, shipping, grandTotal } = calcTotals(cartSubtotal);
  const upiIntent = UPI_ID ? buildUpiIntent(UPI_ID, grandTotal) : "";
  const qrUrl     = UPI_ID ? buildQrUrl(upiIntent) : "";

  // ── FORM HANDLERS ─────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setCustomerDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => { const c = { ...prev }; delete c[e.target.name]; return c; });
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customerDetails.name.trim()) errs.name = "Name is required";
    if (!customerDetails.mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(customerDetails.mobile.trim())) {
      errs.mobile = "Please enter a valid 10-digit mobile number";
    }
    if (customerDetails.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    if (!customerDetails.address.trim()) errs.address = "Address is required";
    if (!customerDetails.city.trim())    errs.city    = "City/Town is required";
    if (!customerDetails.state.trim())   errs.state   = "State is required";
    if (!customerDetails.pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(customerDetails.pincode.trim())) {
      errs.pincode = "Please enter a valid 6-digit pincode";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Continue to payment step
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCheckoutError(null);
    setUtr("");
    setPaymentConfirmed(false);
    setUtrError("");
    setCheckoutStep("payment");
  };

  // UPI Payment — requires UTR + checkbox
  const handleUpiSubmit = async () => {
    if (isSubmitting) return;
    const trimmedUtr = utr.trim();
    if (!trimmedUtr)        { setUtrError("Please enter your UTR / Transaction ID"); return; }
    if (!paymentConfirmed)  { setUtrError("Please confirm that you have completed the UPI payment"); return; }
    setUtrError("");
    setIsSubmitting(true);
    setCheckoutError(null);
    const res = await placeOrder(trimmedUtr, "UPI");
    if (res && !res.success) setCheckoutError(res.message || "Something went wrong. Please try again.");
    setIsSubmitting(false);
  };

  // Skip Payment / COD — no UTR or checkbox needed
  const handleSkipPayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError(null);
    const res = await placeOrder("", "COD");
    if (res && !res.success) setCheckoutError(res.message || "Something went wrong. Please try again.");
    setIsSubmitting(false);
  };

  const handleCopyUpiId = async () => {
    if (!UPI_ID) return;
    try { await navigator.clipboard.writeText(UPI_ID); }
    catch {
      const el = document.createElement("input");
      el.value = UPI_ID; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  // WhatsApp message for confirm screen
  const buildWhatsAppMsg = () => {
    if (!lastOrderResponse) return "";
    const isCod = lastOrderResponse.paymentMethod === "COD / Pay Later";
    const itemsList = lastOrderResponse.items?.map(i => `${i.productName} ×${i.quantity}`).join(", ") || "";
    const lines = [
      `Hi ${BUSINESS_NAME}! I just placed an order.`,
      ``,
      `Order ID: ${lastOrderResponse.orderId}`,
      `Customer: ${customerDetails.name}`,
      `Items: ${itemsList}`,
      `Grand Total: Rs. ${lastOrderResponse.grandTotal}`,
      `Payment: ${lastOrderResponse.paymentMethod || "—"}`,
      `Status: ${lastOrderResponse.paymentStatus || "—"}`,
    ];
    if (!isCod && lastOrderResponse.utr) lines.push(`UTR: ${lastOrderResponse.utr}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const headerLabel =
    checkoutStep === "checkout" ? "Delivery Details" :
    checkoutStep === "payment"  ? "Payment"           :
    checkoutStep === "confirm"  ? "Order Confirmed"   :
    "Your Shopping Cart";

  const isCodConfirm = lastOrderResponse?.paymentMethod === "COD / Pay Later";

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Cart Button */}
      {!isCartOpen && cartCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gold-600 hover:bg-gold-700 text-espresso-950 p-4 rounded-full shadow-lg flex items-center justify-center transition-colors min-h-[56px] min-w-[56px] cursor-pointer border border-gold-500/20"
          aria-label={`Open cart (${cartCount} items)`}
        >
          <ShoppingBag size={22} />
          <span className="absolute -top-1 -right-1 bg-rust-600 text-cream-50 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-cream-50">
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => checkoutStep !== "loading" && setIsCartOpen(false)}
              className="absolute inset-0 bg-espresso-950/80 backdrop-blur-xs"
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16">
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-cream-50 shadow-2xl flex flex-col h-full border-l border-gold-600/10"
              >
                {/* Header */}
                <div className="px-4 py-5 bg-espresso-950 text-cream-100 flex items-center justify-between border-b border-gold-600/20">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-gold-400" size={20} />
                    <span className="font-display font-bold text-lg">{headerLabel}</span>
                  </div>
                  <button
                    disabled={checkoutStep === "loading"}
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-full text-cream-400 hover:text-cream-100 hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-5">

                  {/* ── CART ─────────────────────────────────────────────── */}
                  {checkoutStep === "cart" && (
                    <>
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <ShoppingBag size={48} className="text-cream-400 opacity-60 mb-4" />
                          <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">Your cart is empty</h3>
                          <p className="font-body text-espresso-800/60 text-sm mb-6">Explore our heritage spice blends and masalas.</p>
                          <button onClick={() => setIsCartOpen(false)} className="btn-primary py-2 px-6 text-sm">Start Shopping</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cart.map(item => {
                            const price     = getProductPrice(item.product);
                            const isPremium = item.product.tier === "premium";
                            return (
                              <div key={item.product.id} className={`flex items-center gap-3 p-3 bg-white rounded-xl border shadow-xs ${isPremium ? "border-gold-500/20" : "border-cream-300"}`}>
                                <div className="w-16 h-16 bg-cream-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-cream-200">
                                  {item.product.image
                                    ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                                    : <ShoppingBag size={20} className="text-cream-400 opacity-60" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-display font-semibold text-espresso-900 text-sm truncate">{item.product.name}</h4>
                                  <span className={`inline-block text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-0.5 ${isPremium ? "bg-gold-600/10 text-gold-700" : "bg-cream-200 text-espresso-800"}`}>
                                    {isPremium ? "Premium" : "Regular"}
                                  </span>
                                  <div className="font-body text-xs font-bold text-espresso-900 mt-1">Rs. {price}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center border border-cream-300 rounded-lg bg-cream-50 overflow-hidden">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 text-espresso-800 hover:bg-cream-200 transition-colors" aria-label="Decrease"><Minus size={14} /></button>
                                    <span className="px-2 font-body text-xs font-bold text-espresso-900">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 text-espresso-800 hover:bg-cream-200 transition-colors" aria-label="Increase"><Plus size={14} /></button>
                                  </div>
                                  <button onClick={() => removeFromCart(item.product.id)} className="text-espresso-800/40 hover:text-rust-500 transition-colors p-1" aria-label="Remove"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── CHECKOUT (Delivery Details) ───────────────────────── */}
                  {checkoutStep === "checkout" && (
                    <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                      <button type="button" onClick={() => setCheckoutStep("cart")} className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700 transition-colors mb-1">
                        <ArrowLeft size={14} /> Back to Cart
                      </button>

                      {checkoutError && (
                        <div className="bg-red-50 text-rust-600 border border-red-200 text-xs px-3 py-2 rounded-lg font-semibold">{checkoutError}</div>
                      )}

                      <div>
                        <label htmlFor="chk-name" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Full Name <span className="text-rust-500">*</span></label>
                        <input id="chk-name" name="name" type="text" value={customerDetails.name} onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.name ? "border-rust-500" : "border-cream-300"}`}
                          placeholder="e.g. Ahamed Kabeer" />
                        {errors.name && <p className="text-rust-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-mobile" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Mobile <span className="text-rust-500">*</span></label>
                          <input id="chk-mobile" name="mobile" type="tel" value={customerDetails.mobile} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.mobile ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="10-digit mobile" />
                          {errors.mobile && <p className="text-rust-500 text-xs mt-1">{errors.mobile}</p>}
                        </div>
                        <div>
                          <label htmlFor="chk-email" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Email</label>
                          <input id="chk-email" name="email" type="email" value={customerDetails.email} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.email ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="email@example.com" />
                          {errors.email && <p className="text-rust-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="chk-address" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Shipping Address <span className="text-rust-500">*</span></label>
                        <textarea id="chk-address" name="address" rows={2} value={customerDetails.address} onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none ${errors.address ? "border-rust-500" : "border-cream-300"}`}
                          placeholder="House/Plot No, Street, Locality" />
                        {errors.address && <p className="text-rust-500 text-xs mt-1">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label htmlFor="chk-city" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">City <span className="text-rust-500">*</span></label>
                          <input id="chk-city" name="city" type="text" value={customerDetails.city} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.city ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="City" />
                          {errors.city && <p className="text-rust-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div className="col-span-1">
                          <label htmlFor="chk-state" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">State <span className="text-rust-500">*</span></label>
                          <select id="chk-state" name="state" value={customerDetails.state} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-2 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.state ? "border-rust-500" : "border-cream-300"}`}>
                            <option value="">State</option>
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {errors.state && <p className="text-rust-500 text-xs mt-1">{errors.state}</p>}
                        </div>
                        <div className="col-span-1">
                          <label htmlFor="chk-pincode" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Pincode <span className="text-rust-500">*</span></label>
                          <input id="chk-pincode" name="pincode" type="text" value={customerDetails.pincode} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.pincode ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="6 digits" />
                          {errors.pincode && <p className="text-rust-500 text-xs mt-1">{errors.pincode}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="chk-notes" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">Order Notes (Optional)</label>
                        <textarea id="chk-notes" name="notes" rows={2} value={customerDetails.notes} onChange={handleInputChange}
                          className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none"
                          placeholder="Special delivery instructions..." />
                      </div>
                    </form>
                  )}

                  {/* ── PAYMENT ───────────────────────────────────────────── */}
                  {checkoutStep === "payment" && (
                    <div className="space-y-5">
                      <button type="button" onClick={() => setCheckoutStep("checkout")} className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700 transition-colors">
                        <ArrowLeft size={14} /> Back to Delivery Details
                      </button>

                      {/* Order Total Summary */}
                      <div className="bg-espresso-950 text-cream-100 rounded-xl p-4 space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-2">Order Summary</div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>Subtotal</span><span>Rs. {cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>GST (5%)</span><span>Rs. {gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>Shipping</span>
                          <span>{shipping === 0 ? <span className="text-green-400 font-bold">FREE</span> : `Rs. ${shipping}`}</span>
                        </div>
                        <div className="border-t border-gold-600/30 pt-2 flex justify-between font-body font-bold text-gold-400 text-base">
                          <span>Grand Total</span><span>Rs. {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* ═══ PRIMARY: UPI PAYMENT ═══ */}
                      <div className="bg-white rounded-xl border-2 border-amber-300 overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone size={18} className="text-amber-600" />
                            <div>
                              <span className="font-display font-bold text-espresso-900 text-sm">Pay via UPI</span>
                              <span className="ml-2 text-[0.65rem] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Recommended</span>
                            </div>
                          </div>
                          <span className="text-xs text-espresso-800/50 font-body">Fast &amp; convenient</span>
                        </div>

                        <div className="p-4 space-y-4">
                          {!UPI_ID ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                              <p className="font-body text-xs text-amber-800">UPI payment not configured yet. Use Skip Payment below.</p>
                            </div>
                          ) : (
                            <>
                              {/* UPI ID + Copy */}
                              <div>
                                <p className="font-body text-xs text-espresso-800/60 uppercase tracking-wider mb-1.5">UPI ID</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2.5 font-body text-sm font-bold text-espresso-900 select-all">
                                    {UPI_ID}
                                  </div>
                                  <button id="copy-upi-id-btn" onClick={handleCopyUpiId}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${upiCopied ? "bg-green-100 border-green-400 text-green-700" : "bg-white border-cream-300 text-espresso-800 hover:bg-cream-100"}`}
                                    aria-label="Copy UPI ID">
                                    {upiCopied ? <><Check size={13} />Copied!</> : <><Copy size={13} />Copy</>}
                                  </button>
                                </div>
                              </div>

                              {/* QR */}
                              <div className="flex flex-col items-center gap-1.5">
                                <p className="font-body text-xs text-espresso-800/60 uppercase tracking-wider self-start">Scan QR to Pay</p>
                                <div className="bg-white border-2 border-cream-200 rounded-xl p-2 shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={qrUrl} alt={`UPI QR — Rs. ${grandTotal.toFixed(2)}`} width={200} height={200} className="block" loading="lazy" />
                                </div>
                                <p className="font-body text-[0.65rem] text-espresso-800/50">Amount: Rs. {grandTotal.toFixed(2)}</p>
                              </div>

                              {/* Pay via App */}
                              <a id="pay-upi-app-btn" href={upiIntent}
                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">
                                <Smartphone size={16} /> Pay via UPI App — Rs. {grandTotal.toFixed(2)}
                              </a>
                              <p className="font-body text-[0.65rem] text-espresso-800/50 text-center -mt-2">
                                Opens GPay, PhonePe, Paytm, or your default UPI app
                              </p>
                            </>
                          )}

                          {/* UTR input */}
                          <div>
                            <label htmlFor="utr-input" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1.5">
                              UTR / Transaction ID <span className="text-rust-500">*</span>
                            </label>
                            <input id="utr-input" type="text" value={utr}
                              onChange={e => { setUtr(e.target.value); if (utrError) setUtrError(""); }}
                              className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${utrError ? "border-rust-500" : "border-cream-300"}`}
                              placeholder="Enter UTR or Transaction Reference ID" autoComplete="off" />
                            <p className="font-body text-[0.67rem] text-espresso-800/50 mt-1">Find this in your UPI app after payment.</p>
                          </div>

                          {/* Confirmation checkbox */}
                          <label id="payment-confirm-checkbox-label" className="flex items-start gap-3 cursor-pointer group">
                            <input id="payment-confirmed-checkbox" type="checkbox" checked={paymentConfirmed}
                              onChange={e => { setPaymentConfirmed(e.target.checked); if (utrError) setUtrError(""); }}
                              className="mt-0.5 w-4 h-4 accent-gold-600 cursor-pointer flex-shrink-0" />
                            <span className="font-body text-sm text-espresso-900 group-hover:text-espresso-700 leading-snug">
                              I have completed the UPI payment of <strong>Rs. {grandTotal.toFixed(2)}</strong> and the UTR above is correct.
                            </span>
                          </label>

                          {/* Error */}
                          {(utrError || checkoutError) && (
                            <div className="bg-red-50 border border-red-200 text-rust-600 text-xs px-3 py-2.5 rounded-lg font-semibold">
                              {utrError || checkoutError}
                            </div>
                          )}

                          {/* UPI Submit button */}
                          <button id="confirm-upi-payment-btn" onClick={handleUpiSubmit}
                            disabled={isSubmitting || !utr.trim() || !paymentConfirmed}
                            className="w-full py-3.5 px-4 bg-espresso-950 hover:bg-espresso-900 text-cream-50 font-display font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                            {isSubmitting
                              ? <><span className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />Processing...</>
                              : <><CheckCircle size={17} />Confirm UPI Payment &amp; Place Order</>
                            }
                          </button>
                        </div>
                      </div>

                      {/* ═══ DIVIDER ═══ */}
                      <div className="relative flex items-center">
                        <div className="flex-grow border-t border-cream-300" />
                        <span className="mx-4 text-xs font-body text-espresso-800/50 uppercase tracking-widest font-bold">OR</span>
                        <div className="flex-grow border-t border-cream-300" />
                      </div>

                      {/* ═══ SECONDARY: SKIP PAYMENT ═══ */}
                      <div className="bg-cream-100 border border-cream-300 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <PackageCheck size={18} className="text-espresso-800/60" />
                          <span className="font-display font-semibold text-espresso-900 text-sm">Don't want to pay online?</span>
                        </div>
                        <p className="font-body text-xs text-espresso-800/70 leading-relaxed">
                          No problem! Place your order now and pay on delivery or as agreed with Kayal Samayal.
                          We will contact you to confirm your order.
                        </p>
                        <button id="skip-payment-btn" onClick={handleSkipPayment}
                          disabled={isSubmitting}
                          className="w-full py-3 px-4 bg-white hover:bg-cream-50 text-espresso-900 font-body font-bold text-sm rounded-xl border-2 border-cream-300 hover:border-espresso-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm">
                          {isSubmitting
                            ? <><span className="w-4 h-4 border-2 border-espresso-900 border-t-transparent rounded-full animate-spin" />Placing Order...</>
                            : <><PackageCheck size={17} />Skip Payment &amp; Place Order</>
                          }
                        </button>
                        <p className="font-body text-[0.65rem] text-espresso-800/50 text-center">
                          Payment Method: Cash on Delivery / Pay Later · Payment Status: Pending
                        </p>
                      </div>

                    </div>
                  )}

                  {/* ── LOADING ───────────────────────────────────────────── */}
                  {checkoutStep === "loading" && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-12 h-12 border-4 border-gold-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">Placing Your Order</h3>
                      <p className="font-body text-espresso-800/60 text-sm">Saving your order details...</p>
                    </div>
                  )}

                  {/* ── CONFIRM ───────────────────────────────────────────── */}
                  {checkoutStep === "confirm" && lastOrderResponse && (
                    <div className="flex flex-col items-center text-center p-2 space-y-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isCodConfirm ? "bg-blue-100" : "bg-green-100"}`}>
                        <CheckCircle size={36} className={isCodConfirm ? "text-blue-600" : "text-green-600"} />
                      </div>

                      <div>
                        <h3 className="font-display text-xl font-bold text-espresso-900">Order Placed Successfully!</h3>
                        <p className="font-body text-espresso-800/70 text-sm mt-1 max-w-xs mx-auto">
                          {isCodConfirm
                            ? "Your order is confirmed. We will contact you to arrange delivery and payment."
                            : "Your UPI payment is pending verification. We'll process your order once confirmed."
                          }
                        </p>
                      </div>

                      {/* Order Card */}
                      <div className="w-full bg-cream-100 border border-cream-300 rounded-xl p-4 text-left space-y-2">
                        <div className="text-[0.65rem] text-espresso-800/60 font-body uppercase tracking-wider">Order Reference</div>
                        <div className="font-display font-bold text-base text-gold-700">{lastOrderResponse.orderId || "—"}</div>

                        <div className="border-t border-cream-300/70 pt-2 grid grid-cols-2 gap-y-1.5 text-xs font-body">
                          <span className="text-espresso-800/60">Customer</span>
                          <span className="font-bold text-right truncate">{customerDetails.name}</span>

                          <span className="text-espresso-800/60">Payment</span>
                          <span className="font-bold text-right">{lastOrderResponse.paymentMethod || "—"}</span>

                          <span className="text-espresso-800/60">Status</span>
                          <span className={`font-bold text-right ${isCodConfirm ? "text-blue-700" : "text-amber-700"}`}>
                            {lastOrderResponse.paymentStatus || "—"}
                          </span>

                          {!isCodConfirm && lastOrderResponse.utr && (
                            <>
                              <span className="text-espresso-800/60">UTR</span>
                              <span className="font-bold text-right text-espresso-900 break-all">{lastOrderResponse.utr}</span>
                            </>
                          )}

                          <span className="text-espresso-800/60">Grand Total</span>
                          <span className="font-bold text-right">Rs. {lastOrderResponse.grandTotal ?? cartSubtotal}</span>

                          {lastOrderResponse.emailSent === false && (
                            <span className="col-span-2 text-[0.65rem] italic text-espresso-800/50 pt-1">
                              ⚠️ Order saved · Confirmation email could not be sent. Contact via WhatsApp.
                            </span>
                          )}
                        </div>
                      </div>

                      {isCodConfirm && (
                        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-left">
                          <p className="font-body text-xs text-blue-800 leading-relaxed">
                            <strong>Payment Method:</strong> Cash on Delivery / Pay Later<br />
                            <strong>Payment Status:</strong> Pending<br />
                            Payment can be completed when your order is delivered, or as agreed with Kayal Samayal.
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 w-full">
                        <a id="whatsapp-order-details-btn"
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMsg()}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-whatsapp w-full justify-center py-3 text-sm flex items-center gap-2">
                          <MessageCircle size={16} />WhatsApp Order Details
                        </a>
                        <button id="continue-shopping-btn"
                          onClick={() => { setCheckoutStep("cart"); setIsCartOpen(false); }}
                          className="btn-primary w-full py-3 cursor-pointer">
                          Continue Shopping
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── FOOTER (cart + checkout steps only) ────────────────── */}
                {cart.length > 0 && checkoutStep !== "confirm" && checkoutStep !== "loading" && checkoutStep !== "payment" && (
                  <div className="border-t border-cream-300 p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between font-body text-sm font-bold text-espresso-900">
                      <span>Subtotal:</span>
                      <span>Rs. {cartSubtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-[0.68rem] text-espresso-800/50 font-body -mt-1">
                      {cartSubtotal >= FREE_SHIPPING_THRESHOLD
                        ? "🎉 You qualify for free shipping!"
                        : `Add Rs. ${(FREE_SHIPPING_THRESHOLD - cartSubtotal).toFixed(0)} more for free shipping`}
                    </p>
                    {checkoutStep === "cart" ? (
                      <button id="proceed-to-checkout-btn" onClick={() => setCheckoutStep("checkout")}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        Proceed to Checkout
                      </button>
                    ) : (
                      <button id="continue-to-payment-btn" type="submit" form="checkout-form"
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer">
                        Continue to Payment →
                      </button>
                    )}
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
