import { NextResponse } from "next/server";
import {
  fetchAdminCoupons,
  saveAdminCoupon,
  deleteAdminCoupon,
  AdminCoupon,
} from "@/lib/admin-api";

export async function GET() {
  try {
    const res = await fetchAdminCoupons();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }
    return NextResponse.json({ success: true, count: res.coupons.length, coupons: res.coupons });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AdminCoupon>;
    if (!body.code || !body.discountType || body.discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: "Code, discountType ('percentage' | 'fixed'), and discountValue are required" },
        { status: 400 }
      );
    }

    const res = await saveAdminCoupon(body);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const hardDelete = searchParams.get("hard") === "true";

    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const res = await deleteAdminCoupon(code, hardDelete);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
