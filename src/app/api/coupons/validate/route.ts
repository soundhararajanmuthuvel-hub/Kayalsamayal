import { NextRequest, NextResponse } from "next/server";
import { normalizeCouponCode } from "@/lib/coupons";
import { products } from "@/data/products";
import { getProductPrice } from "@/lib/pricing";
import { brand } from "@/lib/brand";
import { validateCouponBackend } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    if (backendResult.success !== false && (backendResult.valid === true || backendResult.valid === false)) {
      if (!backendResult.valid) {
        return NextResponse.json({
          valid: false,
          code: normalized,
          error: backendResult.error || "Invalid coupon code",
          discountAmount: 0,
        });
      }

      const discountAmount = Math.min(subtotal, Math.max(0, Number(backendResult.discountAmount || 0)));
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

    return NextResponse.json({
      valid: false,
      code: normalized,
      error: backendResult.error || "Invalid coupon code",
      discountAmount: 0,
    });
  } catch (err: unknown) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, error: "Coupon service unavailable, continue without coupon?" },
      { status: 500 }
    );
  }
}
