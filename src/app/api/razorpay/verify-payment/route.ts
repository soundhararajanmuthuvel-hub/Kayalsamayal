import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyOrderToken } from "@/lib/orderToken";
import { calculateOrderTotals } from "@/lib/pricing";
import { createOrder } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderToken,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
    } = body;

    if (!orderToken || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Retrieve the expected, trusted Razorpay Order ID from server-signed token
    const tokenPayload = verifyOrderToken(orderToken);
    if (!tokenPayload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired payment session token. Verification failed.",
        },
        { status: 403 }
      );
    }

    const serverStoredRazorpayOrderId = tokenPayload.razorpayOrderId;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is missing.");
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

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(razorpay_signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      console.error("Signature mismatch on Razorpay verification:", {
        serverStoredRazorpayOrderId,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Payment could not be verified." },
        { status: 400 }
      );
    }

    // 3. Authoritative calculation & amount verification (with validated token couponCode if present)
    const calc = calculateOrderTotals(items, {
      couponCode: tokenPayload.couponCode,
      customerMobile: customer?.mobile,
    });
    if (!calc.valid) {
      return NextResponse.json(
        { success: false, error: calc.error || "Invalid order calculation." },
        { status: 400 }
      );
    }

    if (calc.amountInPaise !== tokenPayload.expectedAmountPaise) {
      console.error("Amount mismatch:", {
        calculated: calc.amountInPaise,
        tokenExpected: tokenPayload.expectedAmountPaise,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Order amount mismatch detected. Order could not be confirmed.",
        },
        { status: 400 }
      );
    }

    // 4. Server-Side Verification: Fetch Razorpay Payment Entity via REST API
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
      console.error("Failed to retrieve payment entity from Razorpay API:", errData);
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
    if (paymentEntity.status !== "captured") {
      console.error("Payment status is not captured:", {
        paymentId: razorpay_payment_id,
        status: paymentEntity.status,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Payment is not in captured status (current status: ${paymentEntity.status}). Order was not created.`,
        },
        { status: 400 }
      );
    }

    if (paymentEntity.order_id !== serverStoredRazorpayOrderId) {
      console.error("Payment does not belong to expected Razorpay order:", {
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
      console.error("Invalid payment currency:", paymentEntity.currency);
      return NextResponse.json(
        { success: false, error: "Invalid payment currency." },
        { status: 400 }
      );
    }

    if (paymentEntity.amount !== calc.amountInPaise) {
      console.error("Payment entity amount mismatch:", {
        gatewayAmount: paymentEntity.amount,
        expectedAmount: calc.amountInPaise,
      });
      return NextResponse.json(
        { success: false, error: "Payment amount does not match order value." },
        { status: 400 }
      );
    }

    // 5. Create & confirm Kayal Samayal order in Google Apps Script database idempotently
    const authSecret = process.env.SERVER_AUTH_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
    if (!authSecret) {
      console.error("SERVER_AUTH_SECRET or RAZORPAY_KEY_SECRET is required on server.");
      return NextResponse.json(
        { success: false, error: "Server authentication configuration missing." },
        { status: 500 }
      );
    }
    const serverAuthToken = crypto
      .createHmac("sha256", authSecret)
      .update(`KAYAL_ORDER_AUTH:${serverStoredRazorpayOrderId}:${razorpay_payment_id}`)
      .digest("hex");

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

    if (!orderResponse || !orderResponse.success) {
      console.error("Google Apps Script order creation failed:", orderResponse);
      return NextResponse.json(
        {
          success: false,
          error: orderResponse?.message || "Failed to record confirmed order.",
          orderResponse,
        },
        { status: 502 }
      );
    }

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
    console.error("Verify payment exception:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error verifying payment." },
      { status: 500 }
    );
  }
}
