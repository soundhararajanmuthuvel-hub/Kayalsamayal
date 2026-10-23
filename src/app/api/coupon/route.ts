import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_KAYAL_API_URL ||
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbz_9iJ_fMmsC8nU_Q7B4wzB0Yv3rA6G3M3t-XXXXXXXX/exec";

/**
 * GET /api/coupon
 * Returns active, currently valid coupons from the Google Sheet (Coupons tab).
 * Sets cache: "no-store" to ensure real-time single-source-of-truth accuracy.
 */
export async function GET() {
  try {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("XXXXXXXX")) {
      return NextResponse.json({
        success: false,
        coupons: [],
        error: "Google Apps Script API URL is not configured.",
      });
    }

    const res = await fetch(`${APPS_SCRIPT_URL}?action=getCoupons`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script returned HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return NextResponse.json({
        success: true,
        coupons: json.data,
      });
    }

    return NextResponse.json({
      success: true,
      coupons: [],
    });
  } catch (err) {
    console.warn("[API_COUPON_GET_ERROR]:", err);
    return NextResponse.json({
      success: false,
      coupons: [],
      error: "Unable to load coupons from sheet.",
    });
  }
}

/**
 * POST /api/coupon
 * Validates a coupon code against the Google Sheet (Coupons tab).
 * Body: { code: string, subtotal: number, customerPhone?: string, customerEmail?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = String(body.code || body.couponCode || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal !== undefined ? body.subtotal : body.cartSubtotal || 0);
    const phone = body.customerPhone || body.phone || body.customer?.mobile;
    const email = body.customerEmail || body.email || body.customer?.email;

    if (!rawCode) {
      return NextResponse.json(
        { success: false, valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("XXXXXXXX")) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "Coupon service is currently unavailable. Please continue without a coupon.",
        },
        { status: 503 }
      );
    }

    const payload = {
      action: "validateCoupon",
      code: rawCode,
      couponCode: rawCode,
      subtotal: Math.max(0, subtotal),
      customerPhone: phone ? String(phone).trim() : undefined,
      customerEmail: email ? String(email).trim() : undefined,
      customer: phone ? { mobile: phone, email: email } : undefined,
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script returned HTTP ${res.status}`);
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: unknown) {
    const errDetails = err instanceof Error ? err.message : String(err);
    console.error("[API_COUPON_POST_ERROR]:", errDetails);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: "Coupon service unavailable, continue without coupon?",
      },
      { status: 500 }
    );
  }
}
