import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals } from "@/lib/pricing";
import { createOrderToken } from "@/lib/orderToken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer } = body;

    if (!customer || !customer.name || !customer.mobile) {
      return NextResponse.json(
        { success: false, error: "Customer name and mobile are required." },
        { status: 400 }
      );
    }

    // 1. Authoritative Pricing Calculation on Server
    const calc = calculateOrderTotals(items);
    if (!calc.valid) {
      return NextResponse.json(
        { success: false, error: calc.error || "Invalid cart items." },
        { status: 400 }
      );
    }

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

    // 3. Issue server-signed token locking razorpayOrderId + amount
    const orderToken = createOrderToken({
      razorpayOrderId: orderData.id,
      expectedAmountPaise: calc.amountInPaise,
      customerMobile: customer.mobile,
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
