import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmRazorpayOrder } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSignature = req.headers.get("x-razorpay-signature");
    const rawWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const webhookSecret = rawWebhookSecret.trim().replace(/^["']|["']$/g, "").trim();

    if (!webhookSecret) {
      console.warn("[RAZORPAY_WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured on Vercel.");
      return NextResponse.json(
        { success: false, error: "Webhook secret not configured on server." },
        { status: 500 }
      );
    }

    if (!webhookSignature) {
      console.warn("[RAZORPAY_WEBHOOK] Missing x-razorpay-signature header.");
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // Verify webhook signature securely against exact raw request body
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const sigBuf = Buffer.from(String(webhookSignature).trim(), "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");
    const isSignatureValid =
      sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isSignatureValid) {
      console.error("[RAZORPAY_WEBHOOK] Invalid webhook signature.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayPaymentId = paymentEntity?.id;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const amountPaise = paymentEntity?.amount || orderEntity?.amount || 0;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};

    console.log("[RAZORPAY_WEBHOOK] Event received:", {
      event,
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise,
    });

    if (event === "payment.failed") {
      console.warn("[RAZORPAY_WEBHOOK] Payment failed:", {
        razorpayOrderId,
        razorpayPaymentId,
        error: paymentEntity?.error_description,
      });
      return NextResponse.json({ success: true, received: true, note: "Payment failure acknowledged" });
    }

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      // Reconcile and confirm order idempotently in Google Apps Script
      if (razorpayOrderId && razorpayPaymentId) {
        const rawAuthSecret = process.env.SERVER_AUTH_SECRET || "";
        const serverAuthSecret = rawAuthSecret.trim().replace(/^["']|["']$/g, "").trim();

        if (!serverAuthSecret) {
          console.error("[RAZORPAY_WEBHOOK] SERVER_AUTH_SECRET is not configured on Vercel.");
          return NextResponse.json(
            { success: false, error: "Server authentication secret not configured." },
            { status: 500 }
          );
        }

        const cleanOrderId = String(razorpayOrderId || "").trim();
        const cleanPaymentId = String(razorpayPaymentId || "").trim();

        const serverAuthToken = crypto
          .createHmac("sha256", serverAuthSecret)
          .update(`KAYAL_ORDER_AUTH:${cleanOrderId}:${cleanPaymentId}`)
          .digest("hex");

        // Parse any cart items from notes if present
        let parsedItems: Array<{ productId: string; quantity: number }> = [];
        if (notes.cartItems) {
          try {
            const rawCart = JSON.parse(notes.cartItems);
            if (Array.isArray(rawCart)) {
              parsedItems = rawCart.map((it: { id?: string; productId?: string; q?: number; quantity?: number }) => ({
                productId: String(it.productId || it.id || ""),
                quantity: Math.max(1, Number(it.quantity || it.q || 1)),
              })).filter((it) => it.productId);
            }
          } catch {
            // fall back to empty items, will be recovered by Apps Script from Order Notes
          }
        }

        const confirmRes = await confirmRazorpayOrder({
          orderId: notes.backendOrderId || undefined,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: "webhook_verified",
          razorpayAmount: Math.round(amountPaise / 100),
          serverAuthToken,
          customer: {
            name: notes.customerName || "Customer",
            mobile: notes.customerMobile || "0000000000",
            email: paymentEntity?.email || "",
            address: "Delivery address captured during checkout",
            city: notes.customerCity || "Tamil Nadu",
            state: "Tamil Nadu",
            pincode: "600001",
          },
          items: parsedItems,
        });

        console.log("[RAZORPAY_WEBHOOK] Confirmation result:", {
          razorpayOrderId,
          razorpayPaymentId,
          success: confirmRes?.success,
          orderId: confirmRes?.orderId,
          idempotent: !!confirmRes?.idempotent,
        });
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: unknown) {
    console.error("[RAZORPAY_PAYMENT_FLOW] WEBHOOK_EXCEPTION", err);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
