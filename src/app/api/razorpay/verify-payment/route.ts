import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyOrderToken } from "@/lib/orderToken";
import { calculateOrderTotals, getProductPrice } from "@/lib/pricing";
import { createOrder, validateCouponBackend } from "@/lib/api";
import { products } from "@/data/products";
import { CouponValidationResult } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderToken,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      customer,
      items,
    } = body;

    console.log("[PAYMENT_FLOW] 2 VERIFY_REQUEST", {
      hasOrderToken: !!orderToken,
      hasPaymentId: !!razorpay_payment_id,
      hasOrderId: !!razorpay_order_id,
      hasSignature: !!razorpay_signature,
      itemsCount: Array.isArray(items) ? items.length : 0,
      customerMobile: customer?.mobile ? String(customer.mobile).slice(-4).padStart(10, "*") : null,
    });

    if (!orderToken || !razorpay_payment_id || !razorpay_signature) {
      console.error("[PAYMENT_FLOW] 2 VERIFY_REQUEST_FAILED: Missing required payment verification parameters.");
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Retrieve & validate the expected, trusted Razorpay Order ID from server-signed token
    const tokenPayload = verifyOrderToken(orderToken);
    if (!tokenPayload) {
      console.error("[PAYMENT_FLOW] 5 ORDER_TOKEN_VERIFICATION_FAILED: Invalid or expired payment session token.");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired payment session token. Verification failed.",
        },
        { status: 403 }
      );
    }

    const serverStoredRazorpayOrderId = tokenPayload.razorpayOrderId;

    // Verify client-returned order ID matches server-stored order ID if supplied
    if (razorpay_order_id && razorpay_order_id !== serverStoredRazorpayOrderId) {
      console.error("[PAYMENT_FLOW] 5 ORDER_TOKEN_VERIFICATION_FAILED: Order ID mismatch", {
        clientOrderId: razorpay_order_id,
        serverStoredOrderId: serverStoredRazorpayOrderId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment order ID mismatch. Verification failed.",
        },
        { status: 400 }
      );
    }

    console.log("[PAYMENT_FLOW] 5 ORDER_TOKEN_VERIFICATION_SUCCESS", {
      razorpayOrderId: serverStoredRazorpayOrderId,
    });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[PAYMENT_FLOW] SERVER_CONFIG_ERROR: RAZORPAY_KEY_SECRET is missing.");
      return NextResponse.json(
        { success: false, error: "Payment configuration error on server." },
        { status: 500 }
      );
    }

    // 2. Strict HMAC-SHA256 signature verification using server-stored Order ID
    const signatureBody = `${serverStoredRazorpayOrderId}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(signatureBody)
      .digest("hex");

    const sigBuf = Buffer.from(String(razorpay_signature), "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");
    const isSignatureValid =
      sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isSignatureValid) {
      console.error("[PAYMENT_FLOW] 3 SIGNATURE_VERIFICATION_FAILED", {
        serverStoredRazorpayOrderId,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Payment could not be verified." },
        { status: 400 }
      );
    }

    console.log("[PAYMENT_FLOW] 3 SIGNATURE_VERIFICATION_SUCCESS", {
      serverStoredRazorpayOrderId,
      razorpay_payment_id,
    });

    // 3. Authoritative calculation & amount verification (with dynamic coupon validation if present)
    let dynamicValidation: CouponValidationResult | undefined;
    if (tokenPayload.couponCode && typeof tokenPayload.couponCode === "string" && tokenPayload.couponCode.trim()) {
      let approxSubtotal = 0;
      if (Array.isArray(items)) {
        for (const it of items) {
          const product = products.find((p) => p.id === it.productId);
          if (product) {
            approxSubtotal += getProductPrice(product) * Math.max(1, Number(it.quantity) || 1);
          }
        }
      }
      const backendVal = await validateCouponBackend(
        tokenPayload.couponCode,
        approxSubtotal,
        customer?.mobile || tokenPayload.customerMobile
      );
      if (backendVal.success !== false && (backendVal.valid === true || backendVal.valid === false)) {
        if (backendVal.valid) {
          dynamicValidation = {
            valid: true,
            code: backendVal.code || tokenPayload.couponCode.trim().toUpperCase(),
            discountAmount: backendVal.discountAmount,
            discountType: backendVal.discountType,
            discountValue: backendVal.discountValue,
            maximumDiscount: backendVal.maximumDiscount,
            message: backendVal.message,
          };
        }
      }
    }

    const calc = calculateOrderTotals(items, {
      couponCode: tokenPayload.couponCode,
      customerMobile: customer?.mobile || tokenPayload.customerMobile,
      couponValidation: dynamicValidation,
    });

    if (!calc.valid) {
      console.error("[PAYMENT_FLOW] 4 AMOUNT_VERIFICATION_FAILED", calc.error);
      return NextResponse.json(
        { success: false, error: calc.error || "Invalid order calculation." },
        { status: 400 }
      );
    }

    if (calc.amountInPaise !== tokenPayload.expectedAmountPaise) {
      console.error("[PAYMENT_FLOW] 4 AMOUNT_VERIFICATION_FAILED: Mismatch", {
        calculatedPaise: calc.amountInPaise,
        tokenExpectedPaise: tokenPayload.expectedAmountPaise,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Order amount mismatch detected. Order could not be confirmed.",
        },
        { status: 400 }
      );
    }

    console.log("[PAYMENT_FLOW] 4 AMOUNT_VERIFICATION_SUCCESS", {
      amountInPaise: calc.amountInPaise,
      grandTotal: calc.grandTotal,
    });

    // 4. Server-Side Gateway Verification: Fetch Razorpay Payment Entity via REST API
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const paymentApiRes = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paymentApiRes.ok) {
      const errData = await paymentApiRes.json().catch(() => ({}));
      console.error("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_PAYMENT_STATUS_FETCH_FAILED", errData);
      return NextResponse.json(
        {
          success: false,
          error: "Could not verify payment status with payment gateway. Please contact support.",
        },
        { status: 502 }
      );
    }

    const paymentEntity = await paymentApiRes.json();

    // Verify payment entity fields strictly
    if (paymentEntity.order_id !== serverStoredRazorpayOrderId) {
      console.error("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_ORDER_MISMATCH", {
        paymentOrderId: paymentEntity.order_id,
        expectedOrderId: serverStoredRazorpayOrderId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment does not match the active checkout order session.",
        },
        { status: 400 }
      );
    }

    if (paymentEntity.currency !== "INR") {
      console.error("[RAZORPAY_PAYMENT_FLOW] INVALID_CURRENCY", paymentEntity.currency);
      return NextResponse.json(
        { success: false, error: "Invalid payment currency." },
        { status: 400 }
      );
    }

    if (paymentEntity.amount !== calc.amountInPaise) {
      console.error("[RAZORPAY_PAYMENT_FLOW] PAYMENT_ENTITY_AMOUNT_MISMATCH", {
        gatewayAmount: paymentEntity.amount,
        expectedAmount: calc.amountInPaise,
      });
      return NextResponse.json(
        { success: false, error: "Payment amount does not match order value." },
        { status: 400 }
      );
    }

    // Razorpay payment status handling:
    // If the payment is in "authorized" state, auto-capture it via Razorpay Capture API
    let paymentStatus = paymentEntity.status;
    if (paymentStatus === "authorized") {
      console.log("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_PAYMENT_STATUS_AUTHORIZED - Capturing payment...", {
        paymentId: razorpay_payment_id,
        amount: calc.amountInPaise,
      });
      try {
        const captureRes = await fetch(
          `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: calc.amountInPaise,
              currency: "INR",
            }),
          }
        );
        if (captureRes.ok) {
          const capturedEntity = await captureRes.json();
          paymentStatus = capturedEntity.status;
          console.log("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_PAYMENT_STATUS_CAPTURED_AFTER_CAPTURE", {
            paymentId: razorpay_payment_id,
            status: paymentStatus,
          });
        } else {
          // If capture returned 400, re-fetch to see if auto-capture completed concurrently
          const refetchRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            headers: { Authorization: authHeader, "Content-Type": "application/json" },
          });
          if (refetchRes.ok) {
            const refetched = await refetchRes.json();
            paymentStatus = refetched.status;
          }
        }
      } catch (capErr) {
        console.error("[RAZORPAY_PAYMENT_FLOW] Capture API exception:", capErr);
      }
    }

    if (paymentStatus !== "captured") {
      console.error("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_PAYMENT_STATUS_NOT_CAPTURED", {
        paymentId: razorpay_payment_id,
        status: paymentStatus,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Payment is not in captured status (current status: ${paymentStatus}). Order was not created.`,
        },
        { status: 400 }
      );
    }

    console.log("[RAZORPAY_PAYMENT_FLOW] RAZORPAY_PAYMENT_STATUS_CONFIRMED", {
      paymentId: razorpay_payment_id,
      status: paymentStatus,
    });

    // 5. Create & confirm Kayal Samayal order in Google Apps Script database idempotently
    const authSecret = process.env.SERVER_AUTH_SECRET || process.env.RAZORPAY_KEY_SECRET || "QCh0H33s8BN6aoBfUmJ39y5r";
    const serverAuthToken = crypto
      .createHmac("sha256", authSecret)
      .update(`KAYAL_ORDER_AUTH:${serverStoredRazorpayOrderId}:${razorpay_payment_id}`)
      .digest("hex");

    console.log("[PAYMENT_FLOW] 6 APPS_SCRIPT_UPDATE", {
      razorpayOrderId: serverStoredRazorpayOrderId,
      razorpayPaymentId: razorpay_payment_id,
      grandTotal: calc.grandTotal,
    });

    const orderResponse = await createOrder({
      customer,
      items,
      paymentMethod: "Razorpay Online",
      razorpayOrderId: serverStoredRazorpayOrderId,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      razorpayAmount: calc.grandTotal,
      couponCode: calc.couponCode,
      discount: calc.discount,
      serverAuthToken,
    });

    console.log("[PAYMENT_FLOW] 7 APPS_SCRIPT_RESPONSE", {
      success: orderResponse?.success,
      orderId: orderResponse?.orderId,
      customerId: orderResponse?.customerId,
      paymentStatus: orderResponse?.paymentStatus,
      orderStatus: orderResponse?.orderStatus,
      idempotent: !!orderResponse?.idempotent,
    });

    if (!orderResponse || !orderResponse.success) {
      console.error("[PAYMENT_FLOW] 7 APPS_SCRIPT_RESPONSE_FAILED", {
        error: orderResponse?.message || orderResponse?.error,
        code: orderResponse?.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: orderResponse?.message || "Failed to record confirmed order.",
          orderResponse,
        },
        { status: 502 }
      );
    }

    console.log("[PAYMENT_FLOW] 8 VERIFY_RESPONSE", {
      success: true,
      orderId: orderResponse.orderId,
      paymentStatus: "Paid",
      idempotent: !!orderResponse.idempotent,
    });

    return NextResponse.json({
      success: true,
      orderId: orderResponse.orderId,
      customerId: orderResponse.customerId,
      grandTotal: orderResponse.grandTotal,
      paymentStatus: "Paid",
      paymentMethod: "Razorpay Online",
      orderResponse,
    });
  } catch (err: unknown) {
    console.error("[PAYMENT_FLOW] VERIFY_EXCEPTION", err);
    return NextResponse.json(
      { success: false, error: "Internal server error verifying payment." },
      { status: 500 }
    );
  }
}
