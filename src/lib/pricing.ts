import { products } from "@/data/products";
import { brand } from "@/lib/brand";
import { evaluateCoupon, CouponValidationResult } from "@/lib/coupons";

export interface OrderItemCalculation {
  productId: string;
  productName: string;
  tier: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineTotal: number;
  gstAmount: number;
}

export interface OrderCalculationResult {
  valid: boolean;
  error?: string;
  items: OrderItemCalculation[];
  subtotal: number;
  gstTotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  couponResult?: CouponValidationResult;
  grandTotal: number;
  amountInPaise: number;
}

/**
 * Authoritative price determination helper for products.
 * Uses explicit product.price if present, otherwise computes standard category & tier pricing.
 */
export function getProductPrice(product: {
  price?: number;
  tier?: string;
  category?: string;
}): number {
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

/**
 * Single authoritative order pricing calculation matching Google Apps Script backend.
 */
export function calculateOrderTotals(
  cartItems: Array<{ productId: string; quantity: number }>,
  options?: {
    couponCode?: string;
    customerMobile?: string;
    existingCustomerUses?: number;
    availableCoupons?: import("@/lib/coupons").CouponDefinition[];
    couponValidation?: CouponValidationResult;
  }
): OrderCalculationResult {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      valid: false,
      error: "Cart is empty.",
      items: [],
      subtotal: 0,
      gstTotal: 0,
      shipping: 0,
      discount: 0,
      grandTotal: 0,
      amountInPaise: 0,
    };
  }

  const items: OrderItemCalculation[] = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      console.warn(`[Pricing Engine] Product ID not found in authoritative catalog: ${item.productId}`);
      return {
        valid: false,
        error: "One item in your cart is no longer available. Please review your cart.",
        items: [],
        subtotal: 0,
        gstTotal: 0,
        shipping: 0,
        discount: 0,
        grandTotal: 0,
        amountInPaise: 0,
      };
    }

    if (product.active === false) {
      return {
        valid: false,
        error: `Product is unavailable: ${product.name}`,
        items: [],
        subtotal: 0,
        gstTotal: 0,
        shipping: 0,
        discount: 0,
        grandTotal: 0,
        amountInPaise: 0,
      };
    }

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const availableStock = product.stock ?? 999;
    if (quantity > availableStock) {
      return {
        valid: false,
        error: `Insufficient stock for ${product.name}. Available: ${availableStock}`,
        items: [],
        subtotal: 0,
        gstTotal: 0,
        shipping: 0,
        discount: 0,
        grandTotal: 0,
        amountInPaise: 0,
      };
    }

    const unitPrice = getProductPrice(product);
    const gstRate = product.gst ?? 0;
    const lineTotal = unitPrice * quantity;
    const gstAmount = lineTotal * gstRate;

    subtotal += lineTotal;
    items.push({
      productId: product.id,
      productName: product.name,
      tier: product.tier,
      quantity,
      unitPrice,
      gstRate,
      lineTotal,
      gstAmount,
    });
  }

  const gstTotal = items.reduce((sum, it) => sum + it.gstAmount, 0);
  const freeShippingThreshold = brand.freeShippingOver; // 500
  const shippingCharge = brand.shippingFlat; // 60
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCharge;

  // Authoritative Coupon Evaluation
  let discount = 0;
  let couponResult: CouponValidationResult | undefined;
  if (options?.couponValidation) {
    couponResult = options.couponValidation;
    if (couponResult.valid) {
      discount = couponResult.discountAmount;
    }
  } else if (options?.couponCode && options.couponCode.trim()) {
    couponResult = evaluateCoupon(options.couponCode, subtotal, {
      customerMobile: options.customerMobile,
      existingCustomerUses: options.existingCustomerUses,
      availableCoupons: options.availableCoupons,
    });
    if (couponResult.valid) {
      discount = couponResult.discountAmount;
    }
  }

  // grandTotal may be 0 when a 100% coupon applies to subtotal and shipping/GST is also 0.
  // The Razorpay create-order route handles this by returning freeOrder:true instead of creating
  // a ₹0 Razorpay order. COD and Free Order paths accept ₹0 naturally.
  const grandTotal = Math.max(0, Math.round(subtotal + shipping + gstTotal - discount));
  const amountInPaise = Math.round(grandTotal * 100);

  if (!Number.isFinite(grandTotal) || grandTotal < 0) {
    return {
      valid: false,
      error: "Invalid payable amount calculated.",
      items: [],
      subtotal: 0,
      gstTotal: 0,
      shipping: 0,
      discount: 0,
      grandTotal: 0,
      amountInPaise: 0,
    };
  }

  return {
    valid: true,
    items,
    subtotal,
    gstTotal,
    shipping,
    discount,
    couponCode: couponResult?.valid ? couponResult.code : undefined,
    couponResult,
    grandTotal,
    amountInPaise,
  };
}
