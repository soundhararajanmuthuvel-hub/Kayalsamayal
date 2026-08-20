"use client";

import React, { useState } from "react";
import {
  X, Plus, Minus, Trash2, ShoppingBag, CheckCircle,
  ArrowLeft, MessageCircle, Copy, Check, Smartphone, QrCode,
} from "lucide-react";
import { useCart, getProductPrice } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

// ── CONFIG ────────────────────────────────────────────────────────────────────

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "";
const BUSINESS_NAME = "Kayal Samayal";
const WHATSAPP_NUMBER = "919003860616";

// Frontend shipping / GST defaults — must match backend Settings defaults
const SHIPPING_CHARGE        = 60;
const FREE_SHIPPING_THRESHOLD = 500;
const DEFAULT_GST_RATE       = 0.05; // 5%

// ── STATES LIST ───────────────────────────────────────────────────────────────

const STATES = [
  "Tamil Nadu", "Puducherry", "Karnataka", "Kerala",
  "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi", "Other State",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function calcTotals(cartSubtotal: number) {
  const gstAmount  = Math.round(cartSubtotal * DEFAULT_GST_RATE * 100) / 100;
  const shipping   = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const grandTotal = cartSubtotal + gstAmount + shipping;
  return { gstAmount, shipping, grandTotal };
}

function buildUpiIntent(upiId: string, amount: number): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${amount.toFixed(2)}&cu=INR`;
}

function buildQrUrl(upiIntent: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiIntent)}`;
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

  // Form state
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  // Payment step state
  const [utr,              setUtr]              = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [utrError,         setUtrError]         = useState("");
  const [upiCopied,        setUpiCopied]        = useState(false);

  // ── Computed totals (client-side estimate matching backend defaults)
  const { gstAmount, shipping, grandTotal } = calcTotals(cartSubtotal);

  // ── UPI intent & QR
  const upiIntent = UPI_ID ? buildUpiIntent(UPI_ID, grandTotal) : "";
  const qrUrl     = UPI_ID ? buildQrUrl(upiIntent) : "";

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setCustomerDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => { const c = { ...prev }; delete c[e.target.name]; return c; });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!customerDetails.name.trim())   newErrors.name = "Name is required";

    const mobilePattern = /^[6-9]\d{9}$/;
    if (!customerDetails.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!mobilePattern.test(customerDetails.mobile.trim())) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (customerDetails.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(customerDetails.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!customerDetails.address.trim()) newErrors.address = "Address is required";
    if (!customerDetails.city.trim())    newErrors.city    = "City/Town is required";
    if (!customerDetails.state.trim())   newErrors.state   = "State selection is required";

    const pincodePattern = /^\d{6}$/;
    if (!customerDetails.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!pincodePattern.test(customerDetails.pincode.trim())) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // "Continue to Payment" — validate form, then go to payment step
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCheckoutError(null);
    setUtr("");
    setPaymentConfirmed(false);
    setUtrError("");
    setCheckoutStep("payment");
  };

  // "Confirm Payment & Place Order"
  const handlePaymentSubmit = async () => {
    if (isSubmitting) return;
    const trimmedUtr = utr.trim();
    if (!trimmedUtr) { setUtrError("Please enter your UTR / Transaction ID"); return; }
    if (!paymentConfirmed) { setUtrError("Please confirm that you have completed the UPI payment"); return; }
    setUtrError("");
    setIsSubmitting(true);
    setCheckoutError(null);
    const response = await placeOrder(trimmedUtr);
    if (response && !response.success) {
      setCheckoutError(response.message || "Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleCopyUpiId = async () => {
    if (!UPI_ID) return;
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("input");
      el.value = UPI_ID;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2000);
    }
  };

  // WhatsApp message for confirm screen
  const buildWhatsAppMsg = () => {
    if (!lastOrderResponse) return "";
    const itemsList = lastOrderResponse.items?.map(i => `${i.productName} ×${i.quantity}`).join(", ") || "";
    return encodeURIComponent(
      `Hi ${BUSINESS_NAME}! I just placed a UPI order.\n\n` +
      `Order ID: ${lastOrderResponse.orderId}\n` +
      `Customer: ${customerDetails.name}\n` +
      `Items: ${itemsList}\n` +
      `Grand Total: Rs. ${lastOrderResponse.grandTotal}\n` +
      `Payment: ${lastOrderResponse.paymentMethod || "UPI"}\n` +
      `UTR: ${lastOrderResponse.utr || "—"}\n` +
      `Payment Status: ${lastOrderResponse.paymentStatus || "Pending Verification"}`
    );
  };

  // ── Drawer header label
  const headerLabel =
    checkoutStep === "checkout" ? "Delivery Details" :
    checkoutStep === "payment"  ? "UPI Payment"       :
    checkoutStep === "confirm"  ? "Order Confirmed"   :
    "Your Shopping Cart";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Cart Button */}
      {!isCartOpen && cartCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gold-600 hover:bg-gold-700 text-espresso-950 p-4 rounded-full shadow-lg flex items-center justify-center transition-colors min-h-[56px] min-w-[56px] cursor-pointer border border-gold-500/20"
          aria-label={`Open shopping cart (${cartCount} items)`}
        >
          <ShoppingBag size={22} />
          <span className="absolute -top-1 -right-1 bg-rust-600 text-cream-50 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-cream-50">
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => checkoutStep !== "loading" && setIsCartOpen(false)}
              className="absolute inset-0 bg-espresso-950/80 backdrop-blur-xs"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-cream-50 shadow-2xl flex flex-col h-full border-l border-gold-600/10"
              >
                {/* Header */}
                <div className="px-4 py-6 bg-espresso-950 text-cream-100 flex items-center justify-between border-b border-gold-600/20">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-gold-400" size={20} />
                    <span className="font-display font-bold text-lg">{headerLabel}</span>
                  </div>
                  <button
                    disabled={checkoutStep === "loading"}
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-full text-cream-400 hover:text-cream-100 hover:bg-white/10 transition-colors focus:outline-none"
                    aria-label="Close cart"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-6">

                  {/* ── CART STEP ─────────────────────────────────────────── */}
                  {checkoutStep === "cart" && (
                    <>
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <ShoppingBag size={48} className="text-cream-400 opacity-60 mb-4" />
                          <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">Your cart is empty</h3>
                          <p className="font-body text-espresso-800/60 text-sm max-w-xs mb-6">
                            Explore our heritage spice blends, masalas, and health mixes to add them to your cart.
                          </p>
                          <button onClick={() => setIsCartOpen(false)} className="btn-primary py-2 px-6 text-sm">
                            Start Shopping
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map((item) => {
                            const itemPrice = getProductPrice(item.product);
                            const isPremium = item.product.tier === "premium";
                            return (
                              <div
                                key={item.product.id}
                                className={`flex items-center gap-3 p-3 bg-white rounded-xl border shadow-xs transition-colors ${
                                  isPremium ? "border-gold-500/20 bg-gold-50/5" : "border-cream-300"
                                }`}
                              >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 bg-cream-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-cream-200">
                                  {item.product.image ? (
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <ShoppingBag size={20} className="text-cream-400 opacity-60" />
                                  )}
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-display font-semibold text-espresso-900 text-sm truncate leading-snug">
                                    {item.product.name}
                                  </h4>
                                  <span className={`inline-block text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-0.5 ${
                                    isPremium ? "bg-gold-600/10 text-gold-700" : "bg-cream-200 text-espresso-800"
                                  }`}>
                                    {isPremium ? "Premium" : "Regular"}
                                  </span>
                                  <div className="font-body text-xs font-bold text-espresso-900 mt-1">Rs. {itemPrice}</div>
                                </div>
                                {/* Quantity controls */}
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center border border-cream-300 rounded-lg bg-cream-50 overflow-hidden">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 text-espresso-800 hover:bg-cream-200 active:bg-cream-300 transition-colors" aria-label="Decrease quantity">
                                      <Minus size={14} />
                                    </button>
                                    <span className="px-2 font-body text-xs font-bold text-espresso-900">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 text-espresso-800 hover:bg-cream-200 active:bg-cream-300 transition-colors" aria-label="Increase quantity">
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                  <button onClick={() => removeFromCart(item.product.id)} className="text-espresso-800/40 hover:text-rust-500 transition-colors p-1" aria-label="Remove item">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── CHECKOUT STEP ─────────────────────────────────────── */}
                  {checkoutStep === "checkout" && (
                    <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                      <button type="button" onClick={() => setCheckoutStep("cart")} className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700 mb-2 transition-colors">
                        <ArrowLeft size={14} /> Back to Cart
                      </button>

                      <h3 className="font-display font-bold text-espresso-900 text-base border-b border-cream-300 pb-2">
                        Customer Information
                      </h3>

                      {checkoutError && (
                        <div className="bg-red-50 text-rust-600 border border-red-200 text-xs px-3 py-2 rounded-lg font-body font-semibold">
                          {checkoutError}
                        </div>
                      )}

                      {/* Name */}
                      <div>
                        <label htmlFor="chk-name" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Full Name <span className="text-rust-500">*</span>
                        </label>
                        <input id="chk-name" name="name" type="text" value={customerDetails.name} onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.name ? "border-rust-500" : "border-cream-300"}`}
                          placeholder="e.g. Ahamed Kabeer" />
                        {errors.name && <p className="text-rust-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      {/* Mobile & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-mobile" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                            Mobile No <span className="text-rust-500">*</span>
                          </label>
                          <input id="chk-mobile" name="mobile" type="tel" value={customerDetails.mobile} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.mobile ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="e.g. 9876543210" />
                          {errors.mobile && <p className="text-rust-500 text-xs mt-1">{errors.mobile}</p>}
                        </div>
                        <div>
                          <label htmlFor="chk-email" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                            Email Address
                          </label>
                          <input id="chk-email" name="email" type="email" value={customerDetails.email} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.email ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="e.g. name@example.com" />
                          {errors.email && <p className="text-rust-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label htmlFor="chk-address" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Shipping Address <span className="text-rust-500">*</span>
                        </label>
                        <textarea id="chk-address" name="address" rows={2} value={customerDetails.address} onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none ${errors.address ? "border-rust-500" : "border-cream-300"}`}
                          placeholder="House/Plot No, Street, Locality" />
                        {errors.address && <p className="text-rust-500 text-xs mt-1">{errors.address}</p>}
                      </div>

                      {/* City, State, Pincode */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="chk-city" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                            City/Town <span className="text-rust-500">*</span>
                          </label>
                          <input id="chk-city" name="city" type="text" value={customerDetails.city} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.city ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="e.g. Tirupattur" />
                          {errors.city && <p className="text-rust-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <label htmlFor="chk-state" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                            State <span className="text-rust-500">*</span>
                          </label>
                          <select id="chk-state" name="state" value={customerDetails.state} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-2 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.state ? "border-rust-500" : "border-cream-300"}`}>
                            <option value="">Select State</option>
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {errors.state && <p className="text-rust-500 text-xs mt-1">{errors.state}</p>}
                        </div>
                        <div>
                          <label htmlFor="chk-pincode" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                            Pincode <span className="text-rust-500">*</span>
                          </label>
                          <input id="chk-pincode" name="pincode" type="text" value={customerDetails.pincode} onChange={handleInputChange}
                            className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${errors.pincode ? "border-rust-500" : "border-cream-300"}`}
                            placeholder="6 digits" />
                          {errors.pincode && <p className="text-rust-500 text-xs mt-1">{errors.pincode}</p>}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="chk-notes" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Order Notes (Optional)
                        </label>
                        <textarea id="chk-notes" name="notes" rows={2} value={customerDetails.notes} onChange={handleInputChange}
                          className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none"
                          placeholder="Any special instructions for delivery..." />
                      </div>
                    </form>
                  )}

                  {/* ── PAYMENT STEP ──────────────────────────────────────── */}
                  {checkoutStep === "payment" && (
                    <div className="space-y-5">
                      <button type="button" onClick={() => setCheckoutStep("checkout")} className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700 transition-colors">
                        <ArrowLeft size={14} /> Back to Customer Details
                      </button>

                      {/* Order Total Summary */}
                      <div className="bg-espresso-950 text-cream-100 rounded-xl p-4 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">Order Summary</div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>Subtotal</span>
                          <span>Rs. {cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>GST (5%)</span>
                          <span>Rs. {gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-body text-sm text-cream-300">
                          <span>Shipping</span>
                          <span>{shipping === 0 ? <span className="text-green-400 font-bold">FREE</span> : `Rs. ${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="border-t border-gold-600/30 pt-2 flex justify-between font-body text-base font-bold text-gold-400">
                          <span>Grand Total</span>
                          <span>Rs. {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* UPI Payment Section */}
                      <div className="bg-white rounded-xl border border-cream-300 overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
                          <Smartphone size={18} className="text-amber-600" />
                          <span className="font-display font-bold text-espresso-900 text-base">Pay via UPI</span>
                        </div>

                        <div className="p-4 space-y-4">
                          {!UPI_ID ? (
                            /* UPI not configured */
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                              <p className="font-body text-sm text-rust-700 font-semibold mb-1">UPI Payment Not Configured</p>
                              <p className="font-body text-xs text-rust-600/80">
                                The UPI ID has not been set up yet. Please contact us via WhatsApp to place your order.
                              </p>
                              <a
                                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Kayal Samayal! I'd like to place an order. Total: Rs. ${grandTotal.toFixed(2)}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="btn-whatsapp mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm"
                              >
                                <MessageCircle size={16} /> Order via WhatsApp
                              </a>
                            </div>
                          ) : (
                            <>
                              {/* UPI ID + Copy */}
                              <div>
                                <p className="font-body text-xs text-espresso-800/60 uppercase tracking-wider mb-1">UPI ID</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2.5 font-body text-sm font-bold text-espresso-900 select-all">
                                    {UPI_ID}
                                  </div>
                                  <button
                                    id="copy-upi-id-btn"
                                    onClick={handleCopyUpiId}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                                      upiCopied
                                        ? "bg-green-100 border-green-400 text-green-700"
                                        : "bg-white border-cream-300 text-espresso-800 hover:bg-cream-100"
                                    }`}
                                    aria-label="Copy UPI ID"
                                  >
                                    {upiCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                  </button>
                                </div>
                              </div>

                              {/* QR Code */}
                              <div className="flex flex-col items-center gap-2">
                                <p className="font-body text-xs text-espresso-800/60 uppercase tracking-wider self-start">Scan QR to Pay</p>
                                <div className="bg-white border-2 border-cream-200 rounded-xl p-2 shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={qrUrl}
                                    alt={`UPI QR Code — Pay Rs. ${grandTotal.toFixed(2)} to ${UPI_ID}`}
                                    width={200}
                                    height={200}
                                    className="block"
                                    loading="lazy"
                                  />
                                </div>
                                <p className="font-body text-[0.65rem] text-espresso-800/50 text-center">
                                  Scan with any UPI app · Amount: Rs. {grandTotal.toFixed(2)}
                                </p>
                              </div>

                              {/* Pay via UPI App Button */}
                              <a
                                id="pay-upi-app-btn"
                                href={upiIntent}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                                aria-label="Open UPI app to pay"
                              >
                                <Smartphone size={17} />
                                Pay via UPI App — Rs. {grandTotal.toFixed(2)}
                              </a>

                              <p className="font-body text-[0.65rem] text-espresso-800/50 text-center -mt-1">
                                Opens your default UPI app (GPay, PhonePe, Paytm, etc.)
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* UTR / Transaction ID */}
                      <div className="space-y-2">
                        <label htmlFor="utr-input" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800">
                          UTR / Transaction ID <span className="text-rust-500">*</span>
                        </label>
                        <input
                          id="utr-input"
                          type="text"
                          value={utr}
                          onChange={(e) => { setUtr(e.target.value); if (utrError) setUtrError(""); }}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${utrError ? "border-rust-500" : "border-cream-300"}`}
                          placeholder="Enter UTR or Transaction Reference ID"
                          autoComplete="off"
                        />
                        <p className="font-body text-[0.68rem] text-espresso-800/50">
                          You can find the UTR / Reference ID in your UPI app after payment.
                        </p>
                      </div>

                      {/* Confirmation Checkbox */}
                      <label id="payment-confirm-checkbox-label" className="flex items-start gap-3 cursor-pointer group">
                        <input
                          id="payment-confirmed-checkbox"
                          type="checkbox"
                          checked={paymentConfirmed}
                          onChange={(e) => { setPaymentConfirmed(e.target.checked); if (utrError) setUtrError(""); }}
                          className="mt-0.5 w-4 h-4 accent-gold-600 cursor-pointer flex-shrink-0"
                        />
                        <span className="font-body text-sm text-espresso-900 group-hover:text-espresso-700 transition-colors leading-snug">
                          I have completed the UPI payment of <strong>Rs. {grandTotal.toFixed(2)}</strong> to <strong>{UPI_ID || "Kayal Samayal"}</strong> and the above UTR is correct.
                        </span>
                      </label>

                      {/* Error */}
                      {(utrError || checkoutError) && (
                        <div className="bg-red-50 border border-red-200 text-rust-600 text-xs px-3 py-2.5 rounded-lg font-body font-semibold">
                          {utrError || checkoutError}
                        </div>
                      )}

                      {/* Confirm Payment & Place Order Button */}
                      <button
                        id="confirm-payment-btn"
                        onClick={handlePaymentSubmit}
                        disabled={isSubmitting || !utr.trim() || !paymentConfirmed}
                        className="w-full py-3.5 px-4 bg-espresso-950 hover:bg-espresso-900 text-cream-50 font-display font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? (
                          <><span className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> Processing Order...</>
                        ) : (
                          <><CheckCircle size={17} /> Confirm Payment &amp; Place Order</>
                        )}
                      </button>

                      <p className="font-body text-[0.65rem] text-espresso-800/50 text-center">
                        Your order will be saved immediately. Payment is verified manually by our team.
                      </p>
                    </div>
                  )}

                  {/* ── LOADING STEP ──────────────────────────────────────── */}
                  {checkoutStep === "loading" && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-12 h-12 border-4 border-gold-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">Placing Your Order</h3>
                      <p className="font-body text-espresso-800/60 text-sm max-w-xs">
                        Saving your order and UPI payment details...
                      </p>
                    </div>
                  )}

                  {/* ── CONFIRM STEP ──────────────────────────────────────── */}
                  {checkoutStep === "confirm" && lastOrderResponse && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                      <CheckCircle size={56} className="text-green-600 animate-bounce" />
                      <h3 className="font-display text-xl font-bold text-espresso-900">
                        Order Placed Successfully!
                      </h3>
                      <p className="font-body text-espresso-800/70 text-sm max-w-xs">
                        Your order and UPI payment details have been saved. We will verify your payment and process your order shortly.
                      </p>

                      {/* Order Summary Card */}
                      <div className="w-full bg-cream-100 border border-cream-300 rounded-xl p-4 text-left space-y-2">
                        <div className="text-xs text-espresso-800/60 font-body uppercase tracking-wider">Order Reference</div>
                        <div className="font-display font-bold text-base text-gold-700">
                          {lastOrderResponse.orderId || "Pending ID"}
                        </div>

                        <div className="border-t border-cream-300/60 my-2 pt-2 grid grid-cols-2 gap-y-1.5 text-xs font-body text-espresso-800">
                          <span className="text-espresso-800/60">Customer</span>
                          <span className="font-bold text-right truncate">{customerDetails.name}</span>

                          <span className="text-espresso-800/60">Payment</span>
                          <span className="font-bold text-right">{lastOrderResponse.paymentMethod || "UPI"}</span>

                          <span className="text-espresso-800/60">Status</span>
                          <span className="font-bold text-right text-amber-700">{lastOrderResponse.paymentStatus || "Pending Verification"}</span>

                          <span className="text-espresso-800/60">UTR</span>
                          <span className="font-bold text-right text-espresso-900 break-all">{lastOrderResponse.utr || "—"}</span>

                          <span className="text-espresso-800/60">Grand Total</span>
                          <span className="font-bold text-right">Rs. {lastOrderResponse.grandTotal ?? cartSubtotal}</span>

                          {lastOrderResponse.emailSent === false && (
                            <>
                              <span className="text-espresso-800/60 col-span-2 text-[0.65rem] italic pt-1">
                                ⚠️ Order saved. Confirmation email could not be sent — contact us via WhatsApp.
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="font-body text-xs text-espresso-800/60 italic max-w-xs">
                        Our team will verify your UPI payment and contact you on your registered WhatsApp/Mobile number.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 w-full">
                        <a
                          id="whatsapp-order-details-btn"
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMsg()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp w-full justify-center py-3 text-sm flex items-center gap-2"
                        >
                          <MessageCircle size={16} />
                          WhatsApp Order Details
                        </a>
                        <button
                          id="continue-shopping-btn"
                          onClick={() => { setCheckoutStep("cart"); setIsCartOpen(false); }}
                          className="btn-primary w-full py-3 cursor-pointer"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── FOOTER ────────────────────────────────────────────── */}
                {cart.length > 0 && checkoutStep !== "confirm" && checkoutStep !== "loading" && checkoutStep !== "payment" && (
                  <div className="border-t border-cream-300 p-4 bg-white space-y-4">
                    {/* Subtotal */}
                    <div className="flex items-center justify-between font-body text-sm font-bold text-espresso-900">
                      <span>Subtotal:</span>
                      <span>Rs. {cartSubtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-[0.68rem] text-espresso-800/50 font-body -mt-2">
                      {cartSubtotal >= FREE_SHIPPING_THRESHOLD
                        ? "🎉 You qualify for free shipping!"
                        : `Add Rs. ${(FREE_SHIPPING_THRESHOLD - cartSubtotal).toFixed(0)} more for free shipping`}
                    </p>

                    {checkoutStep === "cart" ? (
                      <button
                        id="proceed-to-checkout-btn"
                        onClick={() => setCheckoutStep("checkout")}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout
                      </button>
                    ) : (
                      /* checkout step footer */
                      <button
                        id="continue-to-payment-btn"
                        type="submit"
                        form="checkout-form"
                        className="btn-primary w-full py-3 justify-center flex items-center gap-2 cursor-pointer"
                      >
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
