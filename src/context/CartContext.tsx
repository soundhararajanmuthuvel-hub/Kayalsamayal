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

export type CheckoutStep = "cart" | "checkout" | "payment" | "loading" | "confirm";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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
  const [lastOrderResponse, setLastOrderResponse] = useState<OrderResponse | null>(null);

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
  };

  const cartCount    = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + getProductPrice(item.product) * item.quantity, 0);

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
