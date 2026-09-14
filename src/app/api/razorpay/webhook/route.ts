import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createOrder } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSignature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured. Webhook cannot be verified.");
      return NextResponse.json(
        { success: false, error: "Webhook secret not configured." },
        { status: 500 }
      );
    }

    if (!webhookSignature) {
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(webhookSignature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error("Invalid Razorpay webhook signature.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount || 0;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};

      console.log(`Razorpay webhook ${event} received for order:`, razorpayOrderId);

      // Reconcile and confirm order idempotently in Google Apps Script
      if (razorpayOrderId && razorpayPaymentId) {
        const authSecret = process.env.SERVER_AUTH_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
        const serverAuthToken = authSecret
          ? crypto
              .createHmac("sha256", authSecret)
              .update(`KAYAL_ORDER_AUTH:${razorpayOrderId}:${razorpayPaymentId}`)
              .digest("hex")
          : undefined;

        await createOrder({
          customer: {
            name: notes.customerName || "Customer",
            mobile: notes.customerMobile || "0000000000",
            email: paymentEntity?.email || "",
            address: "Delivery address captured during checkout",
            city: notes.customerCity || "Tamil Nadu",
            state: "Tamil Nadu",
            pincode: "600001",
          },
          items: [], // Idempotent check in Apps Script resolves by Razorpay Payment ID if already submitted
          paymentMethod: "Razorpay Online",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: "webhook_verified",
          razorpayAmount: Math.round(amountPaise / 100),
          serverAuthToken,
        });
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
