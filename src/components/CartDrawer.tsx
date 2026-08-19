"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { useCart, getProductPrice } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const STATES = [
  "Tamil Nadu",
  "Puducherry",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi",
  "Other State"
];

export default function CartDrawer() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    customerDetails,
    setCustomerDetails,
    checkoutStep,
    setCheckoutStep,
    placeOrder,
    lastOrderResponse,
  } = useCart();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setCustomerDetails((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[e.target.name];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!customerDetails.name.trim()) newErrors.name = "Name is required";
    
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
    if (!customerDetails.city.trim()) newErrors.city = "City/Town is required";
    if (!customerDetails.state.trim()) newErrors.state = "State selection is required";
    
    const pincodePattern = /^\d{6}$/;
    if (!customerDetails.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!pincodePattern.test(customerDetails.pincode.trim())) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await placeOrder();
  };

  return (
    <>
      {/* Floating Cart Button (only shown when cart has items and drawer is closed) */}
      {!isCartOpen && cartCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gold-600 hover:bg-gold-700 text-espresso-950 p-4 rounded-full shadow-lg flex items-center justify-center transition-colors min-h-[56px] min-w-[56px] cursor-pointer border border-gold-500/20"
          aria-label={`Open shopping cart (${cartCount} items)`}
        >
          <ShoppingBag size={24} />
          <span className="absolute -top-1 -right-1 bg-rust-600 text-cream-50 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-cream-50">
            {cartCount}
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => checkoutStep !== "loading" && setIsCartOpen(false)}
            className="absolute inset-0 bg-espresso-950/80 backdrop-blur-xs"
          />

          {/* Drawer container */}
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
                  <span className="font-display font-bold text-lg">
                    {checkoutStep === "checkout" ? "Delivery Details" : checkoutStep === "confirm" ? "Order Confirmed" : "Your Shopping Cart"}
                  </span>
                </div>
                <button
                  disabled={checkoutStep === "loading"}
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-cream-400 hover:text-cream-100 hover:bg-white/10 transition-colors focus:outline-none"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                {checkoutStep === "cart" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <ShoppingBag size={48} className="text-cream-400 opacity-60 mb-4" />
                        <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">
                          Your cart is empty
                        </h3>
                        <p className="font-body text-espresso-800/60 text-sm max-w-xs mb-6">
                          Explore our heritage spice blends, masalas, and health mixes to add them to your cart.
                        </p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="btn-primary py-2 px-6 text-sm"
                        >
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
                              {/* Product Thumbnail */}
                              <div className="w-16 h-16 bg-cream-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-cream-200">
                                {item.product.image ? (
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="w-full h-full object-contain"
                                  />
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
                                <div className="font-body text-xs font-bold text-espresso-900 mt-1">
                                  Rs. {itemPrice}
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center border border-cream-300 rounded-lg bg-cream-50 overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    className="p-1 text-espresso-800 hover:bg-cream-200 active:bg-cream-300 transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="px-2 font-body text-xs font-bold text-espresso-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    className="p-1 text-espresso-800 hover:bg-cream-200 active:bg-cream-300 transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-espresso-800/40 hover:text-rust-500 transition-colors p-1"
                                  aria-label="Remove item"
                                >
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

                {checkoutStep === "checkout" && (
                  <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("cart")}
                      className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700 mb-2 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Cart
                    </button>
                    
                    <h3 className="font-display font-bold text-espresso-900 text-base border-b border-cream-300 pb-2">
                      Customer Information
                    </h3>

                    {/* Name */}
                    <div>
                      <label htmlFor="chk-name" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                        Full Name <span className="text-rust-500">*</span>
                      </label>
                      <input
                        id="chk-name"
                        name="name"
                        type="text"
                        value={customerDetails.name}
                        onChange={handleInputChange}
                        className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                          errors.name ? "border-rust-500" : "border-cream-300"
                        }`}
                        placeholder="e.g. Ahamed Kabeer"
                      />
                      {errors.name && <p className="text-rust-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Mobile & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="chk-mobile" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Mobile No <span className="text-rust-500">*</span>
                        </label>
                        <input
                          id="chk-mobile"
                          name="mobile"
                          type="tel"
                          value={customerDetails.mobile}
                          onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                            errors.mobile ? "border-rust-500" : "border-cream-300"
                          }`}
                          placeholder="e.g. 9876543210"
                        />
                        {errors.mobile && <p className="text-rust-500 text-xs mt-1">{errors.mobile}</p>}
                      </div>
                      <div>
                        <label htmlFor="chk-email" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Email Address
                        </label>
                        <input
                          id="chk-email"
                          name="email"
                          type="email"
                          value={customerDetails.email}
                          onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                            errors.email ? "border-rust-500" : "border-cream-300"
                          }`}
                          placeholder="e.g. name@example.com"
                        />
                        {errors.email && <p className="text-rust-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label htmlFor="chk-address" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                        Shipping Address <span className="text-rust-500">*</span>
                      </label>
                      <textarea
                        id="chk-address"
                        name="address"
                        rows={2}
                        value={customerDetails.address}
                        onChange={handleInputChange}
                        className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none ${
                          errors.address ? "border-rust-500" : "border-cream-300"
                        }`}
                        placeholder="House/Plot No, Street, Locality"
                      />
                      {errors.address && <p className="text-rust-500 text-xs mt-1">{errors.address}</p>}
                    </div>

                    {/* City, State, Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="chk-city" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          City/Town <span className="text-rust-500">*</span>
                        </label>
                        <input
                          id="chk-city"
                          name="city"
                          type="text"
                          value={customerDetails.city}
                          onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                            errors.city ? "border-rust-500" : "border-cream-300"
                          }`}
                          placeholder="e.g. Tirupattur"
                        />
                        {errors.city && <p className="text-rust-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="chk-state" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          State <span className="text-rust-500">*</span>
                        </label>
                        <select
                          id="chk-state"
                          name="state"
                          value={customerDetails.state}
                          onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-2 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                            errors.state ? "border-rust-500" : "border-cream-300"
                          }`}
                        >
                          <option value="">Select State</option>
                          {STATES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && <p className="text-rust-500 text-xs mt-1">{errors.state}</p>}
                      </div>

                      <div>
                        <label htmlFor="chk-pincode" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                          Pincode <span className="text-rust-500">*</span>
                        </label>
                        <input
                          id="chk-pincode"
                          name="pincode"
                          type="text"
                          value={customerDetails.pincode}
                          onChange={handleInputChange}
                          className={`w-full font-body text-sm bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition ${
                            errors.pincode ? "border-rust-500" : "border-cream-300"
                          }`}
                          placeholder="6 digits"
                        />
                        {errors.pincode && <p className="text-rust-500 text-xs mt-1">{errors.pincode}</p>}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="chk-notes" className="block font-body text-xs font-bold uppercase tracking-wider text-espresso-800 mb-1">
                        Order Notes (Optional)
                      </label>
                      <textarea
                        id="chk-notes"
                        name="notes"
                        rows={2}
                        value={customerDetails.notes}
                        onChange={handleInputChange}
                        className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-gold-600/20 focus:border-gold-600 transition resize-none"
                        placeholder="Any special instructions for delivery..."
                      />
                    </div>
                  </form>
                )}

                {checkoutStep === "loading" && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 border-4 border-gold-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <h3 className="font-display text-lg font-bold text-espresso-900 mb-2">
                      Processing Your Order
                    </h3>
                    <p className="font-body text-espresso-800/60 text-sm max-w-xs">
                      Connecting with Google Sheets to log your order details. Please do not close this panel.
                    </p>
                  </div>
                )}

                {checkoutStep === "confirm" && lastOrderResponse && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <CheckCircle size={56} className="text-green-600 animate-bounce" />
                    <h3 className="font-display text-xl font-bold text-espresso-900">
                      Order Placed Successfully!
                    </h3>
                    <p className="font-body text-espresso-800/80 text-sm">
                      Thank you for your order. It has been saved directly to our database.
                    </p>
                    
                    <div className="w-full bg-cream-100 border border-cream-300 rounded-xl p-4 text-left space-y-2">
                      <div className="text-xs text-espresso-800/60 font-body uppercase tracking-wider">Order Reference</div>
                      <div className="font-display font-bold text-base text-gold-700">
                        {lastOrderResponse.orderId || "Pending ID"}
                      </div>
                      
                      <div className="border-t border-cream-300/60 my-2 pt-2 grid grid-cols-2 gap-2 text-xs font-body text-espresso-800">
                        <span>Grand Total:</span>
                        <span className="font-bold text-right">Rs. {lastOrderResponse.grandTotal || cartSubtotal}</span>
                        <span>Payment Status:</span>
                        <span className="font-bold text-right text-yellow-700">{lastOrderResponse.paymentStatus || "Pending"}</span>
                      </div>
                    </div>

                    <p className="font-body text-xs text-espresso-800/60 italic max-w-xs pt-4">
                      Our team will contact you on your registered WhatsApp/Mobile number to arrange shipping.
                    </p>

                    <button
                      onClick={() => {
                        setCheckoutStep("cart");
                        setIsCartOpen(false);
                      }}
                      className="btn-primary w-full py-3"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>

              {/* Footer (Subtotal & Actions) */}
              {cart.length > 0 && checkoutStep !== "confirm" && checkoutStep !== "loading" && (
                <div className="border-t border-cream-300 p-4 bg-white space-y-4">
                  <div className="flex items-center justify-between font-body text-sm font-bold text-espresso-900">
                    <span>Subtotal:</span>
                    <span>Rs. {cartSubtotal}</span>
                  </div>

                  <p className="text-[0.7rem] text-espresso-800/50 font-body">
                    Shipping charges, GST, and final totals are computed in Google Sheets during order placement.
                  </p>

                  {checkoutStep === "cart" ? (
                    <button
                      onClick={() => setCheckoutStep("checkout")}
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="checkout-form"
                      className="btn-whatsapp w-full py-3 justify-center flex items-center gap-2"
                    >
                      <Send size={16} /> Place Order via API
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
