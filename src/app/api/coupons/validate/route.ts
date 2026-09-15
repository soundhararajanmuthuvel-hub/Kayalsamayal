import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals } from "@/lib/pricing";
import { normalizeCouponCode } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, code, customerMobile } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Cart is empty." },
        { status: 400 }
      );
    }

    const normalized = normalizeCouponCode(code);
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
