"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";
import { OrderResponse } from "@/lib/api";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

/**
 * Single source of truth for an applied coupon.
 * Persisted to localStorage so it survives refresh and Cart → Checkout navigation.
 */
export interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;   // e.g. 100 for KAYAL100, 10 for WELCOME10
  discountAmount: number;  // server-calculated rupee amount for the current cart
  maxDiscount?: number;
  minOrder?: number;
  message?: string;
  appliedAt?: number;
}

export type CheckoutStep = "cart" | "checkout" | "payment" | "loading" | "confirm";

const COUPON_STORAGE_KEY = "kayal_samayal_coupon";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  customerDetails: CustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  checkoutStep: CheckoutStep;
  setCheckoutStep: (step: CheckoutStep) => void;
  /** Place the order via Razorpay Online or COD. */
  placeOrder: (orderData: {
    paymentMethod: "Razorpay Online" | "COD";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayAmount?: number;
  }) => Promise<OrderResponse | null>;
  cartNotice: string;
  clearCartNotice: () => void;
  lastOrderResponse: OrderResponse | null;
  setLastOrderResponse: (response: OrderResponse | null) => void;
  /** Applied coupon — shared between Cart and Checkout. Persisted to localStorage. */
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearAppliedCoupon: () => void;
  updateAppliedCoupon: (partial: Partial<AppliedCoupon>) => void;
  couponError: string | null;
  setCouponError: (error: string | null) => void;
  couponLoading: boolean;
  setCouponLoading: (loading: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function computeCouponDiscount(
  coupon: Pick<AppliedCoupon, "discountType" | "discountValue" | "maxDiscount"> & { code?: string },
  subtotal: number
): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.code && String(coupon.code).trim().toUpperCase() === "TEST1RS") {
    return Math.max(0, subtotal - 1);
  }
  let rawDiscount = 0;
  if (coupon.discountType === "percentage") {
    rawDiscount = Math.round((subtotal * (coupon.discountValue || 0)) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      rawDiscount = Math.min(rawDiscount, coupon.maxDiscount);
    }
  } else {
    rawDiscount = Math.round(coupon.discountValue || 0);
  }
  return Math.max(0, Math.min(rawDiscount, subtotal));
}

// Helper to assign default prices if not present (e.g. for fallback products)
export function getProductPrice(product: Product): number {
  if (product.price && product.price > 0) return product.price;
  const isPremium = product.tier === "premium";
  switch (product.category) {
    case "Traditional Masalas":    return isPremium ? 120 : 60;
    case "Podi Products":          return isPremium ? 100 : 50;
    case "Specialty Noodles":      return isPremium ? 140 : 80;
    case "Health Mixes & Malts":   return isPremium ? 320 : 180;
    case "PeruKalam Legiyam":      return 250;
    default:                       return 100;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen]           = useState(false);
  const [checkoutStep, setCheckoutStep]       = useState<CheckoutStep>("cart");
  const [lastOrderResponse, setLastOrderResponseState] = useState<OrderResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem("kayal_last_order");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });

  const setLastOrderResponse = (resp: OrderResponse | null) => {
    setLastOrderResponseState(resp);
    if (typeof window !== "undefined") {
      try {
        if (resp) {
          sessionStorage.setItem("kayal_last_order", JSON.stringify(resp));
        } else {
          sessionStorage.removeItem("kayal_last_order");
        }
      } catch { /* ignore */ }
    }
  };

  const [rawAppliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(() => {
    // Restore persisted coupon from localStorage synchronously on first render.
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppliedCoupon;
        if (parsed && parsed.code) {
          return {
            ...parsed,
            code: parsed.code.trim().toUpperCase(),
          };
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "", notes: "",
  });

  const [cartNotice, setCartNotice] = useState<string>("");

  // Restore cart from localStorage on mount with strict product validation & migration
  useEffect(() => {
    const savedCart = localStorage.getItem("kayal_samayal_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Dynamic import / check against authoritative product catalog
          import("@/data/products").then(({ products: catalog }) => {
            const validCart: CartItem[] = [];
            let removedCount = 0;

            for (const item of parsed) {
              if (!item || !item.product) continue;
              const rawId = String(item.product.id || "").trim();
              const rawName = String(item.product.name || "").trim().toLowerCase();

              // Explicitly filter out stale development items (such as "sample" ID "12")
              if (rawId === "12" || rawName === "sample") {
                removedCount++;
                continue;
              }

              // Verify against catalog
              const match = catalog.find((p) => p.id === rawId);
              if (match && match.active !== false) {
                validCart.push({
                  product: match,
                  quantity: Math.max(1, Math.min(Number(item.quantity) || 1, match.stock ?? 999)),
                });
              } else {
                removedCount++;
              }
            }

            if (removedCount > 0) {
              console.warn(`[Cart] Purged ${removedCount} stale/inactive item(s) from previous session.`);
              setCartNotice("One or more items in your previous cart are no longer available and were removed.");
              localStorage.setItem("kayal_samayal_cart", JSON.stringify(validCart));
            }
            setCart(validCart);
          });
        }
      } catch (e) {
        console.error("Failed to parse cart data", e);
        localStorage.removeItem("kayal_samayal_cart");
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("kayal_samayal_cart", JSON.stringify(newCart));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentStock  = product.stock ?? 999;

    if (existingIndex > -1) {
      const newQuantity = cart[existingIndex].quantity + quantity;
      if (newQuantity > currentStock) {
        alert(`Only ${currentStock} units of ${product.name} are available in stock.`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity = newQuantity;
      saveCart(newCart);
    } else {
      if (quantity > currentStock) {
        alert(`Only ${currentStock} units of ${product.name} are available in stock.`);
        return;
      }
      saveCart([...cart, { product, quantity }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    const existingItem = cart.find((item) => item.product.id === productId);
    if (!existingItem) return;
    const maxStock = existingItem.product.stock ?? 999;
    if (quantity > maxStock) {
      alert(`Only ${maxStock} units of ${existingItem.product.name} are available in stock.`);
      return;
    }
    saveCart(cart.map((item) => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    saveCart([]);
    localStorage.removeItem("kayal_samayal_cart");
    // Clear coupon when cart is cleared (order completed)
    setAppliedCouponState(null);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const cartCount    = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + getProductPrice(item.product) * item.quantity, 0);

  // Derive active coupon with dynamic discountAmount matching current cartSubtotal
  const appliedCoupon: AppliedCoupon | null = rawAppliedCoupon
    ? {
        ...rawAppliedCoupon,
        discountAmount: computeCouponDiscount(rawAppliedCoupon, cartSubtotal),
      }
    : null;

  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);

  /** Persist and set coupon — shared between Cart and Checkout. */
  const setAppliedCoupon = (coupon: AppliedCoupon | null) => {
    if (coupon) {
      const normalizedCode = String(coupon.code || "").trim().toUpperCase();
      const updatedCoupon: AppliedCoupon = {
        ...coupon,
        code: normalizedCode,
        discountAmount: computeCouponDiscount(coupon, cartSubtotal),
      };
      setAppliedCouponState(updatedCoupon);
      try {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(updatedCoupon));
      } catch { /* ignore */ }
    } else {
      setAppliedCouponState(null);
      try {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      } catch { /* ignore */ }
    }
  };

  const clearAppliedCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const updateAppliedCoupon = (partial: Partial<AppliedCoupon>) => {
    setAppliedCouponState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  };

  /**
   * Client-side direct order placement is intentionally disabled for security.
   * All orders must be verified server-side through /api/razorpay/verify-payment.
   */
  const placeOrder = async (_orderData: {
    paymentMethod: "Razorpay Online" | "COD";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayAmount?: number;
  }): Promise<OrderResponse | null> => {
    console.warn("Direct placeOrder called from client. Orders must be verified server-side.");
    const errResponse: OrderResponse = {
      success: false,
      code: "VERIFICATION_REQUIRED",
      orderId: "",
      customerId: "",
      subtotal: 0,
      shipping: 0,
      discount: 0,
      gst: 0,
      grandTotal: 0,
      paymentStatus: "Pending",
      paymentMethod: _orderData.paymentMethod,
      orderStatus: "Pending",
      items: [],
      message: "Payment must be verified server-side before order creation.",
    };
    setLastOrderResponse(errResponse);
    return errResponse;
  };

  return (
    <CartContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        cartCount, cartSubtotal,
        isCartOpen, setIsCartOpen,
        customerDetails, setCustomerDetails,
        checkoutStep, setCheckoutStep,
        placeOrder,
        cartNotice,
        clearCartNotice: () => setCartNotice(""),
        lastOrderResponse,
        setLastOrderResponse,
        appliedCoupon,
        setAppliedCoupon,
        clearAppliedCoupon,
        updateAppliedCoupon,
        couponError,
        setCouponError,
        couponLoading,
        setCouponLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
