import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotals } from "@/lib/pricing";
import { createOrder } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items } = body;

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

    // 1. Authoritative server-side pricing & stock calculation
    const calc = calculateOrderTotals(items);
    if (!calc.valid) {
      return NextResponse.json(
        { success: false, error: calc.error || "Invalid items in cart." },
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
