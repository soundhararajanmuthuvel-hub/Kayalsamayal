import { NextRequest, NextResponse } from "next/server";
import { normalizeCouponCode, DEFAULT_COUPONS, evaluateCoupon } from "@/lib/coupons";
import { products } from "@/data/products";
import { getProductPrice } from "@/lib/pricing";
import { brand } from "@/lib/brand";
import { validateCouponBackend } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.couponCode || body.code;
    const customerMobile = body.customerMobile || body.customer?.mobile;
    const items = body.items;

    if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
      return NextResponse.json(
        { valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    const normalized = normalizeCouponCode(rawCode);

    // 1. Calculate authoritative subtotal
    let subtotal = 0;
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const product = products.find((p) => p.id === it.productId);
        if (product) {
          const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
          subtotal += getProductPrice(product) * qty;
        }
      }
    }

    // Fallback to body.subtotal if items subtotal evaluated to 0
    if (subtotal === 0 && typeof body.subtotal === "number" && !isNaN(body.subtotal)) {
      subtotal = Math.max(0, body.subtotal);
    }

    const mobileStr = customerMobile ? String(customerMobile).trim() : undefined;

    // 2. Call Google Apps Script backend authoritative coupon validation
    const backendResult = await validateCouponBackend(normalized, subtotal, mobileStr);

    // If backend processed the action successfully
    if (backendResult.success !== false && (backendResult.valid === true || backendResult.valid === false)) {
      if (!backendResult.valid) {
        return NextResponse.json({
          valid: false,
          code: normalized,
          error: backendResult.error || "Invalid coupon code",
          discountAmount: 0,
        });
      }

      const discountAmount = Number(backendResult.discountAmount || 0);
      const isFreeShipping = subtotal >= brand.freeShippingOver;
      const shipping = isFreeShipping ? 0 : subtotal > 0 ? brand.shippingFlat : 0;
      const grandTotal = Math.max(0, subtotal + shipping - discountAmount);

      return NextResponse.json({
        valid: true,
        code: backendResult.code || normalized,
        discountAmount,
        discountType: backendResult.discountType || "percentage",
        discountValue: backendResult.discountValue ?? 0,
        maximumDiscount: backendResult.maximumDiscount,
        minOrder: backendResult.minimumOrder ?? 0,
        message: backendResult.message || `${backendResult.code || normalized} applied! You saved ₹${discountAmount}.`,
        subtotal,
        shipping,
        grandTotal,
      });
    }

    // 3. Graceful fallback (e.g. if GAS returned "Unknown action payload" before new script deployment)
    const localEval = evaluateCoupon(normalized, subtotal, {
      customerMobile: mobileStr,
      availableCoupons: DEFAULT_COUPONS,
    });

    if (!localEval.valid) {
      return NextResponse.json({
        valid: false,
        code: normalized,
        error: localEval.error || "Invalid coupon code",
        discountAmount: 0,
      });
    }

    const isFreeShipping = subtotal >= brand.freeShippingOver;
    const shipping = isFreeShipping ? 0 : subtotal > 0 ? brand.shippingFlat : 0;
    const grandTotal = Math.max(0, subtotal + shipping - localEval.discountAmount);

    return NextResponse.json({
      valid: true,
      code: localEval.code || normalized,
      discountAmount: localEval.discountAmount,
      discountType: localEval.discountType || "percentage",
      discountValue: localEval.discountValue ?? 0,
      maximumDiscount: localEval.maximumDiscount,
      minOrder: 0,
      message: localEval.message || `${localEval.code || normalized} applied! You saved ₹${localEval.discountAmount}.`,
      subtotal,
      shipping,
      grandTotal,
    });
  } catch (err: unknown) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, error: "Unable to validate coupon at this time." },
      { status: 500 }
    );
  }
}
