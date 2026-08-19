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
  checkoutStep: "cart" | "checkout" | "confirm" | "loading";
  setCheckoutStep: (step: "cart" | "checkout" | "confirm" | "loading") => void;
  placeOrder: () => Promise<OrderResponse | null>;
  lastOrderResponse: OrderResponse | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to assign default prices if not present (e.g. for fallback products)
export function getProductPrice(product: Product): number {
  if (product.price && product.price > 0) return product.price;
  
  // Default fallback prices based on category and tier
  const isPremium = product.tier === "premium";
  switch (product.category) {
    case "Traditional Masalas":
      return isPremium ? 120 : 60;
    case "Podi Products":
      return isPremium ? 100 : 50;
    case "Specialty Noodles":
      return isPremium ? 140 : 80;
    case "Health Mixes & Malts":
      return isPremium ? 320 : 180;
    case "PeruKalam Legiyam":
      return 250;
    default:
      return 100;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "confirm" | "loading">("cart");
  const [lastOrderResponse, setLastOrderResponse] = useState<OrderResponse | null>(null);
  
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("kayal_samayal_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart data", e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("kayal_samayal_cart", JSON.stringify(newCart));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    
    // Check stock if available from API
    const currentStock = product.stock ?? 999;
    
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
    const newCart = cart.filter((item) => item.product.id !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const existingItem = cart.find((item) => item.product.id === productId);
    if (!existingItem) return;
    
    const maxStock = existingItem.product.stock ?? 999;
    if (quantity > maxStock) {
      alert(`Only ${maxStock} units of ${existingItem.product.name} are available in stock.`);
      return;
    }

    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
    localStorage.removeItem("kayal_samayal_cart");
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const itemPrice = getProductPrice(item.product);
    return total + itemPrice * item.quantity;
  }, 0);

  const placeOrder = async (): Promise<OrderResponse | null> => {
    setCheckoutStep("loading");
    
    const orderInput: OrderInput = {
      customer: customerDetails,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };
    
    try {
      const response = await createOrder(orderInput);
      setLastOrderResponse(response);
      if (response && response.success) {
        clearCart();
        setCheckoutStep("confirm");
      } else {
        setCheckoutStep("checkout");
        alert(response?.message || "Something went wrong while placing your order. Please try again.");
      }
      return response;
    } catch (e) {
      console.error("Order creation error:", e);
      setCheckoutStep("checkout");
      alert("Network error. Please check your internet connection and try again.");
      return null;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
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
