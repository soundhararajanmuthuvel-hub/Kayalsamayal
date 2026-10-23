export interface CouponDefinition {
  id?: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // e.g. 10 for 10%
  maximumDiscount?: number; // e.g. 100 for ₹100 cap
  minimumOrderSubtotal?: number; // e.g. 299
  usageLimit?: number; // global usage limit
  usedCount?: number;
  perCustomerLimit?: number; // e.g. 1
  startDate?: string; // ISO or date string
  expiryDate?: string; // ISO or date string
  active: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  error?: string;
  discountAmount: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  maximumDiscount?: number;
  minOrder?: number;
  finalAmount?: number;
  message?: string;
}

export interface CouponDiscountInput {
  discountType?: "percentage" | "fixed" | "PERCENT" | "FLAT";
  discountValue?: number;
  value?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
}

/**
 * Normalizes coupon code (trim and uppercase).
 */
export function normalizeCouponCode(code: string): string {
  return String(code || "").trim().toUpperCase();
}

/**
 * Authoritative shared calculation function for coupon discounts across:
 * cart drawer, cart page, checkout, create-order, COD, free-order, and CartContext.
 *
 * Rules:
 * - Value = 1 means 1% and must NEVER become 100%. No multiplier heuristics.
 * - Maximum discount cap strictly applied if > 0.
 * - Zero-total policy: Enforces minimum ₹1 payable when a coupon is applied.
 */
export function calculateCouponDiscount(
  coupon: CouponDiscountInput | null | undefined,
  subtotal: number
): { discount: number; finalAmount: number } {
  if (!coupon || subtotal <= 0) {
    return { discount: 0, finalAmount: Math.max(0, subtotal) };
  }

  const rawType = String(coupon.discountType || "percentage").toLowerCase();
  const isPercent = rawType === "percentage" || rawType === "percent" || rawType === "%";
  const val = Number(coupon.discountValue ?? coupon.value ?? 0);
  const maxCap = Number(coupon.maximumDiscount ?? coupon.maxDiscount ?? 0);

  let discount = 0;
  if (isPercent) {
    discount = Math.round((subtotal * val) / 100);
    if (maxCap > 0) {
      discount = Math.min(discount, maxCap);
    }
  } else {
    discount = Math.round(val);
    if (maxCap > 0) {
      discount = Math.min(discount, maxCap);
    }
  }

  // Zero-total policy: When a coupon is applied, enforce minimum Rs 1 payable
  if (subtotal >= 1) {
    discount = Math.min(discount, subtotal - 1);
  } else {
    discount = 0;
  }
  discount = Math.max(0, discount);
  const finalAmount = Math.max(subtotal >= 1 ? 1 : 0, subtotal - discount);

  return { discount, finalAmount };
}

/**
 * Convenience helper returning just the numeric discount amount.
 */
export function computeCouponDiscount(
  coupon: CouponDiscountInput | null | undefined,
  subtotal: number
): number {
  return calculateCouponDiscount(coupon, subtotal).discount;
}

/**
 * Dynamic in-memory coupon evaluation against a provided catalog (e.g. from Google Sheets).
 * No hardcoded coupons exist. The Google Sheet is the single source of truth.
 */
export function evaluateCoupon(
  code: string | undefined | null,
  subtotal: number,
  options?: {
    customerMobile?: string;
    existingCustomerUses?: number;
    availableCoupons?: CouponDefinition[];
  }
): CouponValidationResult {
  if (!code) {
    return { valid: false, discountAmount: 0 };
  }

  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { valid: false, discountAmount: 0, error: "Invalid coupon code" };
  }

  const catalog = options?.availableCoupons || [];
  if (catalog.length === 0) {
    return { valid: false, discountAmount: 0, error: "Invalid coupon code" };
  }

  const coupon = catalog.find(
    (c) => normalizeCouponCode(c.code) === normalized
  );

  if (!coupon) {
    return { valid: false, discountAmount: 0, error: "Invalid coupon code" };
  }

  if (!coupon.active) {
    return { valid: false, discountAmount: 0, error: "This coupon is no longer active" };
  }

  const now = new Date();

  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return { valid: false, discountAmount: 0, error: "Coupon is not yet active" };
    }
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (!isNaN(expiry.getTime()) && now > expiry) {
      return { valid: false, discountAmount: 0, error: "Coupon has expired" };
    }
  }

  const minOrder = Number(coupon.minimumOrderSubtotal || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order amount of ₹${minOrder} required for this coupon`,
    };
  }

  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usageLimit > 0 &&
    typeof coupon.usedCount === "number" &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      discountAmount: 0,
      error: "Coupon usage limit reached",
    };
  }

  if (
    typeof options?.existingCustomerUses === "number" &&
    coupon.perCustomerLimit &&
    options.existingCustomerUses >= coupon.perCustomerLimit
  ) {
    return {
      valid: false,
      discountAmount: 0,
      error: "You have already reached the usage limit for this coupon",
    };
  }

  // Authoritative shared discount calculation
  const { discount, finalAmount } = calculateCouponDiscount(coupon, subtotal);

  return {
    valid: true,
    code: coupon.code,
    discountAmount: discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount,
    minOrder,
    finalAmount,
    message: `${coupon.code} applied! You saved ₹${discount}.`,
  };
}
