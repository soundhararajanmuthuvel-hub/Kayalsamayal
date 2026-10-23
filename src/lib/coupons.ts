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

/**
 * Normalizes coupon code (trim and uppercase).
 */
export function normalizeCouponCode(code: string): string {
  return String(code || "").trim().toUpperCase();
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

  // Calculate discount amount
  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
  } else {
    discount = Math.round(coupon.discountValue);
  }

  // Cap discount to subtotal so total never becomes negative
  discount = Math.max(0, Math.min(discount, subtotal));

  // Ensure minimum payable amount ₹1 on Razorpay if subtotal >= 1
  if (subtotal >= 1 && (subtotal - discount) < 1) {
    discount = Math.max(0, subtotal - 1);
  }

  const finalAmount = Math.max(0, subtotal - discount);

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
