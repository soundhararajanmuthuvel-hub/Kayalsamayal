export interface CouponDefinition {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // e.g. 10 for 10%
  maximumDiscount?: number; // e.g. 100 for ₹100 cap
  minimumOrderSubtotal: number; // e.g. 299
  usageLimit?: number; // global usage limit
  perCustomerLimit: number; // e.g. 1
  startDate?: string; // ISO or date string
  expiryDate?: string; // ISO or date string
  active: boolean;
}

/**
 * Standard backend/database coupon catalog.
 * WELCOME10 is pre-configured and can be extended from Google Sheets.
 */
export const DEFAULT_COUPONS: CouponDefinition[] = [
  {
    id: "CPN-WELCOME10",
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    maximumDiscount: 100,
    minimumOrderSubtotal: 299,
    perCustomerLimit: 1,
    active: true,
  },
  {
    id: "CPN-KAYAL100",
    code: "KAYAL100",
    discountType: "percentage",
    discountValue: 100,
    // maximumDiscount intentionally omitted — no cap
    minimumOrderSubtotal: 0,
    perCustomerLimit: 1,
    active: true,
  },
  {
    id: "CPN-HI",
    code: "HI",
    discountType: "percentage",
    discountValue: 100,
    minimumOrderSubtotal: 0,
    perCustomerLimit: 1,
    active: true,
  },
  {
    id: "CPN-TEST1RS",
    code: "TEST1RS",
    discountType: "fixed",
    discountValue: 539,
    maximumDiscount: 999,
    minimumOrderSubtotal: 100,
    perCustomerLimit: 1,
    active: true,
  },
];

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  error?: string;
  discountAmount: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  maximumDiscount?: number;
  message?: string;
}

/**
 * Normalizes coupon code (trim and uppercase).
 */
export function normalizeCouponCode(code: string): string {
  return String(code || "").trim().toUpperCase();
}

/**
 * Server-authoritative coupon evaluation.
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

  const catalog = options?.availableCoupons && options.availableCoupons.length > 0
    ? options.availableCoupons
    : DEFAULT_COUPONS;

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

  if (subtotal < coupon.minimumOrderSubtotal) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order value is ₹${coupon.minimumOrderSubtotal} to use this coupon`,
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
      error: "You have already used this coupon",
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

  return {
    valid: true,
    code: coupon.code,
    discountAmount: discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount,
    message: `${coupon.code} applied! You saved ₹${discount}.`,
  };
}
