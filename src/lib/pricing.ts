import { products } from "@/data/products";
import { brand } from "@/lib/brand";

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
  grandTotal: number;
  amountInPaise: number;
}

/**
 * Single authoritative order pricing calculation matching Google Apps Script backend.
 */
export function calculateOrderTotals(
  cartItems: Array<{ productId: string; quantity: number }>
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

    const unitPrice = product.price ?? 0;
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
  const discount = 0;
  const grandTotal = Math.round(subtotal + shipping + gstTotal - discount);
  const amountInPaise = grandTotal * 100;

  return {
    valid: true,
    items,
    subtotal,
    gstTotal,
    shipping,
    discount,
    grandTotal,
    amountInPaise,
  };
}
