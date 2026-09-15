import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals } from "@/lib/pricing";
import { createOrder } from "@/lib/api";

/**
 * POST /api/orders/free
 *
 * Completes an order whose authoritative grand total is exactly RS 0.
 * Called by checkout when /api/razorpay/create-order returns { freeOrder: true }.
 *
 * Security contract:
 *  - Server recalculates all totals -- browser-supplied discount/total are never trusted.
 *  - Rejects if grand total != 0 (prevents abuse of this endpoint for non-free orders).
 *  - Coupon validation runs through the same calculateOrderTotals path.
 *  - Order created with paymentMethod "Free Order" / paymentStatus "Paid".
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, couponCode } = body;

    if (!customer || !customer.name || !customer.mobile || !customer.address || !customer.city || !customer.pincode) {
      return NextResponse.json({ success: false, error: "Please provide all required delivery details." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Your cart is empty." }, { status: 400 });
    }

    const calc = calculateOrderTotals(items, {
      couponCode: typeof couponCode === "string" ? couponCode.trim() : undefined,
      customerMobile: String(customer.mobile).trim(),
    });

    if (!calc.valid) {
      return NextResponse.json({ success: false, error: calc.error || "Invalid items in cart." }, { status: 400 });
    }

    if (calc.grandTotal !== 0) {
      return NextResponse.json(
        { success: false, error: "This order is not free (total: RS " + calc.grandTotal + "). Use standard checkout." },
        { status: 400 }
      );
    }

    if (couponCode && !calc.couponResult?.valid) {
      return NextResponse.json({ success: false, error: calc.couponResult?.error || "Invalid coupon code." }, { status: 400 });
    }

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
      items: calc.items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      paymentMethod: "Free Order",
      couponCode: calc.couponCode,
      discount: calc.discount,
    });

    if (!orderResponse || !orderResponse.success) {
      return NextResponse.json(
        { success: false, error: orderResponse?.error || orderResponse?.message || "Failed to complete order." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, orderResponse, message: "Order completed successfully." });
  } catch (err: unknown) {
    console.error("Free order error:", err);
    const msg = err instanceof Error ? err.message : "Internal error.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
