"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";
import { createOrder, OrderInput, OrderResponse } from "@/lib/api";

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
  /** Place the order. Pass utr (required for UPI) and paymentMethod (defaults to UPI). */
  placeOrder: (utr: string, paymentMethod?: "UPI" | "COD", screenshotBase64?: string, screenshotName?: string) => Promise<OrderResponse | null>;
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

  // Restore cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("kayal_samayal_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setTimeout(() => {
          setCart(parsed);
        }, 0);
      } catch (e) {
        console.error("Failed to parse cart data", e);
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
   * Place the order with the customer-entered UTR.
   * Sets checkoutStep to "loading" while the API call is in flight.
   * On success → "confirm". On failure → returns to "payment" step.
   * Email failure from the backend does NOT cause the order to fail.
   */
  const placeOrder = async (
    utr: string,
    paymentMethod: "UPI" | "COD" = "UPI",
    screenshotBase64?: string,
    screenshotName?: string
  ): Promise<OrderResponse | null> => {
    setCheckoutStep("loading");

    const orderInput: OrderInput = {
      customer: customerDetails,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity:  item.quantity,
      })),
      utr:           utr,
      paymentMethod: paymentMethod,
      screenshotBase64: screenshotBase64,
      screenshotName:   screenshotName,
    };

    try {
      const response = await createOrder(orderInput);
      setLastOrderResponse(response);
      if (response && response.success) {
        clearCart();
        setCheckoutStep("confirm");
      } else {
        setCheckoutStep("payment"); // back to payment step so customer can retry
      }
      return response;
    } catch (e) {
      console.error("Order creation error:", e);
      setCheckoutStep("payment");
      return {
        success: false, code: "NETWORK_ERROR",
        orderId: "", customerId: "",
        subtotal: 0, shipping: 0, discount: 0, gst: 0, grandTotal: 0,
        paymentStatus: "Pending", paymentMethod: paymentMethod === "COD" ? "COD / Pay Later" : "UPI", orderStatus: "Pending",
        items: [],
        message: "We couldn't connect to our order system. Please check your connection and try again.",
      };
    }
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
