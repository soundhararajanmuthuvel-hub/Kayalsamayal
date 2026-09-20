import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals, getProductPrice } from "@/lib/pricing";
import { createOrderToken } from "@/lib/orderToken";
import { validateCouponBackend } from "@/lib/api";
import { products } from "@/data/products";
import { CouponValidationResult } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer, couponCode } = body;

    if (!customer || !customer.name || !customer.mobile) {
      return NextResponse.json(
        { success: false, error: "Customer name and mobile are required." },
        { status: 400 }
      );
    }

    // 1. Authoritative Pricing Calculation on Server (including dynamic coupon discount)
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
        { success: false, error: calc.error || "Invalid cart items." },
        { status: 400 }
      );
    }

    // Free-order path: 100% coupon (or similar) results in ₹0 grand total.
    // Never send ₹0 to Razorpay — return freeOrder flag; checkout will use /api/orders/free.
    if (calc.grandTotal === 0) {
      return NextResponse.json({
        success: true,
        freeOrder: true,
        subtotal: calc.subtotal,
        discount: calc.discount,
        shipping: calc.shipping,
        couponCode: calc.couponCode,
        gst: calc.gstTotal,
        grandTotal: 0,
      });
    }

    // Explicit numeric validation: Allow any valid payable amount >= ₹1
    if (!Number.isFinite(calc.grandTotal) || calc.grandTotal < 1) {
      console.error("[RAZORPAY_CREATE_ORDER] Invalid payable total for Razorpay:", calc.grandTotal);
      return NextResponse.json(
        { success: false, error: "Payable order total must be at least ₹1." },
        { status: 400 }
      );
    }

    // Structured diagnostics (never log secrets, API keys, signatures, or sensitive customer details)
    console.log("[RAZORPAY_CREATE_ORDER]", {
      subtotal: calc.subtotal,
      discount: calc.discount,
      shipping: calc.shipping,
      payableTotal: calc.grandTotal,
      amountPaise: calc.amountInPaise,
      currency: "INR",
      couponCode: calc.couponCode || null,
      productIds: calc.items.map((it) => it.productId),
    });

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn("Razorpay credentials not fully set in environment.");
      return NextResponse.json(
        {
          success: false,
          error: "Online payment gateway is temporarily unavailable. Please contact us on WhatsApp to complete your order.",
        },
        { status: 503 }
      );
    }

    // 2. Create Razorpay Order via REST API
    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const receiptId = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: calc.amountInPaise,
        currency: "INR",
        receipt: receiptId,
        payment_capture: 1, // Auto-capture payment upon successful authorization
        notes: {
          customerName: customer.name,
          customerMobile: customer.mobile,
          customerCity: customer.city || "",
          itemsCount: calc.items.length,
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errJson = await razorpayRes.json();
      console.error("Razorpay order creation error:", errJson);
      return NextResponse.json(
        {
          success: false,
          error: errJson?.error?.description || "Failed to initialize secure payment.",
        },
        { status: 502 }
      );
    }

    const orderData = await razorpayRes.json();

    // Verify created Razorpay order amount matches authoritative expectation exactly
    if (orderData.amount !== calc.amountInPaise) {
      console.error("[Razorpay Order Create] Gateway returned order amount mismatch:", {
        gatewayOrderAmount: orderData.amount,
        expectedPaise: calc.amountInPaise,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway amount mismatch detected. Please try again.",
        },
        { status: 500 }
      );
    }

    console.log(
      `[Razorpay Order Create] Successfully created order ${orderData.id} for ₹${calc.grandTotal} (${orderData.amount} paise)`
    );

    // 3. Issue server-signed token locking razorpayOrderId + amount + couponCode
    const orderToken = createOrderToken({
      razorpayOrderId: orderData.id,
      expectedAmountPaise: calc.amountInPaise,
      customerMobile: customer.mobile,
      couponCode: calc.couponCode,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      orderToken,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      subtotal: calc.subtotal,
      shipping: calc.shipping,
      discount: calc.discount,
      couponCode: calc.couponCode,
      gst: calc.gstTotal,
      grandTotal: calc.grandTotal,
    });
  } catch (err: unknown) {
    console.error("Create Razorpay Order exception:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
