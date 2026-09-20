import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals } from "@/lib/pricing";
import { normalizeCouponCode, DEFAULT_COUPONS } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, code, customerMobile } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    const normalized = normalizeCouponCode(code);

    // If cart items are empty or hydrating, check coupon metadata against catalog
    if (!items || !Array.isArray(items) || items.length === 0) {
      const coupon = DEFAULT_COUPONS.find(
        (c) => normalizeCouponCode(c.code) === normalized
      );
      if (!coupon) {
        return NextResponse.json({
          valid: false,
          code: normalized,
          error: "Invalid coupon code",
          discountAmount: 0,
        });
      }
      if (!coupon.active) {
        return NextResponse.json({
          valid: false,
          code: normalized,
          error: "This coupon is no longer active",
          discountAmount: 0,
        });
      }
      return NextResponse.json({
        valid: true,
        code: coupon.code,
        discountAmount: 0,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maximumDiscount: coupon.maximumDiscount,
        minOrder: coupon.minimumOrderSubtotal,
        message: `${coupon.code} applied!`,
        subtotal: 0,
        shipping: 0,
        grandTotal: 0,
      });
    }
    const calc = calculateOrderTotals(items, {
      couponCode: normalized,
      customerMobile: customerMobile ? String(customerMobile).trim() : undefined,
    });

    if (!calc.valid) {
      return NextResponse.json(
        { valid: false, error: calc.error || "Invalid items in cart." },
        { status: 400 }
      );
    }

    if (!calc.couponResult || !calc.couponResult.valid) {
      return NextResponse.json({
        valid: false,
        code: normalized,
        error: calc.couponResult?.error || "Invalid coupon code",
        discountAmount: 0,
      });
    }

    return NextResponse.json({
      valid: true,
      code: calc.couponResult.code,
      discountAmount: calc.discount,
      discountType: calc.couponResult.discountType,
      discountValue: calc.couponResult.discountValue,
      maximumDiscount: calc.couponResult.maximumDiscount,
      message: calc.couponResult.message,
      subtotal: calc.subtotal,
      shipping: calc.shipping,
      grandTotal: calc.grandTotal,
    });
  } catch (err: unknown) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, error: "Unable to validate coupon at this time." },
      { status: 500 }
    );
  }
}
