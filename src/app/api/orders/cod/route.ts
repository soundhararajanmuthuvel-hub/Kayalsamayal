import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals, getProductPrice } from "@/lib/pricing";
import { createOrder, validateCouponBackend } from "@/lib/api";
import { products } from "@/data/products";
import { CouponValidationResult } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, couponCode } = body;

    if (!customer || !customer.name || !customer.mobile || !customer.address || !customer.city || !customer.pincode) {
      return NextResponse.json(
        { success: false, error: "Please provide all required delivery details." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty." },
        { status: 400 }
      );
    }

    // 1. Authoritative server-side pricing, discount & stock calculation
    let dynamicValidation: CouponValidationResult | undefined;
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      let approxSubtotal = 0;
      if (Array.isArray(items)) {
        for (const it of items) {
          const product = products.find((p) => p.id === it.productId);
          if (product) {
            approxSubtotal += getProductPrice(product) * Math.max(1, Number(it.quantity) || 1);
          }
        }
      }
      const backendVal = await validateCouponBackend(couponCode, approxSubtotal, customer.mobile);
      if (backendVal.success !== false && (backendVal.valid === true || backendVal.valid === false)) {
        if (!backendVal.valid) {
          return NextResponse.json(
            { success: false, error: backendVal.error || "Invalid coupon code." },
            { status: 400 }
          );
        }
        dynamicValidation = {
          valid: true,
          code: backendVal.code || couponCode.trim().toUpperCase(),
          discountAmount: backendVal.discountAmount,
          discountType: backendVal.discountType,
          discountValue: backendVal.discountValue,
          maximumDiscount: backendVal.maximumDiscount,
          message: backendVal.message,
        };
      }
    }

    const calc = calculateOrderTotals(items, {
      couponCode: typeof couponCode === "string" ? couponCode.trim() : undefined,
      customerMobile: customer.mobile,
      couponValidation: dynamicValidation,
    });
    if (!calc.valid) {
      return NextResponse.json(
        { success: false, error: calc.error || "Invalid items in cart." },
        { status: 400 }
      );
    }

    // If client provided a coupon but it failed validation, reject safely
    if (couponCode && !calc.couponResult?.valid) {
      return NextResponse.json(
        { success: false, error: calc.couponResult?.error || "Invalid coupon code." },
        { status: 400 }
      );
    }

    // 2. Submit Cash on Delivery order to Google Apps Script backend
    const orderResponse = await createOrder({
      customer: {
        name: String(customer.name).trim(),
        mobile: String(customer.mobile).trim(),
        email: customer.email ? String(customer.email).trim() : "",
        address: String(customer.address).trim(),
        city: String(customer.city).trim(),
        state: customer.state ? String(customer.state).trim() : "Tamil Nadu",
        pincode: String(customer.pincode).trim(),
        notes: customer.notes ? String(customer.notes).trim() : "",
      },
      items: calc.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      })),
      paymentMethod: "Cash on Delivery",
      couponCode: calc.couponCode,
      discount: calc.discount,
    });

    if (!orderResponse || !orderResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: orderResponse?.error || orderResponse?.message || "Failed to place Cash on Delivery order. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderResponse,
      message: "Cash on Delivery order confirmed.",
    });
  } catch (err: unknown) {
    console.error("COD Order Placement exception:", err);
    const msg = err instanceof Error ? err.message : "Internal error while placing order.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
